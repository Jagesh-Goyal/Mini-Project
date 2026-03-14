@echo off
setlocal
title Dakshtra Launcher

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"
set "MAX_WAIT_SECONDS=90"

echo ========================================================
echo   Dakshtra One-Click Starter
echo ========================================================
echo.

if not exist "%ROOT%\env\Scripts\python.exe" (
  echo [ERROR] Python virtual environment not found at:
  echo         %ROOT%\env\Scripts\python.exe
  echo.
  echo Run once:
  echo   python -m venv env
  echo   .\env\Scripts\activate
  echo   pip install -r requirements.txt
  echo.
  pause
  exit /b 1
)

if not exist "%ROOT%\frontend\package.json" (
  echo [ERROR] frontend\package.json not found.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not available. Please install Node.js 18+ and reopen terminal.
  pause
  exit /b 1
)

if not exist "%ROOT%\frontend\node_modules" (
  echo [INFO] frontend dependencies missing, running npm install first-time only...
  pushd "%ROOT%\frontend"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  popd
)

set "BACKEND_CMD=cd /d ""%ROOT%"" && ""%ROOT%\env\Scripts\python.exe"" -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000"
set "FRONTEND_CMD=cd /d ""%ROOT%\frontend"" && npm run dev"

set "BACKEND_PID="
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%BACKEND_PORT%" ^| findstr "LISTENING"') do (
  set "BACKEND_PID=%%p"
)

if defined BACKEND_PID (
  echo [1/3] Backend already running on port %BACKEND_PORT% ^(PID: %BACKEND_PID%^). Skipping new backend launch.
) else (
  echo [1/3] Starting backend...
  start "Dakshtra Backend" cmd /k "%BACKEND_CMD%"
)

call :wait_for_port %BACKEND_PORT% %MAX_WAIT_SECONDS% Backend
if errorlevel 1 (
  echo [ERROR] Backend did not become ready on port %BACKEND_PORT% within %MAX_WAIT_SECONDS%s.
  echo         Check the "Dakshtra Backend" window for startup errors.
  echo.
  pause
  exit /b 1
)

set "FRONTEND_PID="
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%FRONTEND_PORT%" ^| findstr "LISTENING"') do (
  set "FRONTEND_PID=%%p"
)

if defined FRONTEND_PID (
  echo [2/3] Frontend already running on port %FRONTEND_PORT% ^(PID: %FRONTEND_PID%^). Skipping new frontend launch.
) else (
  echo [2/3] Starting frontend...
  start "Dakshtra Frontend" cmd /k "%FRONTEND_CMD%"
)

call :wait_for_port %FRONTEND_PORT% %MAX_WAIT_SECONDS% Frontend
if errorlevel 1 (
  echo [ERROR] Frontend did not become ready on port %FRONTEND_PORT% within %MAX_WAIT_SECONDS%s.
  echo         Check the "Dakshtra Frontend" window for startup errors.
  echo.
  pause
  exit /b 1
)

echo [3/3] Opening app and API docs...
start "" "http://localhost:5173"
start "" "http://127.0.0.1:8000/docs"

echo.
echo Done. Keep backend/frontend terminal windows open.
echo.
echo Frontend : http://localhost:5173
echo Backend  : http://127.0.0.1:8000
echo Docs     : http://127.0.0.1:8000/docs
echo.
echo Default Login: admin@dakshtra.com / admin123
echo ========================================================
echo.
pause
exit /b 0

:wait_for_port
setlocal
set "TARGET_PORT=%~1"
set "MAX_SECONDS=%~2"
set "SERVICE_NAME=%~3"
set /a ELAPSED=0

echo [INFO] Waiting for %SERVICE_NAME% on port %TARGET_PORT%...

:wait_loop
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%TARGET_PORT%" ^| findstr "LISTENING"') do (
  endlocal & exit /b 0
)

if %ELAPSED% GEQ %MAX_SECONDS% (
  endlocal & exit /b 1
)

set /a ELAPSED+=1
timeout /t 1 /nobreak >nul
goto wait_loop
