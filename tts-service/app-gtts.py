"""
Simple Google TTS Service
Works immediately without complex installation
Supports Hindi, Telugu, Tamil, and English
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
import io

app = FastAPI(title="Google TTS Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Language mapping
LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "te": "te",
    "ta": "ta",
    "default": "en"
}

# Persona voice settings (speed adjustments)
PERSONA_SPEED = {
    "krishna": 0.9,    # Calm, measured
    "shiva": 0.85,     # Deep, slow
    "rama": 0.9,       # Noble, steady
    "hanuman": 1.1,    # Energetic
    "ganesha": 0.95,   # Wise, gentle
    "vishnu": 0.9,     # Calm, divine
    "lakshmi": 0.95,   # Gentle, graceful
    "default": 1.0
}

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = None

@app.get("/")
async def root():
    return {
        "service": "Google TTS API",
        "status": "running",
        "version": "1.0.0",
        "engine": "gTTS (Google Text-to-Speech)",
        "supported_languages": ["en", "hi", "te", "ta"],
        "supported_personas": list(PERSONA_SPEED.keys()),
        "cost": "FREE",
        "features": ["Multi-language", "Fast", "No installation needed"]
    }

@app.get("/voices")
async def list_voices():
    return {
        "engine": "Google TTS",
        "languages": LANG_MAP,
        "personas": PERSONA_SPEED,
        "cost": "FREE"
    }

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    """Generate speech using Google TTS"""
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    try:
        # Get language
        lang = LANG_MAP.get(request.language, LANG_MAP["default"])
        
        # Get speed for persona
        speed = PERSONA_SPEED.get(request.persona, PERSONA_SPEED["default"])
        slow = (speed < 1.0)
        
        # Generate speech
        tts = gTTS(text=request.text, lang=lang, slow=slow)
        
        # Save to memory buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        audio_data = audio_buffer.read()
        
        # Return audio
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{request.persona or 'default'}.mp3",
                "X-TTS-Engine": "Google",
                "X-Language": request.language,
                "X-Persona": request.persona or "default"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "Google TTS",
        "ready": True,
        "cost": "FREE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
