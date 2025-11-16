# MythAI Text-to-Speech Integration

## Overview

MythAI now supports **ElevenLabs Text-to-Speech (TTS)** for generating high-quality audio responses from mythological personas.

## Setup

### 1. Get ElevenLabs API Key

1. Go to https://elevenlabs.io
2. Sign up for a free account (includes 10,000 free characters/month)
3. Navigate to **API Keys** in your dashboard
4. Copy your API key

### 2. Configure `.env`

```bash
ELEVENLABS_API_KEY=sk_a3b53f751a92e407a0f3a2d2ba59b95360015503f3364603
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVY5Cd5
```

### 3. Available Voice IDs

Get the full list via API:
```bash
curl -H "xi-api-key: YOUR_KEY" https://api.elevenlabs.io/v1/voices
```

**Popular Voices:**

| Voice ID | Name | Type | Best For |
|----------|------|------|----------|
| `JBFqnCBsd6RMkjVY5Cd5` | Giovanni | Male, Professional | Krishna (wisdom) |
| `EXAVITQu4vr4xnSDxMaL` | Bella | Female, Calm | Lakshmi (gentle) |
| `pNInz6obpgDQGcFmaJgB` | Antoni | Male, Energetic | Shiva (intense) |
| `21m00Tcm4TlvDq3XchAA` | Rachel | Female, Expressive | General |
| `IZSifFFz5roFQ3xNXl86` | Chris | Male, Deep | Shiva (stern) |

## Usage

### Request with Audio

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "persona": "krishna",
    "text": "What is dharma?",
    "audio": true
  }'
```

### Response

```json
{
  "reply": {
    "text": "Dharma is your sacred duty...",
    "persona": "Krishna",
    "referencedSources": [
      {
        "source_title": "Bhagavad Gita",
        "snippet_id": "chunk_42"
      }
    ],
    "audioUrl": "data:audio/mpeg;base64,SUQzBAAAAAAI3QAQAAAA...",
    "audioStatus": "success",
    "timestamp": "2025-11-16T10:30:00.000Z"
  }
}
```

### Audio Status Values

| Status | Meaning |
|--------|---------|
| `none` | Audio was not requested (`audio: false`) |
| `pending` | Audio generation in progress |
| `success` | Audio successfully generated (see `audioUrl`) |
| `failed` | Audio generation failed (network or quota issue) |

## PowerShell Test

```powershell
# Set up
$h = @{'Content-Type'='application/json'}

# Create conversation
$conv = (Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' `
  -Method POST -Headers $h -Body '{}').Content | ConvertFrom-Json
$id = $conv.conversationId

# Send message with audio
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'Tell me about the three gunas.'
  audio = $true
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' `
  -Method POST -Headers $h -Body $body

$reply = $resp.Content | ConvertFrom-Json

Write-Host "Status: $($reply.reply.audioStatus)"
Write-Host "Has Audio: $($reply.reply.audioUrl -ne $null)"
Write-Host "Text: $($reply.reply.text)"
```

## Advanced: Different Voices per Persona

In future updates, each persona will have a preferred voice:

```json
// data/personas/krishna.json
{
  "name": "Krishna",
  "tone": "gentle, playful, wise",
  "tts_voice_id": "JBFqnCBsd6RMkjVY5Cd5",  // Giovanni
  ...
}

// data/personas/shiva.json
{
  "name": "Shiva",
  "tone": "stern, compassionate, ascetic",
  "tts_voice_id": "IZSifFFz5roFQ3xNXl86",  // Chris (deep)
  ...
}

// data/personas/lakshmi.json
{
  "name": "Lakshmi",
  "tone": "gentle, prosperous, encouraging",
  "tts_voice_id": "EXAVITQu4vr4xnSDxMaL",  // Bella
  ...
}
```

## Demo Mode

If `ELEVENLABS_API_KEY` is not set:
- Audio endpoint still works
- Returns `audioStatus: "none"` or `"failed"`
- Text responses work normally
- Perfect for testing without TTS quota usage

## Billing & Quotas

**Free Tier:**
- 10,000 characters per month
- ~50 typical responses (200 chars each)
- Sufficient for prototyping

**Pro Tier:**
- $99/month (includes 500,000 chars/month)
- Plus higher quality models

**Cost Estimate for MythAI:**
- Average response: ~200 characters
- With 1000 users × 10 queries = 10,000 chars/month ✅ (Free tier)
- With 10,000 users × 10 queries = 100,000 chars/month (need Pro)

## Troubleshooting

### "audioStatus: failed"

**Possible causes:**
1. API key invalid or expired → Check `.env` file
2. Network timeout → ElevenLabs server overloaded
3. Monthly quota exceeded → Wait or upgrade plan
4. Response text too long → Truncate in chat.js line 58

**Fix:**
```bash
# Verify API key is valid
curl -H "xi-api-key: YOUR_KEY" https://api.elevenlabs.io/v1/voices

# Check character usage
curl -H "xi-api-key: YOUR_KEY" https://api.elevenlabs.io/v1/user
```

### No Audio URL Returned (Production Mode)

Currently returns base64-encoded audio in response. For large-scale deployment:

1. **Option A: S3 Storage**
   ```javascript
   // In elevenLabsClient.js
   const aws = require('aws-sdk');
   const s3 = new aws.S3();
   await s3.putObject({
     Bucket: 'mythai-audio',
     Key: `audio/${Date.now()}.mp3`,
     Body: response.data,
   });
   return `https://mythai-audio.s3.amazonaws.com/audio/${Date.now()}.mp3`;
   ```

2. **Option B: CloudFlare R2**
   ```javascript
   const response = await fetch('https://your-r2-bucket.example.com/upload', {
     method: 'PUT',
     body: audioBuffer,
   });
   ```

3. **Option C: Presigned URLs**
   ```javascript
   // Return temporary signed URL for client to download
   return `https://signed-url.example.com/audio/abc123?expires=3600`;
   ```

## API Reference

### POST /api/chat

**Request:**
```json
{
  "conversationId": "string (UUID)",
  "persona": "krishna|shiva|lakshmi",
  "text": "string (user message)",
  "audio": boolean (default: false)
}
```

**Response:**
```json
{
  "reply": {
    "text": "string (LLM response)",
    "persona": "string",
    "referencedSources": [
      { "source_title": "string", "snippet_id": "string" }
    ],
    "audioUrl": "string | null",
    "audioStatus": "none|pending|success|failed",
    "timestamp": "ISO8601"
  }
}
```

### GET /api/voices

**Response:**
```json
{
  "voices": [
    {
      "voice_id": "JBFqnCBsd6RMkjVY5Cd5",
      "name": "Giovanni",
      "preview_url": "https://..."
    }
  ]
}
```

## Next Steps

1. ✅ Test `/api/voices` endpoint
2. ✅ Send a message with `audio: true`
3. ✅ Verify `audioStatus: success` in response
4. 📱 Build frontend to play audio in UI
5. 🎨 Update persona cards to show voice samples
6. 📊 Add usage analytics dashboard

---

**Questions?** Check the main README.md or run `node test-tts.js` to verify setup.
