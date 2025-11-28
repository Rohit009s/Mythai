# 🎤 Piper TTS Service

Simple Python API for text-to-speech using Piper TTS.

## 🚀 Quick Setup

### Step 1: Install Python Dependencies

```bash
cd tts-service
pip install -r requirements.txt
```

### Step 2: Download Voice Models

Download at least one voice model from [Hugging Face](https://huggingface.co/rhasspy/piper-voices/tree/main):

**Recommended Models:**

1. **Telugu** (for Krishna, Shiva in Telugu):
   ```bash
   # Download te_IN-keerthi-medium.onnx
   # URL: https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/keerthi/medium/te_IN-keerthi-medium.onnx
   ```

2. **Hindi**:
   ```bash
   # Download hi_IN-medium.onnx
   # URL: https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/medium/hi_IN-medium.onnx
   ```

3. **Tamil**:
   ```bash
   # Download ta_IN-medium.onnx
   # URL: https://huggingface.co/rhasspy/piper-voices/resolve/main/ta/ta_IN/medium/ta_IN-medium.onnx
   ```

4. **English**:
   ```bash
   # Download en_US-lessac-medium.onnx
   # URL: https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
   ```

**Place all .onnx files in:** `tts-service/models/`

### Step 3: Run the Service

```bash
# Development
python app.py

# Or with uvicorn
uvicorn app:app --reload --port 8000
```

Service will be available at: `http://localhost:8000`

---

## 📡 API Endpoints

### 1. Health Check
```bash
GET http://localhost:8000/
```

**Response:**
```json
{
  "service": "Piper TTS API",
  "status": "running",
  "version": "1.0.0",
  "available_voices": ["en", "te", "hi", "ta"]
}
```

### 2. List Available Voices
```bash
GET http://localhost:8000/voices
```

**Response:**
```json
{
  "available_models": [
    "te_IN-keerthi-medium.onnx",
    "en_US-lessac-medium.onnx"
  ],
  "voice_map": {
    "te": "te_IN-keerthi-medium.onnx",
    "en": "en_US-lessac-medium.onnx"
  }
}
```

### 3. Generate Speech
```bash
POST http://localhost:8000/tts
Content-Type: application/json

{
  "text": "Namaste. I am Krishna.",
  "language": "en",
  "persona": "krishna",
  "speed": 1.0
}
```

**Response:** WAV audio file (binary)

---

## 🔧 Integration with Main Chatbot

### Update Node.js Backend

Edit `server/lib/piperTTSClient.js`:

```javascript
const axios = require('axios');

const PIPER_API_URL = process.env.PIPER_API_URL || 'http://localhost:8000';

async function generateSpeech(text, language = 'en', options = {}) {
  try {
    const response = await axios.post(`${PIPER_API_URL}/tts`, {
      text: text,
      language: language,
      persona: options.persona || null,
      speed: options.speed || 1.0
    }, {
      responseType: 'arraybuffer'
    });
    
    // Convert to base64 for embedding in JSON
    const base64Audio = Buffer.from(response.data).toString('base64');
    return `data:audio/wav;base64,${base64Audio}`;
  } catch (error) {
    console.error('[Piper API] TTS failed:', error.message);
    return null;
  }
}

module.exports = { generateSpeech };
```

### Update .env

```env
# Piper TTS API
PIPER_API_URL=http://localhost:8000
TTS_PROVIDER=piper
```

---

## 🧪 Testing

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

### Test 2: Generate English Speech
```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, I am Krishna", "language": "en"}' \
  --output test.wav
```

### Test 3: Generate Telugu Speech
```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "నమస్తే", "language": "te"}' \
  --output test-telugu.wav
```

---

## 🚀 Deployment

### Option 1: Deploy to Render (FREE)

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: piper-tts-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

2. Push to GitHub
3. Connect to Render
4. Deploy!

### Option 2: Deploy to Railway (FREE)

1. Push to GitHub
2. Connect to Railway
3. Set start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Deploy!

### Option 3: Run Locally

```bash
# Keep running in background
nohup python app.py &
```

---

## 📊 Voice Model Sizes

| Language | Model | Size | Quality |
|----------|-------|------|---------|
| Telugu | te_IN-keerthi-medium | ~60 MB | Good |
| Hindi | hi_IN-medium | ~50 MB | Good |
| Tamil | ta_IN-medium | ~55 MB | Good |
| English | en_US-lessac-medium | ~50 MB | Excellent |

**Total for all 4 languages:** ~215 MB

---

## 🔍 Troubleshooting

### "Piper not found"
```bash
# Install piper-tts
pip install piper-tts

# Or install system-wide
# Windows: Download from GitHub releases
# Linux: apt install piper-tts
```

### "Model not found"
- Download .onnx files from Hugging Face
- Place in `tts-service/models/` directory
- Check file names match VOICE_MAP in app.py

### "Port already in use"
```bash
# Change port
uvicorn app:app --port 8001
```

---

## 💰 Cost

**100% FREE!**
- Piper TTS: Open source, free
- Voice models: Free from Hugging Face
- Hosting: Free tier on Render/Railway
- No API limits or quotas

---

## 📝 Architecture

```
User Query
    ↓
Node.js Backend (port 3000)
    ↓
Generate text response (Llama 3.2 3B)
    ↓
Call Piper TTS API (port 8000)
    ↓
Return audio + text to user
```

---

## 🎯 Next Steps

1. ✅ Install Python dependencies
2. ✅ Download voice models
3. ✅ Run TTS service
4. ✅ Test with curl
5. ✅ Integrate with main chatbot
6. ✅ Deploy to Render/Railway

---

**Status:** Ready for production use!
