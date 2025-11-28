@echo off
echo ================================================================
echo   Installing Piper TTS - FREE Multi-Voice TTS
echo ================================================================
echo.
echo Piper TTS Features:
echo   - FREE - Zero cost, no API keys
echo   - Offline - Works without internet
echo   - Multiple voices - Male and female
echo   - Fast generation
echo   - Easy to use
echo.
echo ================================================================
echo.

cd /d "%~dp0"

echo Step 1: Creating piper directory...
if not exist "piper" mkdir piper
if not exist "piper\models" mkdir piper\models

echo.
echo Step 2: Downloading Piper TTS for Windows...
echo.
echo Please download Piper manually:
echo.
echo 1. Go to: https://github.com/rhasspy/piper/releases/latest
echo 2. Download: piper_windows_amd64.zip
echo 3. Extract piper.exe to: %CD%\piper\
echo.
echo Step 3: Downloading voice models...
echo.
echo Download these models to: %CD%\piper\models\
echo.
echo MALE VOICES:
echo   - en_US-lessac-medium (Deep male)
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
echo.
echo   - en_US-ryan-medium (Medium male)
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json
echo.
echo   - en_US-joe-medium (Young male)
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx.json
echo.
echo FEMALE VOICES:
echo   - en_US-amy-medium (Soft female)
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json
echo.
echo   - en_US-libritts-high (Clear female)
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts/high/en_US-libritts-high.onnx
echo     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts/high/en_US-libritts-high.onnx.json
echo.
echo ================================================================
echo.
echo QUICK INSTALL SCRIPT:
echo.
echo Copy and paste this into PowerShell (Run as Administrator):
echo.
echo cd "%CD%\piper"
echo Invoke-WebRequest -Uri "https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_windows_amd64.zip" -OutFile "piper.zip"
echo Expand-Archive -Path "piper.zip" -DestinationPath "." -Force
echo Move-Item -Path "piper\piper.exe" -Destination "." -Force
echo Remove-Item "piper.zip"
echo.
echo cd models
echo # Download male voices
echo Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx" -OutFile "en_US-lessac-medium.onnx"
echo Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json" -OutFile "en_US-lessac-medium.onnx.json"
echo Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx" -OutFile "en_US-ryan-medium.onnx"
echo Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json" -OutFile "en_US-ryan-medium.onnx.json"
echo # Download female voices
echo Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx" -OutFile "en_US-amy-medium.onnx"
echo Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json" -OutFile "en_US-amy-medium.onnx.json"
echo.
echo ================================================================
echo.
echo After installation, start the service with:
echo   python app-piper.py
echo.
echo Then test with:
echo   node test-piper-voices.js
echo.
pause
