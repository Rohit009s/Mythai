# Automated Piper TTS Installer
# FREE, Offline, Multi-Voice TTS

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  Installing Piper TTS - FREE Multi-Voice TTS" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Cyan

$piperDir = Join-Path $PSScriptRoot "piper"
$modelsDir = Join-Path $piperDir "models"

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $piperDir | Out-Null
New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null

# Download Piper executable
Write-Host "`nDownloading Piper TTS executable..." -ForegroundColor Yellow
$piperZip = Join-Path $piperDir "piper.zip"
$piperUrl = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"

try {
    Invoke-WebRequest -Uri $piperUrl -OutFile $piperZip -UseBasicParsing
    Write-Host "✅ Downloaded Piper" -ForegroundColor Green
    
    # Extract
    Write-Host "Extracting..." -ForegroundColor Yellow
    Expand-Archive -Path $piperZip -DestinationPath $piperDir -Force
    
    # Find and move piper.exe
    $piperExe = Get-ChildItem -Path $piperDir -Filter "piper.exe" -Recurse | Select-Object -First 1
    if ($piperExe) {
        if ($piperExe.DirectoryName -ne $piperDir) {
            Move-Item -Path $piperExe.FullName -Destination $piperDir -Force
        }
        Write-Host "✅ Piper installed" -ForegroundColor Green
    }
    
    # Cleanup
    Remove-Item $piperZip -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $piperDir -Directory | Where-Object { $_.Name -ne "models" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Failed to download Piper: $_" -ForegroundColor Red
    exit 1
}

# Download voice models
Write-Host "`nDownloading voice models..." -ForegroundColor Yellow

$voices = @(
    @{
        name = "en_US-lessac-medium (Male, deep)"
        onnx = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx"
        json = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json"
    },
    @{
        name = "en_US-ryan-medium (Male, medium)"
        onnx = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx"
        json = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json"
    },
    @{
        name = "en_US-joe-medium (Male, young)"
        onnx = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx"
        json = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx.json"
    },
    @{
        name = "en_US-amy-medium (Female, soft)"
        onnx = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx"
        json = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json"
    },
    @{
        name = "en_US-libritts-high (Female, clear)"
        onnx = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts/high/en_US-libritts-high.onnx"
        json = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts/high/en_US-libritts-high.onnx.json"
    }
)

foreach ($voice in $voices) {
    Write-Host "`nDownloading $($voice.name)..." -ForegroundColor Cyan
    
    $onnxFile = Split-Path $voice.onnx -Leaf
    $jsonFile = Split-Path $voice.json -Leaf
    
    try {
        # Download ONNX model
        Invoke-WebRequest -Uri $voice.onnx -OutFile (Join-Path $modelsDir $onnxFile) -UseBasicParsing
        Write-Host "  ✅ Downloaded $onnxFile" -ForegroundColor Green
        
        # Download JSON config
        Invoke-WebRequest -Uri $voice.json -OutFile (Join-Path $modelsDir $jsonFile) -UseBasicParsing
        Write-Host "  ✅ Downloaded $jsonFile" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "✅ Piper TTS Installation Complete!" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Cyan

Write-Host "Installed:" -ForegroundColor Yellow
Write-Host "  • Piper executable: $piperDir\piper.exe" -ForegroundColor White
Write-Host "  • Voice models: $modelsDir\" -ForegroundColor White
Write-Host "  • 3 Male voices (deep, medium, young)" -ForegroundColor White
Write-Host "  • 2 Female voices (soft, clear)" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Start TTS service: python app-piper.py" -ForegroundColor White
Write-Host "  2. Test voices: node test-piper-voices.js`n" -ForegroundColor White

Write-Host "Features:" -ForegroundColor Yellow
Write-Host "  ✅ FREE - Zero cost" -ForegroundColor Green
Write-Host "  ✅ Offline - No internet needed" -ForegroundColor Green
Write-Host "  ✅ Multiple voices - Male and female" -ForegroundColor Green
Write-Host "  ✅ Fast generation" -ForegroundColor Green
Write-Host "  ✅ Easy to enhance`n" -ForegroundColor Green
