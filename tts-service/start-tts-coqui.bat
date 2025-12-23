@echo off
echo ========================================
echo Starting Coqui TTS Service
echo ========================================
echo.
echo Service: Coqui TTS (High Quality)
echo Port: 8000
echo URL: http://localhost:8000
echo.
echo Features:
echo   - Native Telugu support
echo   - High quality synthesis
echo   - GPU acceleration (if available)
echo.
echo Press Ctrl+C to stop
echo.

python app-coqui.py
