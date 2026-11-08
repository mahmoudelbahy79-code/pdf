(() => {
  const CDN = "https://cdn.jsdelivr.net/npm";
  const scriptPromises = new Map();
  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
  const supportedIds = [
    "pdf-compress", "pdf-merge", "pdf-split", "pdf-extract", "pdf-rotate", "pdf-page-numbers", "pdf-text", "pdf-docx", "pdf-strip-metadata",
    "images-to-pdf", "image-jpg-png", "image-png-jpg", "image-png-webp", "image-jpg-webp", "image-webp-png", "image-compress", "image-resize", "image-rotate", "image-flip", "image-strip-metadata", "image-info",
    "docx-text", "docx-pdf", "xlsx-csv", "csv-xlsx", "text-pdf", "create-zip", "extract-zip", "archive-list",
    "json-format", "json-csv", "csv-json", "yaml-json", "json-yaml", "xml-format", "base64-encode", "base64-decode", "sha256", "compare-text", "file-info"
  ];

  const loadScript = (key, src, test) => {
    if (test()) return Promise.resolve();
    if (scriptPromises.has(key)) return scriptPromises.get(key);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        if (test()) resolve();
        else { scriptPromises.delete(key); reject(new Error(`${key} did not load.`)); }
      };
      script.onerror = () => {
        scriptPromises.delete(key);
        reject(new Error(`Could not load ${key}. Check your internet connection and try again.`));
      };
      document.head.append(script);
    });
    scriptPromises.set(key, promise);
    return promise;
  };
  const pdfLib = async () => {
    await loadScript("PDF engine", `${CDN}/pdf-lib@1.17.1/dist/pdf-lib.min.js`, () => !!window.PDFLib);
    return window.PDFLib;
  };
  const zipLib = () => loadScript("ZIP engine", `${CDN}/jszip@3.10.1/dist/jszip.min.js`, () => !!window.JSZip);
  const sheetLib = () => loadScript("Spreadsheet engine", "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js", () => !!window.XLSX);
  const yamlLib = () => loadScript("YAML engine", `${CDN}/js-yaml@4.1.0/dist/js-yaml.min.js`, () => !!window.jsyaml);
  const mammothLib = () => loadScript("Word engine", `${CDN}/mammoth@1.9.0/mammoth.browser.min.js`, () => !!window.mammoth);
  const docxLib = () => loadScript("DOCX engine", `${CDN}/docx@8.5.0/build/index.umd.js`, () => !!window.docx?.Document);
  const pdfJsLib = () => {
    if (window.__filelabPdfJs) return Promise.resolve(window.__filelabPdfJs);
    if (!window.__filelabPdfJsPromise) {
      window.__filelabPdfJsPromise = import(`${CDN}/pdfjs-dist@4.10.38/build/pdf.min.mjs`).then((module) => {
        module.GlobalWorkerOptions.workerSrc = `${CDN}/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
        window.__filelabPdfJs = module;
        return module;
      }).catch(() => { throw new Error("Could not load the PDF text engine. Check your internet connection and try again."); });
    }
    return window.__filelabPdfJsPromise;
  };
  const asBlob = (name, data, mime = "application/octet-stream") => ({ name, blob: data instanceof Blob ? data : new Blob([data], { type: mime }) });
  const named = (file, suffix, extension) => `${file.name.replace(/\.[^.]+$/, "") || "file"}-${suffix}.${extension}`;
  const textOf = async (file) => file.text();
  const readPdf = async (file) => {
    const { PDFDocument } = await pdfLib();
    try { return await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false }); }
    catch { throw new Error("Could not open this PDF. Password-protected or damaged PDFs are not supported."); }
  };
  const savePdf = async (document) => new Blob([await document.save({ useObjectStreams: true })], { type: "application/pdf" });
  const parsePages = (input, total) => {
    const pages = new Set();
    try {
      for (const part of String(input || "1").split(",")) {
        const range = part.trim().split("-").map(Number);
        if (range.some((number) => !Number.isInteger(number))) throw new Error();
        if (range.length === 1) pages.add(range[0] - 1);
        else if (range.length === 2 && range[0] <= range[1]) for (let page = range[0]; page <= range[1]; page++) pages.add(page - 1);
        else throw new Error();
      }
    } catch { throw new Error("Enter page numbers like 1, 3-5 (pages start at 1)."); }
    if (!pages.size || Math.min(...pages) < 0 || Math.max(...pages) >= total) throw new Error(`Choose page numbers between 1 and ${total}.`);
    return [...pages].sort((a, b) => a - b);
  };
  const imageCanvas = async (file, action = "", options = {}) => {
    let bitmap;
    try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch { throw new Error(`This browser cannot decode ${file.name}. Try JPEG, PNG, or WEBP.`); }
    let width = bitmap.width, height = bitmap.height;
    if (action === "image-resize" && width > Number(options.width || 1200)) {
      const scale = Number(options.width || 1200) / width;
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    if (action === "image-rotate") [width, height] = [height, width];
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (action === "image-png-jpg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
    }
    if (action === "image-rotate") {
      context.translate(width / 2, height / 2);
      context.rotate(Math.PI / 2);
      context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    } else if (action === "image-flip") {
      context.translate(width, 0);
      context.scale(-1, 1);
      context.drawImage(bitmap, 0, 0, width, height);
    } else {
      context.drawImage(bitmap, 0, 0, width, height);
    }
    bitmap.close();
    return canvas;
  };
  const canvasBlob = (canvas, mime, quality) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(`${mime} encoding is not available in this browser.`)), mime, quality));
  const csvRows = (text) => {
    text = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      if (quoted && char === '"' && text[index + 1] === '"') { cell += '"'; index++; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && text[index + 1] === "\n") index++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += char;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };
  const csvCell = (value) => {
    const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const makePdfText = async (text) => {
    const { PDFDocument, StandardFonts } = await pdfLib();
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const lines = text.split(/\r?\n/).flatMap((line) => line.match(/.{1,92}(?:\s|$)|.{1,92}/g) || [""]);
    let page, y;
    for (const line of lines) {
      try { font.encodeText(line); } catch { throw new Error("Text-to-PDF currently supports characters in the standard PDF font set."); }
      if (!page || y < 48) { page = pdf.addPage([612, 792]); y = 744; }
      page.drawText(line || " ", { x: 48, y, size: 10, font, maxWidth: 516 });
      y -= 14;
    }
    return savePdf(pdf);
  };
  const pdfText = async (file) => {
    const pdfjs = await pdfJsLib();
    let document;
    try { document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), disableWorker: true }).promise; }
    catch { throw new Error("Could not read this PDF. Password-protected or damaged files are not supported."); }
    const pages = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n\n");
  };
  const docxFromText = async (text) => {
    await docxLib();
    const { Document, Packer, Paragraph } = window.docx;
    const document = new Document({ sections: [{ children: text.split(/\r?\n/).map((line) => new Paragraph({ text: line })) }] });
    return Packer.toBlob(document);
  };
  const wordText = async (file) => {
    await mammothLib();
    try { return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value; }
    catch { throw new Error("Could not read this DOCX file."); }
  };
  const imageOutput = async (toolId, file, options) => {
    const canvas = await imageCanvas(file, toolId, options);
    if (toolId === "image-info") return asBlob(named(file, "dimensions", "json"), JSON.stringify({ name: file.name, width: canvas.width, height: canvas.height, format: file.type }, null, 2), "application/json");
    let mime = file.type || "image/png", extension = file.name.split(".").pop().toLowerCase();
    if (toolId === "image-jpg-png" || toolId === "image-webp-png" || ["image-resize", "image-rotate", "image-flip"].includes(toolId)) { mime = "image/png"; extension = "png"; }
    else if (toolId === "image-png-jpg") { mime = "image/jpeg"; extension = "jpg"; }
    else if (["image-png-webp", "image-jpg-webp"].includes(toolId)) { mime = "image/webp"; extension = "webp"; }
    else if (toolId === "image-compress" && !["image/jpeg", "image/webp"].includes(mime)) mime = "image/png";
    else if (toolId === "image-strip-metadata" && extension === "bmp") { mime = "image/png"; extension = "png"; }
    const quality = Math.max(0.01, Math.min(0.95, Number(options.quality || 82) / 100));
    const blob = await canvasBlob(canvas, mime, quality);
    if (blob.type !== mime) throw new Error(`${mime} output is not supported by this browser.`);
    return asBlob(named(file, "converted", extension), blob, mime);
  };
  const pdfOperation = async (toolId, files, options) => {
    const { PDFDocument, degrees, rgb, StandardFonts } = await pdfLib();
    if (toolId === "pdf-text") return asBlob(named(files[0], "text", "txt"), await pdfText(files[0]), "text/plain");
    if (toolId === "pdf-docx") return asBlob(named(files[0], "text", "docx"), await docxFromText(await pdfText(files[0])), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (toolId === "text-pdf") return asBlob(named(files[0], "converted", "pdf"), await makePdfText(await textOf(files[0])), "application/pdf");
    if (toolId === "docx-pdf") return asBlob(named(files[0], "converted", "pdf"), await makePdfText(await wordText(files[0])), "application/pdf");
    if (toolId === "pdf-merge") {
      const output = await PDFDocument.create();
      for (const file of files) {
        const input = await readPdf(file);
        for (const page of await output.copyPages(input, input.getPageIndices())) output.addPage(page);
      }
      return asBlob("filelab-merged.pdf", await savePdf(output), "application/pdf");
    }
    const pdf = await readPdf(files[0]);
    const pages = pdf.getPages();
    if (toolId === "pdf-split") {
      await zipLib();
      const zip = new window.JSZip();
      for (let index = 0; index < pages.length; index++) {
        const part = await PDFDocument.create();
        const [page] = await part.copyPages(pdf, [index]);
        part.addPage(page);
        zip.file(`page-${String(index + 1).padStart(3, "0")}.pdf`, await part.save());
      }
      return asBlob(named(files[0], "pages", "zip"), await zip.generateAsync({ type: "blob" }), "application/zip");
    }
    if (toolId === "pdf-extract") {
      const selected = parsePages(options.pages, pages.length);
      const output = await PDFDocument.create();
      for (const page of await output.copyPages(pdf, selected)) output.addPage(page);
      return asBlob(named(files[0], "pages", "pdf"), await savePdf(output), "application/pdf");
    }
    if (toolId === "pdf-rotate") {
      const angle = Number(options.degrees || 90);
      if (![90, 180, 270].includes(angle)) throw new Error("Rotation must be 90, 180, or 270 degrees.");
      for (const page of pages) page.setRotation(degrees((page.getRotation().angle + angle) % 360));
      return asBlob(named(files[0], "rotated", "pdf"), await savePdf(pdf), "application/pdf");
    }
    if (toolId === "pdf-page-numbers") {
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      pages.forEach((page, index) => {
        const { width } = page.getSize();
        page.drawText(String(index + 1), { x: width / 2 - 5, y: 20, size: 9, font, color: rgb(0.3, 0.3, 0.36) });
      });
      return asBlob(named(files[0], "numbered", "pdf"), await savePdf(pdf), "application/pdf");
    }
    if (toolId === "pdf-strip-metadata") {
      pdf.setTitle("");
      pdf.setAuthor("");
      pdf.setSubject("");
      pdf.setKeywords([]);
      pdf.setCreator("");
      pdf.setProducer("");
      pdf.setCreationDate(new Date(0));
      pdf.setModificationDate(new Date(0));
      return asBlob(named(files[0], "clean", "pdf"), await savePdf(pdf), "application/pdf");
    }
    if (toolId === "pdf-compress") return asBlob(named(files[0], "compressed", "pdf"), await savePdf(pdf), "application/pdf");
    throw new Error("This PDF operation is not available in the browser engine.");
  };
  const archiveOperation = async (toolId, files) => {
    await zipLib();
    if (toolId === "create-zip") {
      const zip = new window.JSZip(), used = new Set();
      for (const file of files) {
        const base = file.name.replace(/[\\/]/g, "_").replace(/^\.+/, "") || "file";
        let name = base, count = 2;
        while (used.has(name.toLowerCase())) name = `${base.replace(/(\.[^.]+)?$/, `-${count++}$1`)}`;
        used.add(name.toLowerCase());
        zip.file(name, file);
      }
      return asBlob("filelab-archive.zip", await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }), "application/zip");
    }
    let zip;
    try { zip = await window.JSZip.loadAsync(files[0], { checkCRC32: false }); }
    catch { throw new Error("Could not open this ZIP archive."); }
    const entries = Object.entries(zip.files).filter(([, file]) => !file.dir);
    if (entries.length > 1000) throw new Error("ZIP archives are limited to 1,000 files.");
    const total = entries.reduce((sum, [, file]) => sum + (file._data?.uncompressedSize || 0), 0);
    if (total > 100 * 1024 * 1024 || entries.some(([, file]) => (file._data?.uncompressedSize || 0) > 50 * 1024 * 1024 || (file._data?.uncompressedSize || 0) > Math.max(1, file._data?.compressedSize || 1) * 200)) throw new Error("Archive exceeds the browser extraction safety limits.");
    if (toolId === "archive-list") {
      const lines = entries.map(([path, file]) => `${String(file._data?.uncompressedSize || 0).padStart(10)} bytes  ${path.split(/[\\/]/).pop()}`);
      return asBlob(named(files[0], "contents", "txt"), lines.join("\n") || "(empty archive)", "text/plain");
    }
    const output = new window.JSZip(), used = new Set();
    for (const [path, file] of entries) {
      if (file.dir || file.unsafeOriginalName?.startsWith("../")) continue;
      const leaf = path.split(/[\\/]/).pop().replace(/^\.+/, "") || "file";
      let name = leaf, count = 2;
      while (used.has(name.toLowerCase())) name = leaf.replace(/(\.[^.]+)?$/, `-${count++}$1`);
      used.add(name.toLowerCase());
      output.file(name, await file.async("uint8array"));
    }
    return asBlob(named(files[0], "extracted", "zip"), await output.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }), "application/zip");
  };
  const process = async (toolId, files, options = {}) => {
    if (!supportedIds.includes(toolId)) throw new Error("This operation is unavailable in the Netlify browser build.");
    if (!files.length || files.length > 10 || files.some((file) => file.size > MAX_FILE_BYTES) || files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) throw new Error("Files exceed the browser processing limits.");
    const started = performance.now();
    let output;
    if (toolId.startsWith("pdf-") || toolId === "text-pdf" || toolId === "docx-pdf") output = await pdfOperation(toolId, files, options);
    else if (toolId.startsWith("image-") && toolId !== "images-to-pdf") output = await imageOutput(toolId, files[0], options);
    else if (toolId === "images-to-pdf") {
      const { PDFDocument } = await pdfLib();
      const pdf = await PDFDocument.create();
      for (const file of files) {
        const canvas = await imageCanvas(file);
        const png = await canvasBlob(canvas, "image/png");
        const image = await pdf.embedPng(await png.arrayBuffer());
        const page = pdf.addPage([612, 792]);
        const scale = Math.min(540 / image.width, 720 / image.height);
        const width = image.width * scale, height = image.height * scale;
        page.drawImage(image, { x: (612 - width) / 2, y: (792 - height) / 2, width, height });
      }
      output = asBlob("images.pdf", await savePdf(pdf), "application/pdf");
    } else if (["docx-text", "docx-pdf"].includes(toolId)) {
      const text = await wordText(files[0]);
      output = toolId === "docx-text" ? asBlob(named(files[0], "text", "txt"), text, "text/plain") : asBlob(named(files[0], "converted", "pdf"), await makePdfText(text), "application/pdf");
    } else if (["xlsx-csv", "csv-xlsx"].includes(toolId)) {
      await sheetLib();
      if (toolId === "xlsx-csv") {
        const workbook = window.XLSX.read(await files[0].arrayBuffer(), { type: "array", cellDates: false });
        const first = workbook.SheetNames[0];
        return { ...asBlob(named(files[0], "sheet", "csv"), window.XLSX.utils.sheet_to_csv(workbook.Sheets[first]), "text/csv;charset=utf-8"), duration_seconds: roundTime(started) };
      }
      const workbook = window.XLSX.read(await files[0].text(), { type: "string" });
      const outputBook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(outputBook, workbook.Sheets[workbook.SheetNames[0]], "Sheet1");
      output = asBlob(named(files[0], "converted", "xlsx"), window.XLSX.write(outputBook, { type: "array", bookType: "xlsx" }), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } else if (["create-zip", "extract-zip", "archive-list"].includes(toolId)) output = await archiveOperation(toolId, files);
    else output = await developerOperation(toolId, files, options);
    return { ...output, duration_seconds: roundTime(started) };
  };
  const roundTime = (started) => Math.round((performance.now() - started) / 10) / 100;
  const developerOperation = async (toolId, files) => {
    const file = files[0], text = await textOf(file), name = file.name;
    if (toolId === "json-format") {
      try { return asBlob(named(file, "formatted", "json"), `${JSON.stringify(JSON.parse(text), null, 2)}\n`, "application/json"); }
      catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
    }
    if (toolId === "json-csv") {
      const rows = JSON.parse(text);
      if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) throw new Error("JSON to CSV expects an array of objects.");
      const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      return asBlob(named(file, "converted", "csv"), [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))].join("\r\n"), "text/csv;charset=utf-8");
    }
    if (toolId === "csv-json") {
      const rows = csvRows(text);
      if (!rows.length) return asBlob(named(file, "converted", "json"), "[]\n", "application/json");
      const headers = rows.shift();
      const objects = rows.filter((row) => row.some((cell) => cell !== "")).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
      return asBlob(named(file, "converted", "json"), `${JSON.stringify(objects, null, 2)}\n`, "application/json");
    }
    if (toolId === "yaml-json") {
      await yamlLib();
      return asBlob(named(file, "converted", "json"), `${JSON.stringify(window.jsyaml.load(text), null, 2)}\n`, "application/json");
    }
    if (toolId === "json-yaml") {
      await yamlLib();
      return asBlob(named(file, "converted", "yaml"), window.jsyaml.dump(JSON.parse(text), { noRefs: true, lineWidth: 100 }), "text/yaml");
    }
    if (toolId === "xml-format") {
      if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) throw new Error("XML DTD and entity declarations are not allowed.");
      const parsed = new DOMParser().parseFromString(text, "application/xml");
      if (parsed.querySelector("parsererror")) throw new Error("Invalid XML syntax.");
      const serialized = new XMLSerializer().serializeToString(parsed);
      const formatted = serialized.replace(/>(\s*)</g, ">$1\n<").trim();
      return asBlob(named(file, "formatted", "xml"), `${formatted}\n`, "application/xml");
    }
    if (toolId === "base64-encode") {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      return asBlob(named(file, "base64", "txt"), btoa(binary), "text/plain");
    }
    if (toolId === "base64-decode") {
      const encoded = text.trim();
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw new Error("The input is not valid Base64 text.");
      const binary = atob(encoded), bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return asBlob(named(file, "decoded", "bin"), bytes);
    }
    if (toolId === "sha256") {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      return asBlob(named(file, "sha256", "txt"), `${hex}  ${name}\n`, "text/plain");
    }
    if (toolId === "compare-text") {
      if (files.length !== 2) throw new Error("Drop exactly two text files to compare.");
      const [left, right] = await Promise.all(files.map((item) => item.text()));
      const a = left.split(/\r?\n/), b = right.split(/\r?\n/);
      let prefix = 0, suffix = 0;
      while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
      while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
      const diff = left === right ? "Files are identical.\n" : [`--- ${files[0].name}`, `+++ ${files[1].name}`, `@@ -${prefix + 1},${a.length - prefix - suffix} +${prefix + 1},${b.length - prefix - suffix} @@`, ...a.slice(prefix, a.length - suffix).map((line) => `-${line}`), ...b.slice(prefix, b.length - suffix).map((line) => `+${line}`)].join("\n") + "\n";
      return asBlob("comparison.txt", diff, "text/plain");
    }
    if (toolId === "file-info") {
      const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const signature = header[0] === 37 && header[1] === 80 ? "PDF" : header[0] === 137 && header[1] === 80 ? "PNG" : header[0] === 255 && header[1] === 216 ? "JPEG" : header[0] === 82 && header[1] === 73 ? "WEBP" : header[0] === 80 && header[1] === 75 ? "ZIP-based" : file.type || "Unknown";
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      return asBlob(named(file, "info", "json"), JSON.stringify({ name, detected_type: signature, mime: file.type || "application/octet-stream", size_bytes: file.size, sha256 }, null, 2), "application/json");
    }
    throw new Error("This operation is not available in the browser engine.");
  };
  const bundle = async (files) => {
    await zipLib();
    const zip = new window.JSZip(), used = new Set();
    for (const result of files) {
      const base = result.name.replace(/[\\/]/g, "_") || "file";
      let name = base, count = 2;
      while (used.has(name.toLowerCase())) name = base.replace(/(\.[^.]+)?$/, `-${count++}$1`);
      used.add(name.toLowerCase());
      zip.file(name, result.blob);
    }
    return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  };

  window.FilelabNetlifyEngine = { supportedIds, MAX_FILE_BYTES, MAX_TOTAL_BYTES, process, bundle };
})();
