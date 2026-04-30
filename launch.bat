@echo off
echo ==========================================
echo   GhostShip - Port Intelligence System
echo ==========================================
echo.

:: Check if ports are in use and kill them
echo Checking for existing processes...
powershell -Command "Get-NetTCPConnection -LocalPort 5001,5175 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul

:: Start API
echo.
echo [1/2] Starting Backend API on port 5001...
echo      URL: http://127.0.0.1:5001
echo.
start "GhostShip API" cmd /k "cd /d "%~dp0" && python api.py 2>&1"

:: Wait for API to be ready
echo Waiting for API to start...
:wait_api
powershell -Command "try { Invoke-RestMethod -Uri 'http://127.0.0.1:5001/api/health' -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" 2>nul
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_api
)
echo API is ready!

:: Start Frontend
echo.
echo [2/2] Starting Frontend on port 5175...
echo      URL: http://localhost:5175
echo.
cd "%~dp0\frontend"
start "GhostShip Frontend" cmd /k "npm run dev 2>&1"

echo.
echo ==========================================
echo   GhostShip is starting...
echo ==========================================
echo.
echo Frontend: http://localhost:5175
echo API:      http://127.0.0.1:5001
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5175
