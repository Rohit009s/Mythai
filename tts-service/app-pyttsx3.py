"""
Pyttsx3 TTS Service - FREE Offline Multi-Voice TTS
Zero cost, works offline, has male/female voices built-in
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyttsx3
import tempfile
import os

app = FastAPI(title="Pyttsx3 TTS Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TTS engine
engine = None

def get_engine():
    """Get or create TTS engine"""
    global engine
    if engine is None:
        engine = pyttsx3.init()
    return engine

def get_available_voices():
    """Get all available voices"""
    eng = get_engine()
    voices = eng.getProperty('voices')
    return voices

# Persona voice mapping with voice ID and settings
PERSONA_CONFIG = {
    # Male voices (using voice index 0 - typically male on Windows)
    "krishna": {"voice_id": 0, "rate": 160, "volume": 0.9, "gender": "male", "description": "Calm male"},
    "shiva": {"voice_id": 0, "rate": 140, "volume": 0.95, "gender": "male", "description": "Deep powerful male"},
    "rama": {"voice_id": 0, "rate": 155, "volume": 0.9, "gender": "male", "description": "Noble male"},
    "hanuman": {"voice_id": 0, "rate": 190, "volume": 1.0, "gender": "male", "description": "Energetic male"},
    "ganesha": {"voice_id": 0, "rate": 165, "volume": 0.9, "gender": "male", "description": "Wise male"},
    "vishnu": {"voice_id": 0, "rate": 155, "volume": 0.9, "gender": "male", "description": "Divine male"},
    "ayyappa": {"voice_id": 0, "rate": 160, "volume": 0.9, "gender": "male", "description": "Calm male"},
    "zeus": {"voice_id": 0, "rate": 145, "volume": 0.95, "gender": "male", "description": "Authoritative male"},
    "apollo": {"voice_id": 0, "rate": 170, "volume": 0.9, "gender": "male", "description": "Bright male"},
    "poseidon": {"voice_id": 0, "rate": 142, "volume": 0.95, "gender": "male", "description": "Deep male"},
    "odin": {"voice_id": 0, "rate": 135, "volume": 0.95, "gender": "male", "description": "Ancient deep male"},
    "thor": {"voice_id": 0, "rate": 185, "volume": 1.0, "gender": "male", "description": "Strong energetic male"},
    "loki": {"voice_id": 0, "rate": 195, "volume": 1.0, "gender": "male", "description": "Quick mischievous male"},
    "jesus": {"voice_id": 0, "rate": 150, "volume": 0.9, "gender": "male", "description": "Gentle male"},
    
    # Female voices (using voice index 1 - typically female on Windows)
    "lakshmi": {"voice_id": 1, "rate": 165, "volume": 0.9, "gender": "female", "description": "Gentle female"},
    "freyja": {"voice_id": 1, "rate": 162, "volume": 0.9, "gender": "female", "description": "Elegant female"},
    "athena": {"voice_id": 1, "rate": 163, "volume": 0.9, "gender": "female", "description": "Wise female"},
    "hera": {"voice_id": 1, "rate": 162, "volume": 0.9, "gender": "female", "description": "Regal female"},
    
    # Default
    "default": {"voice_id": 0, "rate": 170, "volume": 0.9, "gender": "male", "description": "Default male"}
}

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = None

@app.get("/")
async def root():
    voices = get_available_voices()
    return {
        "service": "Pyttsx3 TTS Service",
        "status": "running",
        "version": "1.0.0",
        "engine": "Pyttsx3 (Offline TTS)",
        "cost": "FREE - Zero cost, offline",
        "available_system_voices": len(voices),
        "supported_personas": list(PERSONA_CONFIG.keys()),
        "features": [
            "FREE - No API costs",
            "Offline - No internet needed",
            "Multiple voices (male/female)",
            "Fast generation",
            "Built into Windows"
        ]
    }

@app.get("/health")
async def health_check():
    try:
        voices = get_available_voices()
        return {
            "status": "healthy",
            "ready": True,
            "engine": "Pyttsx3",
            "system_voices": len(voices),
            "cost": "FREE"
        }
    except Exception as e:
        return {
            "status": "error",
            "ready": False,
            "error": str(e)
        }

@app.get("/voices")
async def list_voices():
    voices = get_available_voices()
    voice_list = []
    for i, voice in enumerate(voices):
        voice_list.append({
            "id": i,
            "name": voice.name,
            "languages": voice.languages if hasattr(voice, 'languages') else []
        })
    
    return {
        "engine": "Pyttsx3",
        "system_voices": voice_list,
        "personas": PERSONA_CONFIG,
        "cost": "FREE"
    }

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    """Generate speech using Pyttsx3"""
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    try:
        # Get persona settings
        persona_config = PERSONA_CONFIG.get(request.persona, PERSONA_CONFIG["default"])
        voice_id = persona_config["voice_id"]
        rate = persona_config["rate"]
        volume = persona_config["volume"]
        gender = persona_config["gender"]
        
        # Get engine
        eng = get_engine()
        voices = eng.getProperty('voices')
        
        # Set voice (0 = male, 1 = female on most Windows systems)
        if voice_id < len(voices):
            eng.setProperty('voice', voices[voice_id].id)
        
        # Set rate (speed) and volume
        eng.setProperty('rate', rate)
        eng.setProperty('volume', volume)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_path = temp_file.name
        
        print(f"Generating: persona={request.persona}, voice={voice_id} ({gender}), rate={rate}")
        print(f"Text: {request.text[:100]}...")
        
        # Generate speech
        eng.save_to_file(request.text, temp_path)
        eng.runAndWait()
        
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
                "X-TTS-Engine": "Pyttsx3",
                "X-Voice-ID": str(voice_id),
                "X-Gender": gender,
                "X-Rate": str(rate)
            }
        )
    
    except Exception as e:
        print(f"❌ TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("✅ Pyttsx3 TTS Service Starting...")
    print("="*70)
    print("Engine: Pyttsx3 (Built into Windows)")
    print("Cost: FREE")
    print("Voices: Male and Female")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
