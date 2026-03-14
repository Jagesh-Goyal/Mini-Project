@echo off
setlocal
title Dakshtra Stopper

echo ========================================================
echo   Stopping Dakshtra Servers
echo ========================================================

taskkill /FI "WINDOWTITLE eq Dakshtra Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Dakshtra Frontend*" /F >nul 2>&1

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1

echo Done. Backend and frontend should be stopped.
echo.
pause
exit /b 0
