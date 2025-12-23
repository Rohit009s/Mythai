@echo off
echo ========================================
echo Installing Simple Google TTS Service
echo ========================================
echo.

echo Installing Python packages...
python -m pip install --upgrade pip
python -m pip install -r requirements-simple.txt

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start TTS service:
echo   python app-gtts.py
echo.
echo Or use:
echo   start-tts-simple.bat
echo.
pause
