# 🔊 Simple Google TTS Service

Free, easy text-to-speech for your mythology chatbot.

## 🚀 Quick Start

### 1. Install (One Time)

```cmd
python -m pip install -r requirements-simple.txt
```

Or use the installer:
```cmd
install-simple.bat
```

### 2. Start Service

```cmd
python app-gtts.py
```

Or use the starter:
```cmd
start-tts-simple.bat
```

Service runs on: `http://localhost:8000`

## 📋 What's Installed

Only 4 small packages:
- `fastapi` - Web framework
- `uvicorn` - Web server
- `pydantic` - Data validation
- `gTTS` - Google Text-to-Speech

Total size: ~20MB

## 🎯 API Endpoints

### GET /
Service info and status

```bash
curl http://localhost:8000/
```

### GET /health
Health check

```bash
curl http://localhost:8000/health
```

### GET /voices
List available voices and personas

```bash
curl http://localhost:8000/voices
```

### POST /tts
Generate speech

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Namaste. I am Krishna.",
    "language": "en",
    "persona": "krishna"
  }' \
  --output speech.mp3
```

## 🎵 Supported Languages

- `en` - English
- `hi` - Hindi (हिन्दी)
- `te` - Telugu (తెలుగు)
- `ta` - Tamil (தமிழ்)

Google TTS supports 100+ languages!

## 🎭 Persona Voices

Each deity has unique voice characteristics:

| Persona | Speed | Description |
|---------|-------|-------------|
| krishna | 0.9 | Calm, measured |
| shiva | 0.85 | Deep, slow |
| rama | 0.9 | Noble, steady |
| hanuman | 1.1 | Energetic |
| ganesha | 0.95 | Wise, gentle |
| vishnu | 0.9 | Calm, divine |
| lakshmi | 0.95 | Gentle, graceful |

## 🔧 Customize

Edit `app-gtts.py`:

```python
# Change voice speeds
PERSONA_SPEED = {
    "krishna": 0.85,  # Make slower
    "hanuman": 1.2,   # Make faster
    # Add new personas:
    "new_deity": 0.95,
}

# Add languages
LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "bn": "bn",  # Bengali
    "mr": "mr",  # Marathi
}
```

## 🐛 Troubleshooting

### Python not found
Install Python 3.8+ from python.org

### pip install fails
```cmd
python -m pip install --upgrade pip
python -m pip install -r requirements-simple.txt
```

### Service won't start
Check if port 8000 is already in use:
```cmd
netstat -ano | findstr :8000
```

### No audio generated
Check logs in terminal for errors

## 💰 Cost

**100% FREE!**
- No API keys needed
- No credit card required
- Unlimited usage

## 📊 Comparison

| Feature | Google TTS | Piper | ElevenLabs |
|---------|-----------|-------|------------|
| Cost | FREE | FREE | $30/mo |
| Quality | Good | Very Good | Excellent |
| Setup | Easy | Medium | Easy |
| Internet | Required | Not needed | Required |

## 🎉 That's It!

Your TTS service is ready. The backend server will automatically use it when audio is requested.

---

**Questions?** Check the main project documentation:
- `TTS_QUICK_START.md`
- `START_TTS_NOW.md`
