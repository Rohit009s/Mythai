"""
Coqui TTS Service - High Quality Multi-language TTS
Supports Telugu, Hindi, Tamil, English with native models
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import torch

app = FastAPI(title="Coqui TTS Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if TTS is available
TTS_AVAILABLE = False
tts_models = {}

try:
    from TTS.api import TTS
    TTS_AVAILABLE = True
    USE_GPU = torch.cuda.is_available()
except ImportError:
    print("⚠️  Coqui TTS not installed. Install with: pip install TTS")
    USE_GPU = False

# Model configuration for different languages
MODEL_CONFIG = {
    # English - Use Jenny model (female) and other single-speaker models
    # We'll use DIFFERENT models for different voice types
    "en": {
        "model": "tts_models/en/ljspeech/tacotron2-DDC",  # Female voice
        "description": "English high quality (Tacotron2)",
        "multi_speaker": False
    },
    "en_male": {
        "model": "tts_models/en/ljspeech/glow-tts",  # Alternative model
        "description": "English alternative voice",
        "multi_speaker": False
    },
    # Telugu - Native Coqui model
    "te": {
        "model": "tts_models/te/cv/vits",
        "description": "Telugu native model (VITS)"
    },
    # Hindi - Multilingual model
    "hi": {
        "model": "tts_models/multilingual/multi-dataset/your_tts",
        "description": "Hindi via multilingual model",
        "language": "hi"
    },
    # Tamil - Multilingual model
    "ta": {
        "model": "tts_models/multilingual/multi-dataset/your_tts",
        "description": "Tamil via multilingual model",
        "language": "ta"
    }
}

# Persona voice characteristics with SPEAKER IDs for different voices!
# VCTK speakers: p225-p376 (109 speakers, mix of male/female, different accents)
# Male speakers (deep): p226, p227, p232, p237, p241, p243, p245, p246, p247, p251, p252, p254, p255, p256, p258, p259, p260, p263, p270, p271, p272, p273, p274, p275, p278, p279, p281, p284, p285, p286, p287, p292, p298, p302, p304, p311, p316, p326, p334, p345, p347, p360, p363, p364, p374, p376
# Female speakers: p225, p228, p229, p230, p231, p233, p234, p236, p238, p239, p240, p244, p248, p249, p250, p253, p257, p261, p262, p264, p265, p266, p267, p268, p269, p276, p277, p280, p282, p283, p288, p293, p294, p295, p297, p299, p300, p301, p303, p305, p306, p307, p308, p310, p312, p313, p314, p317, p318, p323, p329, p330, p333, p335, p336, p339, p340, p341, p343, p351, p361, p362

PERSONA_CONFIG = {
    # Hindu Deities - MALE VOICES
    "krishna": {
        "speed": 0.9,
        "speaker": "p259",      # Male, calm, mature voice
        "emotion": "calm",
        "gender": "male",
        "description": "Divine teacher, peaceful - MALE"
    },
    "krishna_hi": {
        "speed": 0.88,
        "speaker": "p259",
        "emotion": "calm",
        "gender": "male",
        "description": "Krishna in Hindi - MALE"
    },
    "krishna_te": {
        "speed": 0.9,
        "speaker": "p259",
        "emotion": "calm",
        "gender": "male",
        "description": "Krishna in Telugu - MALE"
    },
    
    "shiva": {
        "speed": 0.82,
        "speaker": "p260",      # Male, deep, powerful voice
        "emotion": "deep",
        "gender": "male",
        "description": "Destroyer, transformer - MALE DEEP"
    },
    "shiva_hi": {
        "speed": 0.80,
        "speaker": "p260",
        "emotion": "deep",
        "gender": "male",
        "description": "Shiva in Hindi - MALE DEEP"
    },
    "shiva_te": {
        "speed": 0.82,
        "speaker": "p260",
        "emotion": "deep",
        "gender": "male",
        "description": "Shiva in Telugu - MALE DEEP"
    },
    
    "rama": {
        "speed": 0.88,
        "speaker": "p270",      # Male, noble, steady voice
        "emotion": "noble",
        "gender": "male",
        "description": "Righteous king - MALE NOBLE"
    },
    "rama_te": {
        "speed": 0.86,
        "speaker": "p270",
        "emotion": "noble",
        "gender": "male",
        "description": "Rama in Telugu - MALE NOBLE"
    },
    
    "hanuman": {
        "speed": 1.12,
        "speaker": "p274",      # Male, energetic, younger voice
        "emotion": "energetic",
        "gender": "male",
        "description": "Devoted servant - MALE ENERGETIC"
    },
    "hanuman_te": {
        "speed": 1.15,
        "speaker": "p274",
        "emotion": "energetic",
        "gender": "male",
        "description": "Hanuman in Telugu - MALE ENERGETIC"
    },
    
    "ganesha": {
        "speed": 0.92,
        "speaker": "p278",      # Male, wise, gentle voice
        "emotion": "wise",
        "gender": "male",
        "description": "Remover of obstacles - MALE WISE"
    },
    
    "vishnu": {
        "speed": 0.88,
        "speaker": "p279",      # Male, calm, divine voice
        "emotion": "divine",
        "gender": "male",
        "description": "Preserver - MALE DIVINE"
    },
    
    "lakshmi": {
        "speed": 0.93,
        "speaker": "p229",      # Female, gentle, graceful voice
        "emotion": "gentle",
        "gender": "female",
        "description": "Goddess of prosperity - FEMALE"
    },
    
    "ayyappa": {
        "speed": 0.90,
        "speaker": "p281",      # Male, calm, composed voice
        "emotion": "calm",
        "gender": "male",
        "description": "Lord Ayyappa - MALE"
    },
    
    # Greek Deities - MALE VOICES
    "zeus": {
        "speed": 0.85,
        "speaker": "p263",      # Male, authoritative, powerful
        "emotion": "authoritative",
        "gender": "male",
        "description": "King of gods - MALE AUTHORITATIVE"
    },
    "zeus_hi": {
        "speed": 0.84,
        "speaker": "p263",
        "emotion": "authoritative",
        "gender": "male",
        "description": "Zeus in Hindi - MALE"
    },
    "zeus_te": {
        "speed": 0.85,
        "speaker": "p263",
        "emotion": "authoritative",
        "gender": "male",
        "description": "Zeus in Telugu - MALE"
    },
    
    "apollo": {
        "speed": 0.95,
        "speaker": "p272",      # Male, bright, clear voice
        "emotion": "bright",
        "gender": "male",
        "description": "God of sun and music - MALE BRIGHT"
    },
    "apollo_hi": {
        "speed": 0.93,
        "speaker": "p272",
        "emotion": "bright",
        "gender": "male",
        "description": "Apollo in Hindi - MALE"
    },
    "apollo_te": {
        "speed": 0.95,
        "speaker": "p272",
        "emotion": "bright",
        "gender": "male",
        "description": "Apollo in Telugu - MALE"
    },
    
    "athena": {
        "speed": 0.92,
        "speaker": "p264",      # Female, wise, strategic voice
        "emotion": "wise",
        "gender": "female",
        "description": "Goddess of wisdom - FEMALE WISE"
    },
    
    "poseidon": {
        "speed": 0.84,
        "speaker": "p271",      # Male, deep, powerful like ocean
        "emotion": "powerful",
        "gender": "male",
        "description": "God of the sea - MALE DEEP"
    },
    
    "hera": {
        "speed": 0.91,
        "speaker": "p276",      # Female, regal, dignified voice
        "emotion": "regal",
        "gender": "female",
        "description": "Queen of gods - FEMALE REGAL"
    },
    
    # Norse Deities - MALE & FEMALE VOICES
    "odin": {
        "speed": 0.78,
        "speaker": "p251",      # Male, very deep, ancient voice
        "emotion": "ancient",
        "gender": "male",
        "description": "All-father - MALE ANCIENT DEEP"
    },
    "odin_te": {
        "speed": 0.76,
        "speaker": "p251",
        "emotion": "ancient",
        "gender": "male",
        "description": "Odin in Telugu - MALE DEEP"
    },
    "odin_hi": {
        "speed": 0.78,
        "speaker": "p251",
        "emotion": "ancient",
        "gender": "male",
        "description": "Odin in Hindi - MALE DEEP"
    },
    "odin_ta": {
        "speed": 0.77,
        "speaker": "p251",
        "emotion": "ancient",
        "gender": "male",
        "description": "Odin in Tamil - MALE DEEP"
    },
    
    "thor": {
        "speed": 1.10,
        "speaker": "p245",      # Male, strong, energetic voice
        "emotion": "strong",
        "gender": "male",
        "description": "God of thunder - MALE STRONG"
    },
    "thor_te": {
        "speed": 1.12,
        "speaker": "p245",
        "emotion": "strong",
        "gender": "male",
        "description": "Thor in Telugu - MALE STRONG"
    },
    "thor_hi": {
        "speed": 1.10,
        "speaker": "p245",
        "emotion": "strong",
        "gender": "male",
        "description": "Thor in Hindi - MALE STRONG"
    },
    "thor_ta": {
        "speed": 1.11,
        "speaker": "p245",
        "emotion": "strong",
        "gender": "male",
        "description": "Thor in Tamil - MALE STRONG"
    },
    
    "loki": {
        "speed": 1.15,
        "speaker": "p273",      # Male, quick, mischievous voice
        "emotion": "mischievous",
        "gender": "male",
        "description": "Trickster god - MALE QUICK"
    },
    "loki_te": {
        "speed": 1.18,
        "speaker": "p273",
        "emotion": "mischievous",
        "gender": "male",
        "description": "Loki in Telugu - MALE QUICK"
    },
    "loki_hi": {
        "speed": 1.15,
        "speaker": "p273",
        "emotion": "mischievous",
        "gender": "male",
        "description": "Loki in Hindi - MALE QUICK"
    },
    "loki_ta": {
        "speed": 1.16,
        "speaker": "p273",
        "emotion": "mischievous",
        "gender": "male",
        "description": "Loki in Tamil - MALE QUICK"
    },
    
    "freyja": {
        "speed": 0.91,
        "speaker": "p268",      # Female, graceful, elegant voice
        "emotion": "graceful",
        "gender": "female",
        "description": "Goddess of love and war - FEMALE ELEGANT"
    },
    "freyja_te": {
        "speed": 0.89,
        "speaker": "p268",
        "emotion": "graceful",
        "gender": "female",
        "description": "Freyja in Telugu - FEMALE ELEGANT"
    },
    "freyja_hi": {
        "speed": 0.91,
        "speaker": "p268",
        "emotion": "graceful",
        "gender": "female",
        "description": "Freyja in Hindi - FEMALE ELEGANT"
    },
    "freyja_ta": {
        "speed": 0.90,
        "speaker": "p268",
        "emotion": "graceful",
        "gender": "female",
        "description": "Freyja in Tamil - FEMALE ELEGANT"
    },
    
    # Other
    "jesus": {
        "speed": 0.86,
        "speaker": "p258",      # Male, compassionate, gentle voice
        "emotion": "compassionate",
        "gender": "male",
        "description": "Teacher of love - MALE GENTLE"
    },
    "jesus_te": {
        "speed": 0.85,
        "speaker": "p258",
        "emotion": "compassionate",
        "gender": "male",
        "description": "Jesus in Telugu - MALE GENTLE"
    },
    
    # Default
    "default": {
        "speed": 1.0,
        "speaker": "p270",
        "emotion": "neutral",
        "gender": "male",
        "description": "Default voice - MALE"
    }
}

def get_tts_model(language="en"):
    """Load TTS model for language"""
    if not TTS_AVAILABLE:
        raise Exception("Coqui TTS not installed")
    
    if language not in tts_models:
        config = MODEL_CONFIG.get(language, MODEL_CONFIG["en"])
        model_name = config["model"]
        
        print(f"Loading TTS model: {model_name} for {language}")
        
        try:
            tts = TTS(model_name, gpu=USE_GPU)
            tts_models[language] = tts
            print(f"✅ Model loaded: {model_name}")
        except Exception as e:
            print(f"❌ Failed to load model {model_name}: {e}")
            # Fallback to English
            if language != "en":
                print("Falling back to English model...")
                return get_tts_model("en")
            raise
    
    return tts_models[language]

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = None

@app.get("/")
async def root():
    return {
        "service": "Coqui TTS Service",
        "status": "running" if TTS_AVAILABLE else "error",
        "version": "1.0.0",
        "engine": "Coqui TTS",
        "gpu_available": USE_GPU if TTS_AVAILABLE else False,
        "supported_languages": list(MODEL_CONFIG.keys()),
        "supported_personas": list(PERSONA_CONFIG.keys()),
        "cost": "FREE",
        "features": [
            "Native Telugu support",
            "High quality synthesis",
            "Multi-language",
            "Character-specific voices",
            "GPU acceleration (if available)"
        ]
    }

@app.get("/health")
async def health_check():
    if not TTS_AVAILABLE:
        return {
            "status": "error",
            "ready": False,
            "error": "Coqui TTS not installed",
            "install_command": "pip install TTS"
        }
    
    return {
        "status": "healthy",
        "ready": True,
        "engine": "Coqui TTS",
        "gpu_available": USE_GPU,
        "gpu_device": torch.cuda.get_device_name(0) if USE_GPU else "CPU",
        "loaded_models": list(tts_models.keys())
    }

@app.get("/voices")
async def list_voices():
    return {
        "engine": "Coqui TTS",
        "models": MODEL_CONFIG,
        "personas": PERSONA_CONFIG,
        "gpu_enabled": USE_GPU if TTS_AVAILABLE else False
    }

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    """Generate speech using Coqui TTS"""
    
    if not TTS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Coqui TTS not installed. Run: pip install TTS"
        )
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    try:
        # Get persona settings
        persona_config = PERSONA_CONFIG.get(request.persona, PERSONA_CONFIG["default"])
        speed = persona_config["speed"]
        speaker_id = persona_config.get("speaker", None)
        gender = persona_config.get("gender", "unknown")
        
        # Get TTS model
        tts = get_tts_model(request.language)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Generate speech
        print(f"Generating: lang={request.language}, persona={request.persona}, speed={speed}, speaker={speaker_id}, gender={gender}")
        print(f"Text: {request.text[:100]}...")
        
        # Check if model is multilingual and needs speaker/language
        model_config = MODEL_CONFIG.get(request.language, MODEL_CONFIG["en"])
        
        # Generate with speed control and speaker selection
        if "language" in model_config:
            # Multilingual model - needs language parameter
            tts.tts_to_file(
                text=request.text,
                file_path=temp_path,
                speed=speed,
                language=model_config["language"],
                speaker=speaker_id if speaker_id else (tts.speakers[0] if hasattr(tts, 'speakers') and tts.speakers else None)
            )
        elif model_config.get("multi_speaker", False) and speaker_id:
            # Multi-speaker model (VCTK) - use specific speaker
            tts.tts_to_file(
                text=request.text,
                file_path=temp_path,
                speed=speed,
                speaker=speaker_id
            )
        else:
            # Single language, single speaker model
            tts.tts_to_file(
                text=request.text,
                file_path=temp_path,
                speed=speed
            )
        
        # Read generated audio
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
                "X-TTS-Engine": "Coqui",
                "X-Language": request.language,
                "X-Persona": request.persona or "default",
                "X-Model": MODEL_CONFIG[request.language]["model"]
            }
        )
    
    except Exception as e:
        print(f"❌ TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    if not TTS_AVAILABLE:
        print("\n" + "="*70)
        print("⚠️  Coqui TTS is not installed!")
        print("="*70)
        print("\nTo install Coqui TTS:")
        print("  pip install TTS")
        print("\nOr use the installer:")
        print("  install-coqui.bat")
        print("\n" + "="*70 + "\n")
    else:
        print("\n" + "="*70)
        print("✅ Coqui TTS Service Starting...")
        print("="*70)
        print(f"GPU Available: {USE_GPU}")
        print(f"Supported Languages: {', '.join(MODEL_CONFIG.keys())}")
        print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
