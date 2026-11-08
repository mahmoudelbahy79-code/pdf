# FILELAB

FILELAB is a local-first file utility app. The browser provides a searchable, bilingual (English / Arabic), responsive toolbox. A small FastAPI service runs on the same computer and uses real Python libraries to convert the supported files. Uploaded file bytes are sent only to that local service, not to a cloud API.

## Run it locally

Requirements: Python 3.11 or newer and an internet connection for the first dependency install.

Linux / macOS:

```sh
cd filelab
./start.sh
```

Windows: open `start.bat` or run it from Command Prompt.

Open <http://127.0.0.1:8000>. Stop the service with Ctrl+C. The launcher installs the pinned Python dependencies if they are missing. To install explicitly, run `python -m pip install -r requirements.txt` first.

To change limits, set `FILELAB_MAX_FILE_MB`, `FILELAB_MAX_REQUEST_MB`, `FILELAB_HOST`, or `FILELAB_PORT` before starting. The defaults are 40 MB per file, 80 MB per request, and the loopback-only address `127.0.0.1`. The `.env.example` file documents these settings; it is a reference and is not automatically loaded.

## Deploy to Netlify

This project now has a static, browser-processing deployment path. `netlify.toml` publishes `static/`, and `static/registry.json` contains only operations implemented by the in-browser engine. The hosted app processes selected files in the visitor's browser; it does not send file contents to a server. Pinned conversion libraries are loaded from public CDNs on first use, so visitors need an internet connection. The static build limits each file to 20 MB and a combined job to 40 MB; temporary results stay in memory and should be downloaded before closing or refreshing the page.

For drag-and-drop deployment, use the separate `outputs/filelab-netlify.zip` artifact. Extract it and drag the folder whose top level contains `index.html` to <https://app.netlify.com/drop>. For Git deployment, put the full `filelab/` folder in a repository and connect that directory to Netlify; the included `netlify.toml` sets the publish folder and no build dependencies are needed. Arabic instructions are in `DEPLOY_NETLIFY_AR.md`.

## Supported tools

For local mode, the catalog is `registry.json`; the UI and `/api/tools` both consume it. The API adds the active size limit, validation rules, and shared dispatcher name to each definition. `engine.py` implements each registered operation, and `tests/test_engine.py` runs a conversion/validation smoke test for every local catalog ID. `feature-availability.json` distinguishes working tools, limited operations, unavailable dependencies, and unimplemented features. Netlify mode has a narrower catalog in `static/registry.json` and its browser processors in `static/netlify-engine.js`.

- PDF: compress page streams, merge, split into a ZIP of one-page PDFs, extract selected pages, rotate, number pages, extract selectable text, recreate a text-first DOCX, remove document metadata, and combine images into a PDF.
- Images: JPG/PNG/WEBP conversions, re-encoding/compression, proportional downscaling, 90-degree rotation, horizontal flip, EXIF-aware re-encoding, dimensions report, and multi-image PDF.
- Documents: DOCX to text/PDF, first worksheet of XLSX to CSV, CSV to XLSX, and text to PDF.
- Archives: create ZIP, safely repackage ZIP contents, and list ZIP contents.
- Developer tools: JSON validation/formatting, JSON/CSV and JSON/YAML conversion, safe YAML parsing, XML validation/formatting, Base64 encode/decode.
- Utilities: SHA-256, MD5 checksum, UTF-8 unified text diff, file type / size / SHA-256 report.

Image quality and resize width, PDF pages to keep, and PDF rotation have defaults plus per-card advanced settings. Page ranges use one-based values such as `1, 3-5`.

## Workspace features

Drop a file anywhere on the page or paste a file from the clipboard to let Smart pick choose a matching operation; dropping onto a tool card runs that specific tool. The toolbox can be searched and filtered by category, favorites, or recently used tools, and each card includes a short usage guide. Completed results can be previewed (including before/after image comparison), renamed, downloaded, deleted, or bundled as a ZIP. Text outputs can be edited in the result workspace; JSON edits are checked before saving. Local browser history stores filenames and result details only. In Netlify mode, result bytes stay in the open tab's memory and are lost when the tab is closed or refreshed.

## Honest limitations

This build is a tested local development product, not a public multi-user SaaS deployment. It deliberately does not claim tools whose engine is absent or whose result would be misleading.

- Video and audio operations, OCR, RAR/7Z/TAR extraction, AVIF, background removal, password-protected PDF unlocking, scanned-PDF text recognition, PDF-to-image rendering, PDF editing/redaction, and advanced Office layout conversion are unavailable. FFmpeg, OCR, LibreOffice, Poppler rendering, archive extras, and suitable OCR/model engines were not present, so these operations are not listed as functional tools.
- PDF-to-DOCX and DOCX-to-PDF preserve extracted text, not the original page layout, styles, images, or complex tables. DOCX-to-PDF is a simplified text rendering.
- Image compression is real re-encoding; small images may become larger. The UI reports the measured size change rather than promising a reduction.
- Archive extraction never writes untrusted member paths to disk. It returns a ZIP with flattened, sanitized leaf filenames; duplicate names get numbered suffixes. Archive entries, expanded size, and compression ratios are capped.
- Processing is in-memory and limited to 40 MB per file, 80 MB per request, 10 files per job, and 1,000 PDF pages. Two jobs process concurrently, with a bounded queue and per-client start limit. A running Python conversion cannot be interrupted mid-library call; cancellation discards its result after the call returns.
- Results are stored in the OS temporary directory for up to one hour. Job state is in memory and is cleared if the server restarts. The browser's history stores filenames and result metadata only in local storage, not file content.
- File signatures are checked for binary formats and then parsed by the corresponding library. Text formats do not have a universal magic signature; they are validated by their parser. No application-level antivirus scan is included.

## Security and deployment

By default FILELAB binds only to loopback, limits upload size, sanitizes filenames, uses generated result paths, checks supported binary signatures, uses a safe YAML loader, rejects XML DTD/entity declarations, caps ZIP expansion, avoids shell commands, and expires temporary results. No uploaded file is executed. The local API has no user accounts because it is intended to be reachable only from the same computer.

Do not change `FILELAB_HOST` to `0.0.0.0` on an untrusted network. Do not deploy this development server as a public file-conversion service. A public deployment needs authentication, HTTPS, per-user authorization, isolated resource-limited workers, durable queue/storage, stronger rate limiting, malware scanning, operational monitoring, and process-level hard timeouts. Those controls are not represented as implemented here.

For a local reverse proxy or a future isolated deployment, use HTTPS outside this app and keep the result directory private. Never place uploaded originals or temporary results under a public static directory.

## Tests

From this directory:

```sh
python -m unittest discover -s tests -v
python -m compileall -q main.py engine.py tests
node --check static/app.js
```

For the HTTP API tests, install `python -m pip install -r requirements-test.txt` first. The automated tests generate sample inputs in memory and verify that every registered operation returns parseable output where applicable, including PDF, images, Office documents, archives, JSON, CSV, YAML, and XML. They also cover invalid signatures, unsupported extensions, empty/oversized uploads, page-range errors, malformed inputs, image dimensions, ZIP traversal paths, job polling, downloads, and result bundling.

## Architecture

- `static/`: responsive HTML/CSS/JavaScript frontend; no external JavaScript runtime is required.
- `registry.json`: shared tool catalog, accepted extensions/MIME types, default settings, category, and output format.
- `main.py`: local HTTP API, bounded upload handling, job lifecycle/status/cancel/download endpoints, short-lived result storage, cleanup, and result bundling.
- `engine.py`: signature classification and conversion processors.
- `tests/`: generated-fixture tests.

The Netlify build is static and requires no Node build step. Browser conversion libraries are version-pinned CDN scripts imported only when a selected operation needs them. In browser mode, MD5 is omitted because Web Crypto does not provide MD5; the local Python mode still includes it. The workspace had Node.js but no npm, so Next.js, TypeScript, Tailwind, Framer Motion, and Lucide could not be installed. The implementation uses a small frontend and Python/FastAPI for local mode instead. No listed conversion button is a placeholder.
