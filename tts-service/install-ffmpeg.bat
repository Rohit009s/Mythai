@echo off
echo ========================================
echo Installing FFmpeg for Pitch Modulation
echo ========================================
echo.

echo FFmpeg is required for pitch modulation in Enhanced TTS
echo.
echo Option 1: Install via Chocolatey (Recommended)
echo   1. Install Chocolatey: https://chocolatey.org/install
echo   2. Run: choco install ffmpeg
echo.
echo Option 2: Manual Installation
echo   1. Download: https://www.gyan.dev/ffmpeg/builds/
echo   2. Extract to C:\ffmpeg
echo   3. Add C:\ffmpeg\bin to PATH
echo.
echo Option 3: Use winget (Windows 11)
echo   Run: winget install ffmpeg
echo.

echo Checking if FFmpeg is already installed...
where ffmpeg >nul 2>&1
if %errorlevel% == 0 (
    echo.
    echo ✅ FFmpeg is already installed!
    ffmpeg -version | findstr "ffmpeg version"
    echo.
    echo You're ready to use pitch modulation!
) else (
    echo.
    echo ❌ FFmpeg is NOT installed
    echo.
    echo Choose installation method:
    echo [1] Install via Chocolatey (if installed)
    echo [2] Install via winget (Windows 11)
    echo [3] Show manual installation instructions
    echo [4] Skip (use basic TTS without pitch modulation)
    echo.
    set /p choice="Enter choice (1-4): "
    
    if "%choice%"=="1" (
        echo.
        echo Installing via Chocolatey...
        choco install ffmpeg -y
    ) else if "%choice%"=="2" (
        echo.
        echo Installing via winget...
        winget install ffmpeg
    ) else if "%choice%"=="3" (
        echo.
        echo Manual Installation Steps:
        echo 1. Download from: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
        echo 2. Extract to C:\ffmpeg
        echo 3. Add C:\ffmpeg\bin to System PATH
        echo 4. Restart terminal
        echo 5. Run: ffmpeg -version
        pause
    ) else (
        echo.
        echo Skipping FFmpeg installation
        echo TTS will work but without pitch modulation
    )
)

echo.
echo ========================================
pause
