"""
Piper TTS Service - FREE Multi-Voice TTS
Zero cost, offline, multiple male/female voices
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import subprocess
import json

app = FastAPI(title="Piper TTS Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Piper executable path
PIPER_PATH = os.path.join(os.path.dirname(__file__), "piper", "piper.exe")
MODELS_PATH = os.path.join(os.path.dirname(__file__), "piper", "models")

# Available Piper voices (FREE, no API key needed!)
PIPER_VOICES = {
    # MALE VOICES
    "male_deep": {
        "model": "en_US-lessac-medium.onnx",
        "description": "Male, deep, authoritative",
        "gender": "male",
        "pitch": "low"
    },
    "male_medium": {
        "model": "en_US-ryan-medium.onnx",
        "description": "Male, medium, clear",
        "gender": "male",
        "pitch": "medium"
    },
    "male_young": {
        "model": "en_US-joe-medium.onnx",
        "description": "Male, younger, energetic",
        "gender": "male",
        "pitch": "medium-high"
    },
    
    # FEMALE VOICES
    "female_soft": {
        "model": "en_US-amy-medium.onnx",
        "description": "Female, soft, gentle",
        "gender": "female",
        "pitch": "medium"
    },
    "female_clear": {
        "model": "en_US-libritts-high.onnx",
        "description": "Female, clear, professional",
        "gender": "female",
        "pitch": "medium-high"
    }
}

# Persona to voice mapping with speed control
PERSONA_CONFIG = {
    # Hindu Deities - MALE VOICES
    "krishna": {"voice": "male_medium", "speed": 0.9, "description": "Calm male"},
    "shiva": {"voice": "male_deep", "speed": 0.82, "description": "Deep powerful male"},
    "rama": {"voice": "male_medium", "speed": 0.88, "description": "Noble male"},
    "hanuman": {"voice": "male_young", "speed": 1.12, "description": "Energetic male"},
    "ganesha": {"voice": "male_medium", "speed": 0.92, "description": "Wise male"},
    "vishnu": {"voice": "male_deep", "speed": 0.88, "description": "Divine male"},
    "ayyappa": {"voice": "male_medium", "speed": 0.90, "description": "Calm male"},
    
    # Hindu Goddesses - FEMALE VOICES
    "lakshmi": {"voice": "female_soft", "speed": 0.93, "description": "Gentle female"},
    
    # Greek Deities - MALE VOICES
    "zeus": {"voice": "male_deep", "speed": 0.85, "description": "Authoritative male"},
    "apollo": {"voice": "male_medium", "speed": 0.95, "description": "Bright male"},
    "poseidon": {"voice": "male_deep", "speed": 0.84, "description": "Deep powerful male"},
    
    # Greek Goddesses - FEMALE VOICES
    "athena": {"voice": "female_clear", "speed": 0.92, "description": "Wise female"},
    "hera": {"voice": "female_clear", "speed": 0.91, "description": "Regal female"},
    
    # Norse Deities - MALE VOICES
    "odin": {"voice": "male_deep", "speed": 0.78, "description": "Ancient deep male"},
    "thor": {"voice": "male_young", "speed": 1.10, "description": "Strong energetic male"},
    "loki": {"voice": "male_young", "speed": 1.15, "description": "Quick mischievous male"},
    
    # Norse Goddesses - FEMALE VOICES
    "freyja": {"voice": "female_soft", "speed": 0.91, "description": "Elegant female"},
    
    # Christian
    "jesus": {"voice": "male_medium", "speed": 0.86, "description": "Gentle male"},
    
    # Default
    "default": {"voice": "male_medium", "speed": 1.0, "description": "Default male"}
}

def check_piper_installed():
    """Check if Piper is installed"""
    return os.path.exists(PIPER_PATH)

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = None

@app.get("/")
async def root():
    piper_installed = check_piper_installed()
    
    return {
        "service": "Piper TTS Service",
        "status": "running" if piper_installed else "error",
        "version": "1.0.0",
        "engine": "Piper TTS",
        "cost": "FREE - Zero cost, offline",
        "piper_installed": piper_installed,
        "piper_path": PIPER_PATH if piper_installed else "Not found",
        "available_voices": len(PIPER_VOICES),
        "supported_personas": list(PERSONA_CONFIG.keys()),
        "features": [
            "FREE - No API costs",
            "Offline - No internet needed",
            "Multiple voices (male/female)",
            "Fast generation",
            "Easy to enhance"
        ]
    }

@app.get("/health")
async def health_check():
    piper_installed = check_piper_installed()
    
    if not piper_installed:
        return {
            "status": "error",
            "ready": False,
            "error": "Piper not installed",
            "install_guide": "Run: install-piper.bat"
        }
    
    return {
        "status": "healthy",
        "ready": True,
        "engine": "Piper TTS",
        "piper_path": PIPER_PATH,
        "voices_available": list(PIPER_VOICES.keys())
    }

@app.get("/voices")
async def list_voices():
    return {
        "engine": "Piper TTS",
        "voices": PIPER_VOICES,
        "personas": PERSONA_CONFIG,
        "cost": "FREE"
    }

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    """Generate speech using Piper TTS"""
    
    if not check_piper_installed():
        raise HTTPException(
            status_code=503,
            detail="Piper TTS not installed. Run: install-piper.bat"
        )
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    try:
        # Get persona settings
        persona_config = PERSONA_CONFIG.get(request.persona, PERSONA_CONFIG["default"])
        voice_id = persona_config["voice"]
        speed = persona_config["speed"]
        
        # Get voice model
        voice_config = PIPER_VOICES.get(voice_id, PIPER_VOICES["male_medium"])
        model_file = os.path.join(MODELS_PATH, voice_config["model"])
        
        if not os.path.exists(model_file):
            raise HTTPException(
                status_code=404,
                detail=f"Voice model not found: {voice_config['model']}"
            )
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_path = temp_file.name
        
        print(f"Generating: persona={request.persona}, voice={voice_id}, speed={speed}")
        print(f"Model: {voice_config['model']}")
        print(f"Text: {request.text[:100]}...")
        
        # Run Piper TTS
        # piper.exe --model model.onnx --output_file output.wav < input.txt
        cmd = [
            PIPER_PATH,
            "--model", model_file,
            "--output_file", temp_path,
            "--length_scale", str(1.0 / speed)  # Piper uses length_scale (inverse of speed)
        ]
        
        # Run command with text as input
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=request.text)
        
        if process.returncode != 0:
            raise Exception(f"Piper failed: {stderr}")
        
        # Read generated audio
        if not os.path.exists(temp_path):
            raise Exception("Audio file not generated")
        
        with open(temp_path, "rb") as audio_file:
            audio_data = audio_file.read()
        
        # Clean up
        os.unlink(temp_path)
        
        print(f"✅ Generated {len(audio_data)} bytes")
        
        # Return audio
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{request.persona or 'default'}.wav",
                "X-TTS-Engine": "Piper",
                "X-Voice": voice_id,
                "X-Model": voice_config["model"],
                "X-Gender": voice_config["gender"],
                "X-Speed": str(speed)
            }
        )
    
    except Exception as e:
        print(f"❌ TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    if not check_piper_installed():
        print("\n" + "="*70)
        print("⚠️  Piper TTS is not installed!")
        print("="*70)
        print("\nTo install Piper TTS:")
        print("  Run: install-piper.bat")
        print("\nPiper TTS is:")
        print("  ✅ FREE - Zero cost")
        print("  ✅ Offline - No internet needed")
        print("  ✅ Multiple voices - Male and female")
        print("  ✅ Fast - Quick generation")
        print("\n" + "="*70 + "\n")
    else:
        print("\n" + "="*70)
        print("✅ Piper TTS Service Starting...")
        print("="*70)
        print(f"Piper Path: {PIPER_PATH}")
        print(f"Available Voices: {len(PIPER_VOICES)}")
        print(f"Cost: FREE")
        print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
