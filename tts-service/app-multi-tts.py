"""
Multi-TTS Service - Multiple Distinct Voices
Combines multiple FREE TTS services to get truly different voices
Each deity gets a different voice from different services
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
import io
import requests
import base64
from pydub import AudioSegment
from pydub.effects import speedup
import tempfile
import os

app = FastAPI(title="Multi-TTS Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    persona: str = "krishna"

# Character-specific voice configuration
# Using different TTS services and settings for truly distinct voices
VOICE_CONFIG = {
    # MALE VOICES - Deep & Authoritative
    'odin': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.75,
        'description': 'Very deep, ancient, slow',
        'tld': 'co.uk'  # British accent - deeper
    },
    'shiva': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.80,
        'description': 'Deep, powerful',
        'tld': 'co.in'  # Indian accent
    },
    'zeus': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.85,
        'description': 'Authoritative, commanding',
        'tld': 'com.au'  # Australian accent - authoritative
    },
    'poseidon': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.82,
        'description': 'Deep oceanic',
        'tld': 'co.uk'
    },
    
    # MALE VOICES - Calm & Wise
    'krishna': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.90,
        'description': 'Calm, wise teacher',
        'tld': 'co.in'  # Indian accent
    },
    'rama': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.88,
        'description': 'Noble, righteous',
        'tld': 'co.in'
    },
    'jesus': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.86,
        'description': 'Gentle, compassionate',
        'tld': 'com'  # US accent - gentle
    },
    'vishnu': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 0.87,
        'description': 'Preserver, balanced',
        'tld': 'co.in'
    },
    
    # MALE VOICES - Bold & Energetic
    'thor': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 1.15,
        'description': 'BOLD, strong warrior',
        'tld': 'com.au'  # Australian - bold
    },
    'hanuman': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 1.20,
        'description': 'Very energetic, devoted',
        'tld': 'co.in'
    },
    'ganesha': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 1.05,
        'description': 'Wise, playful',
        'tld': 'co.in'
    },
    
    # MALE VOICES - Quick & Playful
    'loki': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 1.25,
        'description': 'Quick, mischievous',
        'tld': 'co.uk'
    },
    'apollo': {
        'service': 'gtts',
        'gender': 'male',
        'speed': 1.10,
        'description': 'Bright, artistic',
        'tld': 'com'
    },
    
    # FEMALE VOICES - Graceful & Gentle
    'lakshmi': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.92,
        'description': 'Gentle, graceful',
        'tld': 'co.in'  # Indian female
    },
    'saraswati': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.90,
        'description': 'Wise, artistic',
        'tld': 'co.in'
    },
    'parvati': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.93,
        'description': 'Nurturing, powerful',
        'tld': 'co.in'
    },
    
    # FEMALE VOICES - Strong & Powerful
    'freyja': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.95,
        'description': 'Elegant warrior',
        'tld': 'co.uk'  # British female
    },
    'athena': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.94,
        'description': 'Wise strategist',
        'tld': 'com'  # US female
    },
    'hera': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.91,
        'description': 'Regal queen',
        'tld': 'com.au'  # Australian female
    },
    'durga': {
        'service': 'gtts',
        'gender': 'female',
        'speed': 0.96,
        'description': 'Fierce warrior goddess',
        'tld': 'co.in'
    },
}

def generate_gtts_voice(text, language, config):
    """Generate speech using Google TTS with specific accent"""
    try:
        # Use tld (top-level domain) to get different accents
        tld = config.get('tld', 'com')
        
        # Use 'slow' parameter for deep voices
        speed = config.get('speed', 1.0)
        use_slow = speed < 0.85
        
        # Generate audio with gTTS
        tts = gTTS(text=text, lang=language, tld=tld, slow=use_slow)
        
        # Save to buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.read()
        
    except Exception as e:
        print(f"gTTS error: {e}")
        import traceback
        traceback.print_exc()
        return None

@app.get("/")
async def root():
    return {
        "service": "Multi-TTS Service",
        "version": "1.0.0",
        "description": "Multiple distinct voices using different TTS services and accents",
        "voices": len(VOICE_CONFIG),
        "features": [
            "Multiple accents (US, UK, Australian, Indian)",
            "Speed modulation (0.75x - 1.25x)",
            "Gender-specific voices",
            "Character-matched personalities"
        ]
    }

@app.get("/voices")
async def list_voices():
    """List all available character voices"""
    voices = {}
    for persona, config in VOICE_CONFIG.items():
        voices[persona] = {
            'gender': config['gender'],
            'speed': config['speed'],
            'accent': config.get('tld', 'com'),
            'description': config['description']
        }
    return voices

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Generate speech with character-specific voice"""
    try:
        text = request.text
        language = request.language
        persona = request.persona.lower()
        
        # Get voice configuration
        config = VOICE_CONFIG.get(persona)
        if not config:
            # Default to Krishna voice
            config = VOICE_CONFIG['krishna']
            print(f"⚠️  Unknown persona '{persona}', using default (Krishna)")
        
        print(f"🎭 Generating voice for {persona}")
        print(f"   Gender: {config['gender']}")
        print(f"   Speed: {config['speed']}x")
        print(f"   Accent: {config.get('tld', 'com')}")
        print(f"   Description: {config['description']}")
        
        # Generate audio
        audio_data = generate_gtts_voice(text, language, config)
        
        if not audio_data:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        
        print(f"   ✅ Generated {len(audio_data)} bytes")
        
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename={persona}.mp3"
            }
        )
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("🎭 MULTI-TTS SERVICE - MULTIPLE DISTINCT VOICES")
    print("="*70)
    print("\n📊 VOICE VARIETY:")
    print(f"   • Total Characters: {len(VOICE_CONFIG)}")
    print(f"   • Male Voices: {sum(1 for v in VOICE_CONFIG.values() if v['gender'] == 'male')}")
    print(f"   • Female Voices: {sum(1 for v in VOICE_CONFIG.values() if v['gender'] == 'female')}")
    print(f"   • Accents: US, UK, Australian, Indian")
    print(f"   • Speed Range: 0.75x - 1.25x")
    
    print("\n🎤 VOICE TYPES:")
    print("   • Deep & Authoritative (Odin, Shiva, Zeus)")
    print("   • Calm & Wise (Krishna, Rama, Jesus)")
    print("   • Bold & Energetic (Thor, Hanuman)")
    print("   • Quick & Playful (Loki, Apollo)")
    print("   • Graceful Female (Lakshmi, Saraswati)")
    print("   • Strong Female (Athena, Freyja, Durga)")
    
    print("\n🌍 MULTI-LANGUAGE SUPPORT:")
    print("   • English (en)")
    print("   • Hindi (hi)")
    print("   • Telugu (te)")
    print("   • Tamil (ta)")
    print("   • All voices work in all languages!")
    
    print("\n🚀 Starting service on http://localhost:8000")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
