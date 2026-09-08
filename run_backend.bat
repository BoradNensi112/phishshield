@echo off
title PhishShield - Backend Server (FastAPI)
cd /d "E:\detection\backend"
echo ========================================================
echo   PHISHSHIELD - FASTAPI BACKEND SERVER
echo ========================================================
echo.
echo Starting Uvicorn server on http://127.0.0.1:8000 ...
echo Swagger API Docs: http://127.0.0.1:8000/docs
echo.
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
pause
