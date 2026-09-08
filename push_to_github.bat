@echo off
title PhishShield - Push to GitHub (BoradNensi112)
cd /d "E:\detection"
echo ========================================================
echo   UPLOADING PHISHSHIELD TO GITHUB (BoradNensi112)
echo ========================================================
echo.
echo Target: https://github.com/BoradNensi112/phishshield.git
echo Branch: main
echo.
echo Pushing commits and files to GitHub...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Successfully uploaded to https://github.com/BoradNensi112/phishshield !
) else (
    echo [NOTE] If it failed, please make sure you created the empty 'phishshield' repository on https://github.com/new first!
)
echo.
pause
