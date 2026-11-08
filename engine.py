from __future__ import annotations

import base64
import csv
import difflib
import hashlib
import io
import json
import re
import zipfile
from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

import yaml
from docx import Document
from openpyxl import Workbook, load_workbook
from PIL import Image, ImageOps
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Image as PdfImage, PageBreak, Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib.styles import getSampleStyleSheet


@dataclass
class InputFile:
    name: str
    data: bytes


@dataclass
class OutputFile:
    name: str
    data: bytes
    mime: str


class ProcessingError(ValueError):
    pass


def safe_name(name: str, fallback: str = "file") -> str:
    leaf = Path(name.replace("\\", "/")).name
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", leaf).strip(" .")
    return (cleaned[:120] or fallback)


def output_name(name: str, suffix: str, ext: str) -> str:
    stem = Path(safe_name(name)).stem or "file"
    return f"{stem}-{suffix}.{ext.lstrip('.')}"


def detect_type(name: str, data: bytes) -> tuple[str, str]:
    ext = Path(name).suffix.lower()
    if not data:
        return "empty", "application/octet-stream"
    if data.startswith(b"%PDF-"):
        return "pdf", "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg", "image/jpeg"
    if data.startswith(b"BM"):
        return "bmp", "image/bmp"
    if data.startswith((b"II*\x00", b"MM\x00*")):
        return "tiff", "image/tiff"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
        return "gif", "image/gif"
    if data.startswith(b"\x1f\x8b"):
        return "gzip", "application/gzip"
    if data.startswith(b"PK\x03\x04") or data.startswith(b"PK\x05\x06"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                names = set(archive.namelist())
                if "word/document.xml" in names:
                    return "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                if "xl/workbook.xml" in names:
                    return "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        except (zipfile.BadZipFile, OSError):
            pass
        return "zip", "application/zip"
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return "binary", "application/octet-stream"
    if ext == ".json":
        return "json", "application/json"
    if ext == ".xml" or text.lstrip().startswith("<"):
        return "xml", "application/xml"
    if ext in (".yaml", ".yml"):
        return "yaml", "text/yaml"
    if ext == ".csv":
        return "csv", "text/csv"
    if ext in (".txt", ".md", ".b64"):
        return "text", "text/plain"
    if ext in {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff", ".docx", ".xlsx", ".zip"}:
        return "unknown", "application/octet-stream"
    return "text", "text/plain"


def require_type(item: InputFile, expected: set[str]) -> str:
    actual, _mime = detect_type(item.name, item.data)
    if actual not in expected:
        raise ProcessingError(f"{safe_name(item.name)}: file content is {actual}, not an accepted {', '.join(sorted(expected))}.")
    return actual


def parse_pages(value: str, count: int) -> list[int]:
    pages: set[int] = set()
    try:
        for part in value.split(","):
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                start, end = (int(bit.strip()) for bit in part.split("-", 1))
                if start > end:
                    raise ValueError
                pages.update(range(start - 1, end))
            else:
                pages.add(int(part) - 1)
    except ValueError as exc:
        raise ProcessingError("Enter page numbers like 1, 3-5 (pages start at 1).") from exc
    if not pages or min(pages) < 0 or max(pages) >= count:
        raise ProcessingError(f"Choose page numbers between 1 and {count}.")
    return sorted(pages)


def read_pdf(item: InputFile) -> PdfReader:
    require_type(item, {"pdf"})
    try:
        reader = PdfReader(io.BytesIO(item.data), strict=True)
        if reader.is_encrypted:
            raise ProcessingError("This PDF is password-protected. Unlocking is not enabled in this build.")
        if len(reader.pages) > 1000:
            raise ProcessingError("PDFs are limited to 1,000 pages per operation.")
        return reader
    except ProcessingError:
        raise
    except Exception as exc:
        raise ProcessingError(f"Could not read this PDF: {exc}") from exc


def make_pdf(doc: Document) -> bytes:
    body = io.BytesIO()
    pdf = SimpleDocTemplate(body, pagesize=letter, rightMargin=48, leftMargin=48, topMargin=48, bottomMargin=48)
    styles = getSampleStyleSheet()
    blocks: list[Any] = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            blocks.append(Paragraph(escape(text), styles["Normal"]))
            blocks.append(Spacer(1, 7))
    for table in doc.tables:
        for row in table.rows:
            blocks.append(Paragraph(escape("    |    ".join(cell.text for cell in row.cells)), styles["Normal"]))
    pdf.build(blocks or [Paragraph("(empty document)", styles["Normal"])])
    return body.getvalue()


def process_tool(tool_id: str, files: list[InputFile], options: dict[str, Any] | None = None) -> OutputFile:
    options = options or {}
    if not files:
        raise ProcessingError("Choose at least one file.")
    first = files[0]
    first_base = safe_name(first.name)

    if tool_id == "file-info":
        results = []
        for item in files:
            detected, mime = detect_type(item.name, item.data)
            results.append({"name": safe_name(item.name), "detected_type": detected, "mime": mime, "size_bytes": len(item.data), "sha256": hashlib.sha256(item.data).hexdigest()})
        return OutputFile(output_name(first_base, "info", "json"), json.dumps(results[0] if len(results) == 1 else results, indent=2).encode(), "application/json")

    if tool_id in {"sha256", "md5"}:
        algorithm = "sha256" if tool_id == "sha256" else "md5"
        rows = [f"{hashlib.new(algorithm, item.data).hexdigest()}  {safe_name(item.name)}" for item in files]
        return OutputFile(output_name(first_base, algorithm, "txt"), ("\n".join(rows) + "\n").encode(), "text/plain")

    if tool_id == "create-zip":
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            used: set[str] = set()
            for item in files:
                filename = safe_name(item.name)
                candidate, index = filename, 2
                while candidate.casefold() in used:
                    candidate = f"{Path(filename).stem}-{index}{Path(filename).suffix}"
                    index += 1
                used.add(candidate.casefold())
                archive.writestr(candidate, item.data)
        return OutputFile("filelab-archive.zip", buffer.getvalue(), "application/zip")

    if tool_id == "extract-zip" or tool_id == "archive-list":
        require_type(first, {"zip"})
        try:
            with zipfile.ZipFile(io.BytesIO(first.data)) as archive:
                entries = archive.infolist()
                if len(entries) > 2000:
                    raise ProcessingError("Archives are limited to 2,000 entries.")
                total = 0
                for entry in entries:
                    if entry.is_dir():
                        continue
                    total += entry.file_size
                    if entry.file_size > 100 * 1024 * 1024 or total > 200 * 1024 * 1024:
                        raise ProcessingError("Archive expands beyond the 200 MB safety limit.")
                    if entry.file_size > max(1, entry.compress_size) * 200:
                        raise ProcessingError("Archive contains a suspiciously compressed file; extraction stopped.")
                bad = archive.testzip()
                if bad:
                    raise ProcessingError(f"Archive entry failed its checksum: {safe_name(bad)}.")
                if tool_id == "archive-list":
                    lines = [f"{entry.file_size:>10} bytes  {safe_name(entry.filename)}" for entry in entries if not entry.is_dir()]
                    return OutputFile(output_name(first_base, "contents", "txt"), ("\n".join(lines) or "(empty archive)").encode(), "text/plain")
                result = io.BytesIO()
                used: set[str] = set()
                with zipfile.ZipFile(result, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as out:
                    for entry in entries:
                        if entry.is_dir() or (entry.external_attr >> 16) & 0o170000 == 0o120000:
                            continue
                        leaf = safe_name(entry.filename, "file")
                        candidate, index = leaf, 2
                        while candidate.casefold() in used:
                            candidate = f"{Path(leaf).stem}-{index}{Path(leaf).suffix}"
                            index += 1
                        used.add(candidate.casefold())
                        out.writestr(candidate, archive.read(entry))
                return OutputFile(output_name(first_base, "extracted", "zip"), result.getvalue(), "application/zip")
        except ProcessingError:
            raise
        except (zipfile.BadZipFile, OSError, RuntimeError) as exc:
            raise ProcessingError(f"Could not safely read the ZIP archive: {exc}") from exc

    if tool_id.startswith("pdf-"):
        readers = [read_pdf(item) for item in files]
        if tool_id == "pdf-text":
            text = "\n\n".join(page.extract_text() or "" for page in readers[0].pages)
            return OutputFile(output_name(first_base, "text", "txt"), text.encode("utf-8"), "text/plain")
        if tool_id == "pdf-docx":
            doc = Document()
            for index, page in enumerate(readers[0].pages):
                if index:
                    doc.add_page_break()
                text = page.extract_text() or ""
                for line in text.splitlines() or [""]:
                    doc.add_paragraph(line)
            result = io.BytesIO()
            doc.save(result)
            return OutputFile(output_name(first_base, "text", "docx"), result.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        writer = PdfWriter()
        if tool_id == "pdf-merge":
            for reader in readers:
                for page in reader.pages:
                    writer.add_page(page)
            out_name = "filelab-merged.pdf"
        elif tool_id == "pdf-split":
            result = io.BytesIO()
            with zipfile.ZipFile(result, "w", zipfile.ZIP_DEFLATED) as archive:
                for index, page in enumerate(readers[0].pages, start=1):
                    page_writer = PdfWriter()
                    page_writer.add_page(page)
                    part = io.BytesIO()
                    page_writer.write(part)
                    archive.writestr(f"page-{index:03}.pdf", part.getvalue())
            return OutputFile(output_name(first_base, "pages", "zip"), result.getvalue(), "application/zip")
        elif tool_id == "pdf-extract":
            selected = parse_pages(str(options.get("pages", "1")), len(readers[0].pages))
            for index in selected:
                writer.add_page(readers[0].pages[index])
            out_name = output_name(first_base, "pages", "pdf")
        elif tool_id == "pdf-rotate":
            degrees = int(options.get("degrees", 90))
            if degrees not in {90, 180, 270}:
                raise ProcessingError("Rotation must be 90, 180 or 270 degrees.")
            for page in readers[0].pages:
                page.rotate(degrees)
                writer.add_page(page)
            out_name = output_name(first_base, "rotated", "pdf")
        elif tool_id == "pdf-page-numbers":
            for index, page in enumerate(readers[0].pages, start=1):
                overlay = io.BytesIO()
                from reportlab.pdfgen.canvas import Canvas
                width, height = float(page.mediabox.width), float(page.mediabox.height)
                canvas = Canvas(overlay, pagesize=(width, height))
                canvas.setFont("Helvetica", 9)
                canvas.drawCentredString(width / 2, 22, str(index))
                canvas.save()
                overlay_reader = PdfReader(overlay)
                writer.add_page(page)
                writer.pages[-1].merge_page(overlay_reader.pages[0])
            out_name = output_name(first_base, "numbered", "pdf")
        elif tool_id == "pdf-strip-metadata":
            for page in readers[0].pages:
                writer.add_page(page)
            writer.add_metadata({})
            out_name = output_name(first_base, "clean", "pdf")
        elif tool_id == "pdf-compress":
            for page in readers[0].pages:
                writer.add_page(page)
                writer.pages[-1].compress_content_streams()
            out_name = output_name(first_base, "compressed", "pdf")
        else:
            raise ProcessingError("This PDF operation is not implemented.")
        result = io.BytesIO()
        writer.write(result)
        return OutputFile(out_name, result.getvalue(), "application/pdf")

    if tool_id.startswith("image-") or tool_id == "images-to-pdf":
        opened: list[Image.Image] = []
        for item in files:
            require_type(item, {"jpeg", "png", "webp", "gif", "bmp", "tiff"})
            try:
                image = Image.open(io.BytesIO(item.data))
                image.seek(0)
                opened.append(ImageOps.exif_transpose(image).copy())
            except Exception as exc:
                raise ProcessingError(f"Could not open image {safe_name(item.name)}: {exc}") from exc
        image = opened[0]
        source_format = {".jpg": "JPEG", ".jpeg": "JPEG", ".png": "PNG", ".webp": "WEBP", ".bmp": "BMP", ".tif": "TIFF", ".tiff": "TIFF"}.get(Path(first.name).suffix.lower(), "PNG")
        if tool_id == "image-info":
            payload = {"name": first_base, "format": source_format, "width": image.width, "height": image.height, "mode": image.mode, "megapixels": round(image.width * image.height / 1_000_000, 2)}
            return OutputFile(output_name(first_base, "dimensions", "json"), json.dumps(payload, indent=2).encode(), "application/json")
        if tool_id == "images-to-pdf":
            from reportlab.lib.utils import ImageReader as Reader
            from reportlab.pdfgen.canvas import Canvas
            result = io.BytesIO()
            canvas = Canvas(result, pagesize=letter)
            page_w, page_h = letter
            for current in opened:
                current = current.convert("RGB")
                scale = min((page_w - 72) / current.width, (page_h - 72) / current.height)
                w, h = current.width * scale, current.height * scale
                canvas.drawImage(Reader(current), (page_w - w) / 2, (page_h - h) / 2, w, h)
                canvas.showPage()
            canvas.save()
            return OutputFile("images.pdf", result.getvalue(), "application/pdf")
        if tool_id == "image-jpg-png":
            ext, fmt = "png", "PNG"
        elif tool_id == "image-png-jpg":
            ext, fmt = "jpg", "JPEG"
        elif tool_id == "image-png-webp" or tool_id == "image-jpg-webp":
            ext, fmt = "webp", "WEBP"
        elif tool_id == "image-webp-png" or tool_id in {"image-rotate", "image-flip", "image-resize"}:
            ext, fmt = "png", "PNG"
        elif tool_id in {"image-compress", "image-strip-metadata"}:
            fmt = source_format.upper()
            if fmt not in {"JPEG", "PNG", "WEBP"}:
                fmt = "PNG"
            ext = "jpg" if fmt == "JPEG" else fmt.lower()
        else:
            raise ProcessingError("This image operation is not implemented.")
        if tool_id == "image-rotate":
            image = image.rotate(-90, expand=True)
        elif tool_id == "image-flip":
            image = ImageOps.mirror(image)
        elif tool_id == "image-resize":
            max_width = int(options.get("width", 1200))
            if not 1 <= max_width <= 12000:
                raise ProcessingError("Maximum width must be between 1 and 12,000 pixels.")
            if image.width > max_width:
                height = max(1, round(image.height * max_width / image.width))
                image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        save_image = image
        if fmt == "JPEG" and save_image.mode not in {"RGB", "L"}:
            rgba = save_image.convert("RGBA")
            background = Image.new("RGB", rgba.size, "white")
            background.paste(rgba, mask=rgba.getchannel("A"))
            save_image = background
        result = io.BytesIO()
        kwargs = {"quality": int(options.get("quality", 82))} if fmt in {"JPEG", "WEBP"} else {"optimize": True}
        if "quality" in kwargs and not 1 <= kwargs["quality"] <= 95:
            raise ProcessingError("Image quality must be between 1 and 95.")
        save_image.save(result, format=fmt, **kwargs)
        mime = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}[fmt]
        return OutputFile(output_name(first_base, "converted", ext), result.getvalue(), mime)

    if tool_id in {"docx-text", "docx-pdf"}:
        require_type(first, {"docx"})
        try:
            doc = Document(io.BytesIO(first.data))
        except Exception as exc:
            raise ProcessingError(f"Could not read the Word document: {exc}") from exc
        if tool_id == "docx-pdf":
            return OutputFile(output_name(first_base, "converted", "pdf"), make_pdf(doc), "application/pdf")
        lines = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            lines.extend("\t".join(cell.text for cell in row.cells) for row in table.rows)
        return OutputFile(output_name(first_base, "text", "txt"), "\n".join(lines).encode(), "text/plain")

    if tool_id == "xlsx-csv":
        require_type(first, {"xlsx"})
        try:
            workbook = load_workbook(io.BytesIO(first.data), read_only=True, data_only=True)
            sheet = workbook.worksheets[0]
            output = io.StringIO(newline="")
            writer = csv.writer(output)
            for row in sheet.iter_rows(values_only=True):
                writer.writerow(["" if value is None else value for value in row])
            workbook.close()
            return OutputFile(output_name(first_base, "sheet", "csv"), output.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8")
        except Exception as exc:
            raise ProcessingError(f"Could not read the spreadsheet: {exc}") from exc

    if tool_id == "csv-xlsx":
        require_type(first, {"csv"})
        try:
            source = io.StringIO(first.data.decode("utf-8-sig"), newline="")
            workbook = Workbook(write_only=True)
            sheet = workbook.create_sheet("Sheet1")
            for row in csv.reader(source):
                sheet.append(row)
            result = io.BytesIO()
            workbook.save(result)
            return OutputFile(output_name(first_base, "converted", "xlsx"), result.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        except Exception as exc:
            raise ProcessingError(f"Could not parse this CSV: {exc}") from exc

    if tool_id == "text-pdf":
        text = first.data.decode("utf-8-sig")
        result = io.BytesIO()
        styles = getSampleStyleSheet()
        paragraphs = [Paragraph(escape(line) or "&nbsp;", styles["Normal"]) for line in text.splitlines()]
        SimpleDocTemplate(result, pagesize=letter).build(paragraphs or [Paragraph("&nbsp;", styles["Normal"])])
        return OutputFile(output_name(first_base, "converted", "pdf"), result.getvalue(), "application/pdf")

    if tool_id in {"json-format", "json-csv", "csv-json", "yaml-json", "json-yaml", "xml-format", "base64-encode", "base64-decode"}:
        if tool_id == "base64-encode":
            text = base64.b64encode(first.data).decode("ascii")
            return OutputFile(output_name(first_base, "base64", "txt"), text.encode(), "text/plain")
        if tool_id == "base64-decode":
            try:
                decoded = base64.b64decode(first.data.strip(), validate=True)
            except Exception as exc:
                raise ProcessingError("The input is not valid Base64 text.") from exc
            return OutputFile(output_name(first_base, "decoded", "bin"), decoded, "application/octet-stream")
        try:
            text = first.data.decode("utf-8-sig")
            if tool_id in {"json-format", "json-csv", "json-yaml"}:
                value = json.loads(text)
                if tool_id == "json-format":
                    return OutputFile(output_name(first_base, "formatted", "json"), (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode(), "application/json")
                if tool_id == "json-yaml":
                    result = yaml.safe_dump(value, allow_unicode=True, sort_keys=False).encode()
                    return OutputFile(output_name(first_base, "converted", "yaml"), result, "text/yaml")
                if not isinstance(value, list) or any(not isinstance(row, dict) for row in value):
                    raise ProcessingError("JSON to CSV expects an array of objects.")
                columns = list(dict.fromkeys(key for row in value for key in row))
                result = io.StringIO(newline="")
                writer = csv.DictWriter(result, fieldnames=columns, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(value)
                return OutputFile(output_name(first_base, "converted", "csv"), result.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8")
            if tool_id == "csv-json":
                rows = list(csv.DictReader(io.StringIO(text, newline="")))
                return OutputFile(output_name(first_base, "converted", "json"), (json.dumps(rows, ensure_ascii=False, indent=2) + "\n").encode(), "application/json")
            if tool_id == "yaml-json":
                value = yaml.safe_load(text)
                return OutputFile(output_name(first_base, "converted", "json"), (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode(), "application/json")
            if "<!doctype" in text.lower() or "<!entity" in text.lower():
                raise ProcessingError("XML DTD and entity declarations are not allowed.")
            root = ET.fromstring(text)
            ET.indent(root, space="  ")
            result = ET.tostring(root, encoding="unicode", xml_declaration=True)
            return OutputFile(output_name(first_base, "formatted", "xml"), (result + "\n").encode(), "application/xml")
        except ProcessingError:
            raise
        except (UnicodeDecodeError, json.JSONDecodeError, yaml.YAMLError, ET.ParseError, csv.Error) as exc:
            raise ProcessingError(f"Could not parse this file: {exc}") from exc

    if tool_id == "compare-text":
        if len(files) != 2:
            raise ProcessingError("Drop exactly two text files to compare.")
        try:
            left, right = (item.data.decode("utf-8-sig").splitlines(keepends=True) for item in files)
        except UnicodeDecodeError as exc:
            raise ProcessingError("Both files must be UTF-8 text.") from exc
        diff = difflib.unified_diff(left, right, fromfile=safe_name(files[0].name), tofile=safe_name(files[1].name))
        text = "".join(diff) or "Files are identical.\n"
        return OutputFile("comparison.txt", text.encode(), "text/plain")

    raise ProcessingError("This operation is not available in this build.")
