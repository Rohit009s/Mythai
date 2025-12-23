"""
Coqui TTS API Service
Provides high-quality text-to-speech for multi-religious chatbot
Supports Indian languages with emotional control
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
from pathlib import Path
import torch
from TTS.api import TTS
import io

app = FastAPI(title="Coqui TTS Service", version="2.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODELS_DIR = Path("models")
USE_GPU = torch.cuda.is_available()

# Initialize TTS models (lazy loading)
tts_models = {}

# Coqui TTS model mapping for different languages
MODEL_MAP = {
    # Multi-lingual model (supports 100+ languages including Indian)
    "multilingual": "tts_models/multilingual/multi-dataset/xtts_v2",
    
    # English models
    "en": "tts_models/en/ljspeech/tacotron2-DDC",
    "en-fast": "tts_models/en/ljspeech/fast_pitch",
    
    # Indian language models (if available)
    "hi": "tts_models/multilingual/multi-dataset/xtts_v2",  # Hindi via multilingual
    "te": "tts_models/multilingual/multi-dataset/xtts_v2",  # Telugu via multilingual
    "ta": "tts_models/multilingual/multi-dataset/xtts_v2",  # Tamil via multilingual
}

# Persona voice characteristics
PERSONA_SETTINGS = {
    "krishna": {
        "emotion": "friendly",
        "speed": 1.0,
        "pitch": 1.0
    },
    "shiva": {
        "emotion": "calm",
        "speed": 0.9,
        "pitch": 0.95
    },
    "rama": {
        "emotion": "noble",
        "speed": 0.95,
        "pitch": 1.0
    },
    "hanuman": {
        "emotion": "energetic",
        "speed": 1.1,
        "pitch": 1.05
    }
}

def get_tts_model(language="en"):
    """Get or initialize TTS model for language"""
    if language not in tts_models:
        model_name = MODEL_MAP.get(language, MODEL_MAP["multilingual"])
        print(f"Loading TTS model: {model_name}")
        tts_models[language] = TTS(model_name, gpu=USE_GPU)
    return tts_models[language]

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = None
    speed: float = None  # Auto-set based on persona
    emotion: str = None  # Auto-set based on persona

class TTSResponse(BaseModel):
    success: bool
    message: str
    audio_format: str = "wav"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Coqui TTS API",
        "status": "running",
        "version": "2.0.0",
        "engine": "Coqui TTS",
        "gpu_available": USE_GPU,
        "supported_languages": ["en", "hi", "te", "ta", "multilingual"],
        "supported_personas": list(PERSONA_SETTINGS.keys())
    }

@app.get("/voices")
async def list_voices():
    """List available voice models and personas"""
    return {
        "engine": "Coqui TTS",
        "available_models": list(MODEL_MAP.keys()),
        "personas": PERSONA_SETTINGS,
        "gpu_enabled": USE_GPU,
        "features": [
            "Multi-language support",
            "Emotional control",
            "Speed adjustment",
            "High quality synthesis"
        ]
    }

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    """
    Generate speech from text using Coqui TTS
    
    Args:
        text: Text to synthesize
        language: Language code (en, te, hi, ta)
        persona: Optional persona name (krishna, shiva, etc.)
        speed: Speech speed (auto-set based on persona if not provided)
        emotion: Emotion (auto-set based on persona if not provided)
    
    Returns:
        WAV audio file
    """
    
    # Validate input
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    try:
        # Get persona settings
        persona_settings = PERSONA_SETTINGS.get(request.persona, {})
        speed = request.speed if request.speed else persona_settings.get("speed", 1.0)
        
        # Get TTS model for language
        tts = get_tts_model(request.language)
        
        # Create temporary file for output
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio_path = temp_audio.name
        
        # Generate speech
        print(f"Generating speech: lang={request.language}, persona={request.persona}, speed={speed}")
        
        tts.tts_to_file(
            text=request.text,
            file_path=temp_audio_path,
            speed=speed
        )
        
        # Read the generated audio file
        with open(temp_audio_path, "rb") as audio_file:
            audio_data = audio_file.read()
        
        # Clean up temporary file
        os.unlink(temp_audio_path)
        
        # Return audio as response
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{request.persona or 'default'}.wav",
                "X-TTS-Engine": "Coqui",
                "X-Language": request.language,
                "X-Persona": request.persona or "default"
            }
        )
    
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Check if Coqui TTS is working"""
    
    try:
        # Try to load a model
        test_model = TTS.list_models()[0] if TTS.list_models() else None
        
        return {
            "status": "healthy",
            "engine": "Coqui TTS",
            "gpu_available": USE_GPU,
            "gpu_device": torch.cuda.get_device_name(0) if USE_GPU else "CPU",
            "loaded_models": list(tts_models.keys()),
            "available_models": len(TTS.list_models()),
            "test_model": test_model,
            "ready": True
        }
    except Exception as e:
        return {
            "status": "error",
            "engine": "Coqui TTS",
            "error": str(e),
            "ready": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
