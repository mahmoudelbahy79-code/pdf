from __future__ import annotations

import asyncio
import json
import os
import re
import shutil
import tempfile
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Event, Lock
from typing import Any

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from engine import InputFile, OutputFile, ProcessingError, detect_type, process_tool, safe_name


BASE = Path(__file__).resolve().parent
MAX_FILE_BYTES = int(os.getenv("FILELAB_MAX_FILE_MB", "40")) * 1024 * 1024
MAX_REQUEST_BYTES = int(os.getenv("FILELAB_MAX_REQUEST_MB", "80")) * 1024 * 1024
MAX_FILES = 10
MAX_JOBS = 25
JOB_TTL_SECONDS = 60 * 60
STORAGE = Path(os.getenv("FILELAB_STORAGE_DIR", str(Path(tempfile.gettempdir()) / "filelab-jobs"))).resolve()
STORAGE.mkdir(parents=True, exist_ok=True)
TOOLS: list[dict[str, Any]] = json.loads((BASE / "registry.json").read_text(encoding="utf-8"))
for definition in TOOLS:
    definition["max_file_bytes"] = MAX_FILE_BYTES
    definition["processing_function"] = "process_tool"
    definition["validation_rules"] = {"accepted_extensions": definition["extensions"], "accepted_mime": definition["mime"], "verify_signature": "*" not in definition["extensions"]}
TOOL_MAP = {tool["id"]: tool for tool in TOOLS}
jobs: dict[str, dict[str, Any]] = {}
jobs_lock = Lock()
queue_slots = asyncio.Semaphore(2)
request_history: dict[str, deque[float]] = defaultdict(deque)

async def cleanup_loop() -> None:
    while True:
        await asyncio.sleep(300)
        prune_old_jobs()
        cutoff = time.time() - JOB_TTL_SECONDS
        for folder in STORAGE.iterdir():
            try:
                if folder.is_dir() and folder.stat().st_mtime < cutoff and folder.name not in jobs:
                    shutil.rmtree(folder, ignore_errors=True)
            except OSError:
                continue


@asynccontextmanager
async def lifespan(_app: FastAPI):
    cleanup_task = asyncio.create_task(cleanup_loop())
    yield
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="FILELAB", version="1.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_REQUEST_BYTES + 1024 * 1024:
        return JSONResponse(status_code=413, content={"detail": f"Combined uploads exceed the {MAX_REQUEST_BYTES // (1024 * 1024)} MB request limit."})
    return await call_next(request)


def prune_old_jobs() -> None:
    cutoff = time.time() - JOB_TTL_SECONDS
    with jobs_lock:
        expired = [key for key, job in jobs.items() if job["created_at"] < cutoff and job["status"] in {"completed", "failed", "cancelled"}]
        for key in expired:
            shutil.rmtree(STORAGE / key, ignore_errors=True)
            del jobs[key]


def check_rate_limit(request: Request) -> None:
    now = time.monotonic()
    address = request.client.host if request.client else "unknown"
    history = request_history[address]
    while history and history[0] < now - 60:
        history.popleft()
    if len(history) >= 30:
        raise HTTPException(429, "Please wait a minute before starting more file jobs.")
    history.append(now)


def validate_input(tool: dict[str, Any], item: InputFile) -> None:
    if not item.data:
        raise ProcessingError(f"{safe_name(item.name)} is empty.")
    if len(item.data) > MAX_FILE_BYTES:
        raise ProcessingError(f"{safe_name(item.name)} is over the {MAX_FILE_BYTES // (1024 * 1024)} MB per-file limit.")
    ext = Path(item.name).suffix.lower()
    accepted = tool["extensions"]
    if "*" not in accepted and ext not in accepted:
        raise ProcessingError(f"{safe_name(item.name)} has an unsupported extension. Accepted: {', '.join(accepted)}.")
    if "*" in accepted:
        return
    detected, actual_mime = detect_type(item.name, item.data)
    expected_by_extension = {
        ".pdf": {"pdf"}, ".jpg": {"jpeg"}, ".jpeg": {"jpeg"}, ".png": {"png"},
        ".webp": {"webp"}, ".bmp": {"bmp"}, ".tif": {"tiff"}, ".tiff": {"tiff"},
        ".docx": {"docx"}, ".xlsx": {"xlsx"}, ".zip": {"zip"}, ".yaml": {"yaml", "text"},
        ".yml": {"yaml", "text"}, ".json": {"json"}, ".csv": {"csv", "text"},
        ".txt": {"text", "json", "xml", "csv"}, ".md": {"text"}, ".xml": {"xml"},
        ".b64": {"text"},
    }
    expected = expected_by_extension.get(ext, set())
    if expected and detected not in expected:
        raise ProcessingError(f"{safe_name(item.name)} does not contain a valid {ext[1:].upper()} file (detected {detected}).")
    if actual_mime not in tool["mime"] and not any(mime.startswith("text/") for mime in tool["mime"]) and "*/*" not in tool["mime"]:
        allowed = ", ".join(tool["mime"])
        raise ProcessingError(f"{safe_name(item.name)} has an unsupported detected type ({actual_mime}); expected {allowed}.")


def status_public(job: dict[str, Any]) -> dict[str, Any]:
    return {key: job[key] for key in ("id", "tool_id", "status", "error", "output_name", "output_size", "original_size", "original_names", "duration_seconds", "created_at") if key in job}


async def run_job(job_id: str, tool_id: str, items: list[InputFile], options: dict[str, Any]) -> None:
    job = jobs[job_id]
    async with queue_slots:
        if job["cancel"].is_set():
            job["status"] = "cancelled"
            return
        job["status"] = "processing"
        started = time.monotonic()
        try:
            result: OutputFile = await asyncio.to_thread(process_tool, tool_id, items, options)
            job["duration_seconds"] = round(time.monotonic() - started, 3)
            if job["cancel"].is_set():
                job["status"] = "cancelled"
                return
            folder = STORAGE / job_id
            folder.mkdir(mode=0o700, parents=True, exist_ok=True)
            extension = Path(result.name).suffix.lower()
            if not re.fullmatch(r"\.[a-z0-9]{1,10}", extension):
                extension = ".bin"
            destination = folder / f"result{extension}"
            destination.write_bytes(result.data)
            job.update({"status": "completed", "result_path": str(destination), "output_name": safe_name(result.name), "output_size": len(result.data), "mime": result.mime})
        except ProcessingError as exc:
            job.update({"status": "failed", "error": str(exc)[:500]})
        except Exception:
            job.update({"status": "failed", "error": "The file could not be processed. Try another file or a smaller input."})
        finally:
            job["duration_seconds"] = job.get("duration_seconds", round(time.monotonic() - started, 3))


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(BASE / "static" / "index.html", media_type="text/html")


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "mode": "local", "max_file_bytes": MAX_FILE_BYTES, "concurrency": 2}


@app.get("/api/tools")
async def list_tools() -> dict[str, Any]:
    return {"tools": TOOLS, "max_file_bytes": MAX_FILE_BYTES, "max_files": MAX_FILES}


@app.post("/api/jobs", status_code=202)
async def create_job(
    request: Request,
    background_tasks: BackgroundTasks,
    tool_id: str = Form(...),
    options: str = Form("{}"),
    files: list[UploadFile] = File(...),
) -> JSONResponse:
    check_rate_limit(request)
    prune_old_jobs()
    tool = TOOL_MAP.get(tool_id)
    if tool is None:
        raise HTTPException(404, "Unknown operation.")
    if not 1 <= len(files) <= MAX_FILES:
        raise HTTPException(400, f"Choose between 1 and {MAX_FILES} files.")
    if len(files) > 1 and not tool["multi"] and tool_id != "compare-text":
        raise HTTPException(400, "This operation accepts one file. Remove extra files or choose a batch-friendly tool.")
    if tool_id == "compare-text" and len(files) != 2:
        raise HTTPException(400, "Text comparison requires exactly two files.")
    try:
        config = json.loads(options)
        if not isinstance(config, dict):
            raise ValueError
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(400, "Options must be a JSON object.") from exc
    items: list[InputFile] = []
    request_size = 0
    for upload in files:
        data = await upload.read(MAX_FILE_BYTES + 1)
        request_size += len(data)
        name = safe_name(upload.filename or "file")
        item = InputFile(name, data)
        try:
            validate_input(tool, item)
        except ProcessingError as exc:
            raise HTTPException(400, str(exc)) from exc
        items.append(item)
        if request_size > MAX_REQUEST_BYTES:
            raise HTTPException(413, f"Combined uploads exceed the {MAX_REQUEST_BYTES // (1024 * 1024)} MB request limit.")
    with jobs_lock:
        if sum(job["status"] in {"queued", "processing"} for job in jobs.values()) >= MAX_JOBS:
            raise HTTPException(429, "The local processing queue is full. Wait for a job to finish.")
        job_id = uuid.uuid4().hex
        job: dict[str, Any] = {
            "id": job_id, "tool_id": tool_id, "status": "queued", "created_at": time.time(),
            "original_size": request_size, "original_names": [item.name for item in items],
            "cancel": Event(), "duration_seconds": 0,
        }
        jobs[job_id] = job
    background_tasks.add_task(run_job, job_id, tool_id, items, config)
    return JSONResponse(status_code=202, content={"job_id": job_id, "status": "queued"})


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str) -> dict[str, Any]:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "This temporary job has expired or does not exist.")
    response = status_public(job)
    if job["status"] == "completed":
        response["download_url"] = f"/api/jobs/{job_id}/download"
        response["reduction_percent"] = round((job["original_size"] - job["output_size"]) * 100 / job["original_size"], 1) if job["original_size"] else 0
    return response


@app.post("/api/jobs/{job_id}/cancel")
async def cancel_job(job_id: str) -> dict[str, Any]:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "This temporary job has expired or does not exist.")
    if job["status"] in {"queued", "processing"}:
        job["cancel"].set()
        if job["status"] == "queued":
            job["status"] = "cancelled"
    return status_public(job)


@app.get("/api/jobs/{job_id}/download")
async def download_job(job_id: str) -> FileResponse:
    job = jobs.get(job_id)
    if not job or job.get("status") != "completed" or not job.get("result_path"):
        raise HTTPException(404, "The finished file is no longer available.")
    path = Path(job["result_path"]).resolve()
    if path.parent != (STORAGE / job_id).resolve() or not path.is_file():
        raise HTTPException(404, "The finished file is no longer available.")
    return FileResponse(path, media_type=job["mime"], filename=job["output_name"], headers={"Cache-Control": "no-store"})


@app.post("/api/bundle")
async def download_bundle(request: Request) -> StreamingResponse:
    try:
        body = await request.json()
        job_ids = body.get("job_ids", [])
        output_names = body.get("output_names", {})
    except Exception as exc:
        raise HTTPException(400, "Send a list of completed job IDs.") from exc
    if not isinstance(job_ids, list) or not 1 <= len(job_ids) <= 40 or any(not isinstance(job_id, str) or not re.fullmatch(r"[a-f0-9]{32}", job_id) for job_id in job_ids):
        raise HTTPException(400, "Choose between 1 and 40 valid job IDs.")
    if not isinstance(output_names, dict) or len(output_names) > 40 or any(job_id not in job_ids or not isinstance(name, str) or len(name) > 180 for job_id, name in output_names.items()):
        raise HTTPException(400, "Output names must match selected jobs and be valid text.")
    import zipfile
    output = tempfile.SpooledTemporaryFile(max_size=8 * 1024 * 1024)
    included = 0
    total = 0
    names: set[str] = set()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for job_id in dict.fromkeys(job_ids):
            job = jobs.get(job_id)
            if not job or job.get("status") != "completed" or not job.get("result_path"):
                continue
            path = Path(job["result_path"]).resolve()
            if path.parent != (STORAGE / job_id).resolve() or not path.is_file():
                continue
            total += path.stat().st_size
            if total > 200 * 1024 * 1024:
                raise HTTPException(413, "Combined results are over the 200 MB bundle limit.")
            requested_name = safe_name(output_names.get(job_id, job["output_name"]))
            extension = Path(job["output_name"]).suffix
            name = f"{Path(requested_name).stem}{extension}"
            candidate, index = name, 2
            while candidate.casefold() in names:
                candidate = f"{Path(name).stem}-{index}{Path(name).suffix}"
                index += 1
            names.add(candidate.casefold())
            archive.write(path, candidate)
            included += 1
    if not included:
        output.close()
        raise HTTPException(404, "No finished temporary results are available.")
    output.seek(0)
    data = output.read()
    output.close()
    return StreamingResponse(iter([data]), media_type="application/zip", headers={"Content-Disposition": 'attachment; filename="filelab-results.zip"', "Cache-Control": "no-store"})


@app.post("/api/cleanup")
async def cleanup_results(request: Request) -> dict[str, int]:
    try:
        body = await request.json()
        job_ids = body.get("job_ids", [])
    except Exception as exc:
        raise HTTPException(400, "Send a list of temporary job IDs.") from exc
    if not isinstance(job_ids, list) or len(job_ids) > 40 or any(not isinstance(job_id, str) or not re.fullmatch(r"[a-f0-9]{32}", job_id) for job_id in job_ids):
        raise HTTPException(400, "Choose up to 40 valid job IDs.")
    removed = 0
    with jobs_lock:
        for job_id in dict.fromkeys(job_ids):
            job = jobs.get(job_id)
            if job and job["status"] not in {"queued", "processing"}:
                shutil.rmtree(STORAGE / job_id, ignore_errors=True)
                del jobs[job_id]
                removed += 1
    return {"removed": removed}


app.mount("/", StaticFiles(directory=BASE / "static"), name="site-assets")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=os.getenv("FILELAB_HOST", "127.0.0.1"), port=int(os.getenv("FILELAB_PORT", "8000")), reload=False)
