@echo off
REM ==============================================================================
REM SecureAI Vault - Enterprise Startup Script (Windows)
REM Tagline: Protect. Detect. Trust.
REM ==============================================================================

color 0B
echo ========================================================================
echo     SecureAI Vault - Enterprise Cybersecurity Platform
echo                 Protect. Detect. Trust.
echo ========================================================================
echo.

REM 1. Verify Prerequisites
echo [1/4] Checking prerequisites...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python 3 is not installed or not in PATH.
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)
echo [OK] Python and Node.js detected.
echo.

REM 2. Virtual Environment
echo [2/4] Setting up Python virtual environment...
if not exist "venv" (
    echo Creating virtual environment 'venv'...
    python -m venv venv
)

if exist "venv\Scripts\python.exe" (
    set PYTHON_EXEC=venv\Scripts\python.exe
    set PIP_EXEC=venv\Scripts\pip.exe
) else (
    set PYTHON_EXEC=python
    set PIP_EXEC=pip
)

echo Installing backend dependencies...
%PIP_EXEC% install -q -r backend\requirements.txt
echo [OK] Backend dependencies ready.
echo.

REM 3. Frontend Build
echo [3/4] Building React SOC Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend packages...
    call npm install --silent
)
echo Compiling production assets...
call npm run build
cd ..
echo [OK] Frontend build complete.
echo.

REM 4. Launch Unified Server
echo ========================================================================
echo   Server URL:      http://localhost:8000
echo   API Docs:        http://localhost:8000/api/v1/docs
echo ------------------------------------------------------------------------
echo   Default Credentials:
echo     Admin:         admin@secureai.local        / Password@123!
echo     SOC Analyst:   soc_analyst@secureai.local  / Password@123!
echo     Employee:      john.doe@secureai.local     / Password@123!
echo ========================================================================
echo Press CTRL+C to terminate the server.
echo.

set PYTHONPATH=.
%PYTHON_EXEC% -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
