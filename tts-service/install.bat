@echo off
echo ========================================
echo Installing Coqui TTS Dependencies
echo ========================================
echo.
echo This will take 10-15 minutes...
echo Please be patient!
echo.

cd /d "%~dp0"

echo Step 1: Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Step 2: Installing dependencies...
python -m pip install fastapi==0.104.1
python -m pip install uvicorn[standard]==0.24.0
python -m pip install pydantic==2.5.0
python -m pip install torch==2.1.0
python -m pip install torchaudio==2.1.0
python -m pip install TTS==0.22.0
python -m pip install numpy==1.24.3
python -m pip install scipy==1.11.4

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next step: Run "python app.py"
echo.
pause
