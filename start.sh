#!/bin/sh
set -eu
cd "$(dirname "$0")"
PYTHON="${PYTHON:-python3}"
command -v "$PYTHON" >/dev/null 2>&1 || PYTHON=python
"$PYTHON" -c 'import fastapi, uvicorn, PIL, pypdf, openpyxl, yaml, docx, reportlab' >/dev/null 2>&1 || "$PYTHON" -m pip install -r requirements.txt
exec "$PYTHON" -m uvicorn main:app --host "${FILELAB_HOST:-127.0.0.1}" --port "${FILELAB_PORT:-8000}"
