@echo off
title PhishShield - Launcher
echo ========================================================
echo   STARTING PHISHSHIELD FULL-STACK APPLICATION
echo ========================================================
echo.
echo 1. Launching Backend FastAPI Server...
start "" "E:\detection\run_backend.bat"
timeout /t 3 /nobreak >nul

echo 2. Launching Frontend React App...
start "" "E:\detection\run_frontend.bat"
timeout /t 3 /nobreak >nul

echo.
echo Both servers started! Opening Web App in Browser...
start http://localhost:5173
exit
