@echo off
setlocal

echo ==========================================
echo   Hanga - Optimal Store Solution Setup
echo ==========================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not added to PATH.
    echo Please install Python 3.11 or higher and try again.
    pause
    exit /b 1
)

python setup.py

echo.
pause
