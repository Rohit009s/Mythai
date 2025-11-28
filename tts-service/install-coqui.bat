@echo off
echo ========================================
echo Installing Coqui TTS Service
echo ========================================
echo.
echo This will install Coqui TTS with Telugu support
echo Installation may take 5-10 minutes (downloads ~500MB)
echo.
echo Requirements:
echo   - Python 3.8 or higher
echo   - Microsoft Visual C++ Build Tools (for compilation)
echo.
pause

echo.
echo Step 1: Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Step 2: Installing PyTorch (CPU version)...
python -m pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu

echo.
echo Step 3: Installing Coqui TTS...
python -m pip install TTS==0.22.0

echo.
echo Step 4: Installing FastAPI and dependencies...
python -m pip install fastapi==0.104.1 uvicorn[standard]==0.24.0 pydantic==2.5.0

echo.
echo Step 5: Installing additional dependencies...
python -m pip install numpy==1.24.3 scipy==1.11.4

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start TTS service:
echo   python app-coqui.py
echo.
echo Or use:
echo   start-tts-coqui.bat
echo.
echo Supported languages:
echo   - Telugu (te) - Native model
echo   - Hindi (hi)
echo   - Tamil (ta)
echo   - English (en)
echo.
pause
