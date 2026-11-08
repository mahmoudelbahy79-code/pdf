@echo off
setlocal
cd /d "%~dp0"
python -c "import fastapi, uvicorn, PIL, pypdf, openpyxl, yaml, docx, reportlab" >nul 2>nul
if errorlevel 1 python -m pip install -r requirements.txt
if not defined FILELAB_HOST set FILELAB_HOST=127.0.0.1
if not defined FILELAB_PORT set FILELAB_PORT=8000
python -m uvicorn main:app --host "%FILELAB_HOST%" --port "%FILELAB_PORT%"
endlocal
