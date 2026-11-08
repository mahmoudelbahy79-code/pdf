from __future__ import annotations

import csv
import io
import json
import re
import sys
import unittest
import warnings
import zipfile
from pathlib import Path

warnings.filterwarnings("ignore", message="Using `httpx` with `starlette.testclient` is deprecated")

from docx import Document
from fastapi.testclient import TestClient
from openpyxl import load_workbook
from PIL import Image
from pypdf import PdfReader
from reportlab.pdfgen.canvas import Canvas

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine import InputFile, ProcessingError, process_tool, safe_name
from main import MAX_FILE_BYTES, TOOL_MAP, app, validate_input


def make_pdf(label: str) -> bytes:
    stream = io.BytesIO()
    canvas = Canvas(stream)
    canvas.drawString(72, 720, label)
    canvas.save()
    return stream.getvalue()


def make_image(fmt: str = "PNG", size: tuple[int, int] = (320, 160)) -> bytes:
    stream = io.BytesIO()
    Image.new("RGB", size, (80, 120, 210)).save(stream, fmt)
    return stream.getvalue()


def make_docx() -> bytes:
    document = Document()
    document.add_paragraph("FILELAB sample paragraph")
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "Name"
    table.cell(0, 1).text = "Value"
    stream = io.BytesIO()
    document.save(stream)
    return stream.getvalue()


def make_xlsx() -> bytes:
    from openpyxl import Workbook
    workbook = Workbook()
    workbook.active.append(["Name", "Score"])
    workbook.active.append(["Ari", 42])
    stream = io.BytesIO()
    workbook.save(stream)
    return stream.getvalue()


def make_zip(entries: list[tuple[str, bytes]] | None = None) -> bytes:
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in entries or [("notes.txt", b"hello")]:
            archive.writestr(name, data)
    return stream.getvalue()


def fixtures() -> dict[str, list[InputFile]]:
    pdf_a = InputFile("one.pdf", make_pdf("One page"))
    pdf_b = InputFile("two.pdf", make_pdf("Second page"))
    png = InputFile("photo.png", make_image())
    jpg = InputFile("photo.jpg", make_image("JPEG"))
    webp = InputFile("photo.webp", make_image("WEBP"))
    docx = InputFile("sample.docx", make_docx())
    xlsx = InputFile("sample.xlsx", make_xlsx())
    csv_file = InputFile("sample.csv", b"Name,Score\nAri,42\n")
    json_file = InputFile("sample.json", b'{"items":[{"name":"Ari"}]}')
    return {
        "pdf-compress": [pdf_a], "pdf-merge": [pdf_a, pdf_b], "pdf-split": [pdf_a],
        "pdf-extract": [pdf_a], "pdf-rotate": [pdf_a], "pdf-page-numbers": [pdf_a],
        "pdf-text": [pdf_a], "pdf-docx": [pdf_a], "pdf-strip-metadata": [pdf_a],
        "images-to-pdf": [png, jpg], "image-jpg-png": [jpg], "image-png-jpg": [png],
        "image-png-webp": [png], "image-jpg-webp": [jpg], "image-webp-png": [webp],
        "image-compress": [jpg], "image-resize": [png], "image-rotate": [png],
        "image-flip": [png], "image-strip-metadata": [jpg], "image-info": [png],
        "docx-text": [docx], "docx-pdf": [docx], "xlsx-csv": [xlsx], "csv-xlsx": [csv_file],
        "text-pdf": [InputFile("notes.txt", b"A short test paragraph.")],
        "create-zip": [InputFile("notes.txt", b"hello"), InputFile("table.csv", b"a,b\n1,2")],
        "extract-zip": [InputFile("bundle.zip", make_zip())], "archive-list": [InputFile("bundle.zip", make_zip())],
        "json-format": [json_file], "json-csv": [InputFile("rows.json", b'[{"name":"Ari","score":42}]')],
        "csv-json": [csv_file], "yaml-json": [InputFile("data.yaml", b"name: Ari\nscore: 42\n")],
        "json-yaml": [json_file], "xml-format": [InputFile("data.xml", b"<root><name>Ari</name></root>")],
        "base64-encode": [InputFile("binary.dat", b"\x00\x01FILELAB")],
        "base64-decode": [InputFile("encoded.txt", b"AAFGSUxFTEFC")],
        "sha256": [InputFile("sample.txt", b"hello")], "md5": [InputFile("sample.txt", b"hello")],
        "compare-text": [InputFile("left.txt", b"alpha\nbeta\n"), InputFile("right.txt", b"alpha\ngamma\n")],
        "file-info": [InputFile("sample.pdf", make_pdf("info"))],
    }


class ToolSmokeTests(unittest.TestCase):
    def test_static_browser_catalog_is_a_subset_of_implemented_tools(self) -> None:
        root = Path(__file__).resolve().parents[1]
        availability = json.loads((root / "feature-availability.json").read_text())
        catalog = json.loads((root / "static" / "registry.json").read_text())
        ids = [tool["id"] for tool in catalog]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(set(ids).issubset(availability["implemented"]))
        self.assertNotIn("md5", ids)
        engine = (root / "static" / "netlify-engine.js").read_text()
        match = re.search(r"const supportedIds = \[(.*?)\];", engine, re.S)
        self.assertIsNotNone(match)
        self.assertEqual(ids, re.findall(r'"([^"]+)"', match.group(1)))

    def test_availability_registry_matches_live_tools(self) -> None:
        availability = json.loads((Path(__file__).resolve().parents[1] / "feature-availability.json").read_text())
        self.assertEqual(set(availability["implemented"]), set(TOOL_MAP))
        self.assertTrue(set(availability["implemented_with_limitations"]).issubset(TOOL_MAP))

    def test_every_registered_tool_creates_a_real_output(self) -> None:
        samples = fixtures()
        self.assertEqual(set(samples), set(TOOL_MAP))
        for tool_id, inputs in samples.items():
            with self.subTest(tool=tool_id):
                output = process_tool(tool_id, inputs, {"pages": "1", "degrees": "90", "width": 100, "quality": 72})
                self.assertTrue(output.name and output.data and output.mime)
                if output.name.endswith(".pdf"):
                    self.assertTrue(output.data.startswith(b"%PDF-"))
                    self.assertGreater(len(PdfReader(io.BytesIO(output.data)).pages), 0)
                elif output.name.endswith(".png") or output.name.endswith(".jpg") or output.name.endswith(".webp"):
                    with Image.open(io.BytesIO(output.data)) as image:
                        image.verify()
                elif output.name.endswith(".docx"):
                    self.assertGreater(len(Document(io.BytesIO(output.data)).paragraphs), 0)
                elif output.name.endswith(".xlsx"):
                    workbook = load_workbook(io.BytesIO(output.data), read_only=True)
                    self.assertIsNotNone(workbook.active)
                    workbook.close()
                elif output.name.endswith(".zip"):
                    with zipfile.ZipFile(io.BytesIO(output.data)) as archive:
                        self.assertIsNone(archive.testzip())
                        self.assertTrue(archive.namelist())
                elif output.name.endswith(".json"):
                    json.loads(output.data)
                elif output.name.endswith(".csv"):
                    list(csv.reader(io.StringIO(output.data.decode("utf-8-sig"))))
                elif output.name.endswith(".xml"):
                    import xml.etree.ElementTree as ET
                    ET.fromstring(output.data)
                elif output.name.endswith(".yaml"):
                    import yaml
                    yaml.safe_load(output.data)
                elif output.name.endswith(".txt"):
                    output.data.decode("utf-8")

    def test_pdf_combine_extract_split_and_rotation(self) -> None:
        one, two = fixtures()["pdf-merge"]
        merged = process_tool("pdf-merge", [one, two])
        self.assertEqual(len(PdfReader(io.BytesIO(merged.data)).pages), 2)
        extract = process_tool("pdf-extract", [one], {"pages": "1"})
        self.assertEqual(len(PdfReader(io.BytesIO(extract.data)).pages), 1)
        with self.assertRaises(ProcessingError):
            process_tool("pdf-extract", [one], {"pages": "9"})
        split = process_tool("pdf-split", [merged])
        with zipfile.ZipFile(io.BytesIO(split.data)) as archive:
            self.assertEqual(len(archive.namelist()), 2)
        rotated = process_tool("pdf-rotate", [one], {"degrees": 90})
        self.assertEqual(len(PdfReader(io.BytesIO(rotated.data)).pages), 1)

    def test_zip_repack_removes_traversal_paths(self) -> None:
        hostile = InputFile("bad.zip", make_zip([("../../outside.txt", b"safe content")]))
        output = process_tool("extract-zip", [hostile])
        with zipfile.ZipFile(io.BytesIO(output.data)) as archive:
            self.assertEqual(archive.namelist(), ["outside.txt"])
            self.assertEqual(archive.read("outside.txt"), b"safe content")

    def test_safe_name_preserves_arabic_and_removes_path_separators(self) -> None:
        self.assertEqual(safe_name("../ملف:مهم.txt"), "ملف_مهم.txt")

    def test_csv_spreadsheet_and_document_payloads_round_trip(self) -> None:
        data = process_tool("csv-json", fixtures()["csv-json"])
        self.assertEqual(json.loads(data.data)[0]["Name"], "Ari")
        workbook = process_tool("csv-xlsx", fixtures()["csv-xlsx"])
        loaded = load_workbook(io.BytesIO(workbook.data), read_only=True)
        self.assertEqual(loaded.active["A2"].value, "Ari")
        loaded.close()
        pdf = process_tool("docx-pdf", fixtures()["docx-pdf"])
        self.assertIn("FILELAB", PdfReader(io.BytesIO(pdf.data)).pages[0].extract_text())

    def test_image_resize_and_rotation_dimensions(self) -> None:
        image = fixtures()["image-resize"][0]
        resized = process_tool("image-resize", [image], {"width": 100})
        with Image.open(io.BytesIO(resized.data)) as output:
            self.assertEqual(output.size, (100, 50))
        rotated = process_tool("image-rotate", [image])
        with Image.open(io.BytesIO(rotated.data)) as output:
            self.assertEqual(output.size, (160, 320))

    def test_signature_extension_and_empty_input_validation(self) -> None:
        tool = TOOL_MAP["pdf-text"]
        with self.assertRaises(ProcessingError):
            validate_input(tool, InputFile("disguised.pdf", b"not a PDF"))
        with self.assertRaises(ProcessingError):
            validate_input(tool, InputFile("notes.txt", b"text"))
        with self.assertRaises(ProcessingError):
            validate_input(tool, InputFile("empty.pdf", b""))
        with self.assertRaises(ProcessingError):
            validate_input(tool, InputFile("oversized.pdf", b"%PDF-" + b"x" * MAX_FILE_BYTES))

    def test_xml_rejects_entity_declarations_and_json_errors_are_reported(self) -> None:
        with self.assertRaisesRegex(ProcessingError, "entity"):
            process_tool("xml-format", [InputFile("unsafe.xml", b"<!DOCTYPE a [<!ENTITY x 'y'>]><a>&x;</a>")])
        with self.assertRaises(ProcessingError):
            process_tool("json-format", [InputFile("broken.json", b"{oops")])


class ApiFlowTests(unittest.TestCase):
    def test_static_site_assets_and_catalog_are_served(self) -> None:
        with TestClient(app) as client:
            self.assertIn("FILELAB", client.get("/").text)
            self.assertEqual(client.get("/app.js").status_code, 200)
            self.assertEqual(client.get("/netlify-engine.js").status_code, 200)
            catalog = client.get("/registry.json").json()
            self.assertEqual(len(catalog), 40)

    def test_local_job_status_download_and_zip_bundle(self) -> None:
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").json()["mode"], "local")
            self.assertEqual(len(client.get("/api/tools").json()["tools"]), len(TOOL_MAP))
            created = client.post("/api/jobs", data={"tool_id": "json-format", "options": "{}"}, files={"files": ("data.json", b'{"name":"FILELAB"}', "application/json")})
            self.assertEqual(created.status_code, 202)
            job_id = created.json()["job_id"]
            status = client.get(f"/api/jobs/{job_id}").json()
            self.assertEqual(status["status"], "completed")
            self.assertEqual(json.loads(client.get(status["download_url"]).content)["name"], "FILELAB")
            bundled = client.post("/api/bundle", json={"job_ids": [job_id]})
            self.assertEqual(bundled.status_code, 200)
            with zipfile.ZipFile(io.BytesIO(bundled.content)) as archive:
                self.assertEqual(archive.namelist(), ["data-formatted.json"])
                self.assertEqual(json.loads(archive.read(archive.namelist()[0]))["name"], "FILELAB")
            renamed = client.post("/api/bundle", json={"job_ids": [job_id], "output_names": {job_id: "نتيجة جديدة.csv"}})
            with zipfile.ZipFile(io.BytesIO(renamed.content)) as archive:
                self.assertEqual(archive.namelist(), ["نتيجة جديدة.json"])
            removed = client.post("/api/cleanup", json={"job_ids": [job_id]})
            self.assertEqual(removed.json()["removed"], 1)
            self.assertEqual(client.get(f"/api/jobs/{job_id}/download").status_code, 404)

    def test_invalid_file_signature_is_a_client_error(self) -> None:
        with TestClient(app) as client:
            response = client.post("/api/jobs", data={"tool_id": "pdf-text", "options": "{}"}, files={"files": ("imposter.pdf", b"not a PDF", "application/pdf")})
            self.assertEqual(response.status_code, 400)
            self.assertIn("valid PDF", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
