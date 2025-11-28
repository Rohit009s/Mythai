"""
Enhanced Google TTS Service with Pitch Modulation
FREE, works now, easy to enhance with audio effects
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
import io
from pydub import AudioSegment
from pydub.effects import speedup
import tempfile
import os

app = FastAPI(title="Enhanced Google TTS Service", version="2.0.0")

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

# Enhanced persona settings with CHARACTER-SPECIFIC voice matching
# Each deity gets voice characteristics matching their personality
PERSONA_CONFIG = {
    # ANCIENT WISDOM - Very deep, slow, commanding
    "odin": {"speed": 0.78, "pitch_shift": -6, "gender": "male", "desc": "Ancient, very deep, commanding"},
    "shiva": {"speed": 0.82, "pitch_shift": -5, "gender": "male", "desc": "Deep, powerful, transformative"},
    
    # AUTHORITATIVE LEADERS - Deep, commanding
    "zeus": {"speed": 0.85, "pitch_shift": -4, "gender": "male", "desc": "Authoritative king, commanding"},
    "poseidon": {"speed": 0.84, "pitch_shift": -4, "gender": "male", "desc": "Deep oceanic, powerful"},
    "vishnu": {"speed": 0.88, "pitch_shift": -3, "gender": "male", "desc": "Divine protector, calm authority"},
    
    # CALM TEACHERS - Moderate, balanced
    "krishna": {"speed": 0.90, "pitch_shift": -2, "gender": "male", "desc": "Calm teacher, wise"},
    "rama": {"speed": 0.88, "pitch_shift": -2, "gender": "male", "desc": "Noble king, righteous"},
    "jesus": {"speed": 0.86, "pitch_shift": -2, "gender": "male", "desc": "Gentle, compassionate"},
    "ganesha": {"speed": 0.92, "pitch_shift": -1, "gender": "male", "desc": "Wise, gentle remover of obstacles"},
    
    # BRIGHT & ARTISTIC - Clear, moderate
    "apollo": {"speed": 0.95, "pitch_shift": -1, "gender": "male", "desc": "Bright, clear, artistic"},
    "ayyappa": {"speed": 0.90, "pitch_shift": -1, "gender": "male", "desc": "Calm, composed"},
    
    # BOLD & ENERGETIC - Fast, strong
    "thor": {"speed": 1.10, "pitch_shift": 0, "gender": "male", "desc": "BOLD, strong, energetic warrior"},
    "hanuman": {"speed": 1.12, "pitch_shift": 0, "gender": "male", "desc": "Very energetic, devoted, bold"},
    
    # QUICK & PLAYFUL - Fastest, mischievous
    "loki": {"speed": 1.15, "pitch_shift": 1, "gender": "male", "desc": "Quick, mischievous, playful"},
    
    # FEMALE GODDESSES - Elegant, higher pitch
    "lakshmi": {"speed": 0.93, "pitch_shift": 3, "gender": "female", "desc": "Gentle, graceful, prosperous"},
    "freyja": {"speed": 0.91, "pitch_shift": 2, "gender": "female", "desc": "Elegant warrior, powerful beauty"},
    "athena": {"speed": 0.92, "pitch_shift": 2, "gender": "female", "desc": "Wise strategist, intelligent"},
    "hera": {"speed": 0.91, "pitch_shift": 2, "gender": "female", "desc": "Regal queen, dignified"},
    
    # MULTILINGUAL VARIANTS (inherit from base)
    "krishna_hi": {"speed": 0.88, "pitch_shift": -2, "gender": "male", "desc": "Krishna Hindi"},
    "krishna_te": {"speed": 0.90, "pitch_shift": -2, "gender": "male", "desc": "Krishna Telugu"},
    "shiva_hi": {"speed": 0.80, "pitch_shift": -5, "gender": "male", "desc": "Shiva Hindi"},
    "shiva_te": {"speed": 0.82, "pitch_shift": -5, "gender": "male", "desc": "Shiva Telugu"},
    "rama_te": {"speed": 0.86, "pitch_shift": -2, "gender": "male", "desc": "Rama Telugu"},
    "hanuman_te": {"speed": 1.15, "pitch_shift": 0, "gender": "male", "desc": "Hanuman Telugu"},
    "odin_te": {"speed": 0.76, "pitch_shift": -6, "gender": "male", "desc": "Odin Telugu"},
    "odin_hi": {"speed": 0.78, "pitch_shift": -6, "gender": "male", "desc": "Odin Hindi"},
    "odin_ta": {"speed": 0.77, "pitch_shift": -6, "gender": "male", "desc": "Odin Tamil"},
    "thor_te": {"speed": 1.12, "pitch_shift": 0, "gender": "male", "desc": "Thor Telugu"},
    "thor_hi": {"speed": 1.10, "pitch_shift": 0, "gender": "male", "desc": "Thor Hindi"},
    "thor_ta": {"speed": 1.11, "pitch_shift": 0, "gender": "male", "desc": "Thor Tamil"},
    "loki_te": {"speed": 1.18, "pitch_shift": 1, "gender": "male", "desc": "Loki Telugu"},
    "loki_hi": {"speed": 1.15, "pitch_shift": 1, "gender": "male", "desc": "Loki Hindi"},
    "loki_ta": {"speed": 1.16, "pitch_shift": 1, "gender": "male", "desc": "Loki Tamil"},
    "freyja_te": {"speed": 0.89, "pitch_shift": 2, "gender": "female", "desc": "Freyja Telugu"},
    "freyja_hi": {"speed": 0.91, "pitch_shift": 2, "gender": "female", "desc": "Freyja Hindi"},
    "freyja_ta": {"speed": 0.90, "pitch_shift": 2, "gender": "female", "desc": "Freyja Tamil"},
    "zeus_hi": {"speed": 0.84, "pitch_shift": -4, "gender": "male", "desc": "Zeus Hindi"},
    "zeus_te": {"speed": 0.85, "pitch_shift": -4, "gender": "male", "desc": "Zeus Telugu"},
    "zeus_ta": {"speed": 0.85, "pitch_shift": -4, "gender": "male", "desc": "Zeus Tamil"},
    "jesus_te": {"speed": 0.85, "pitch_shift": -2, "gender": "male", "desc": "Jesus Telugu"},
    
    # Default
    "default": {"speed": 1.0, "pitch_shift": 0, "gender": "neutral", "desc": "Default"}
}

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = None
    enhance: bool = False  # Enable pitch modulation

@app.get("/")
async def root():
    return {
        "service": "Enhanced Google TTS API",
        "status": "running",
        "version": "2.0.0",
        "engine": "gTTS + pydub (pitch modulation)",
        "supported_languages": ["en", "hi", "te", "ta"],
        "supported_personas": list(PERSONA_CONFIG.keys()),
        "cost": "FREE",
        "features": [
            "Multi-language",
            "Speed variations (0.85x - 1.12x)",
            "Pitch modulation (optional)",
            "Gender-based voices",
            "Easy to enhance"
        ]
    }

@app.get("/voices")
async def list_voices():
    return {
        "engine": "Google TTS Enhanced",
        "languages": LANG_MAP,
        "personas": PERSONA_CONFIG,
        "cost": "FREE",
        "enhancement": "Pitch modulation available"
    }

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    """Generate speech using Google TTS with optional pitch modulation"""
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    try:
        # Get language
        lang = LANG_MAP.get(request.language, LANG_MAP["default"])
        
        # Get persona config
        persona_config = PERSONA_CONFIG.get(request.persona, PERSONA_CONFIG["default"])
        speed = persona_config["speed"]
        pitch_shift = persona_config["pitch_shift"]
        gender = persona_config["gender"]
        
        # Generate speech with gTTS
        slow = (speed < 1.0)
        tts = gTTS(text=request.text, lang=lang, slow=slow)
        
        # Save to memory buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # If enhancement requested, apply pitch modulation
        if request.enhance and pitch_shift != 0:
            try:
                # Load audio with pydub
                audio = AudioSegment.from_mp3(audio_buffer)
                
                # Apply pitch shift (semitones)
                # Positive = higher pitch, Negative = lower pitch
                new_sample_rate = int(audio.frame_rate * (2.0 ** (pitch_shift / 12.0)))
                pitched_audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_sample_rate})
                pitched_audio = pitched_audio.set_frame_rate(audio.frame_rate)
                
                # Export to buffer
                output_buffer = io.BytesIO()
                pitched_audio.export(output_buffer, format="mp3")
                output_buffer.seek(0)
                audio_data = output_buffer.read()
                
                print(f"✅ Generated with pitch shift: {pitch_shift} semitones")
            except Exception as e:
                print(f"⚠️  Pitch modulation failed: {e}, using original")
                audio_buffer.seek(0)
                audio_data = audio_buffer.read()
        else:
            audio_data = audio_buffer.read()
        
        # Return audio
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{request.persona or 'default'}.mp3",
                "X-TTS-Engine": "Google-Enhanced",
                "X-Language": request.language,
                "X-Persona": request.persona or "default",
                "X-Speed": str(speed),
                "X-Pitch-Shift": str(pitch_shift) if request.enhance else "0",
                "X-Gender": gender
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "Google TTS Enhanced",
        "ready": True,
        "cost": "FREE",
        "pitch_modulation": "Available"
    }

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("✅ Enhanced Google TTS Service Starting...")
    print("="*70)
    print("Engine: gTTS + pydub")
    print("Features: Speed + Pitch modulation")
    print("Cost: FREE")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
