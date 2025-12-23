# MythAI Multi-Model Pipeline API Documentation

## Overview

The MythAI API provides access to a sophisticated multi-model pipeline that combines factual accuracy with emotional intelligence for spiritual guidance. The system uses a two-stage architecture with specialized models for different aspects of response generation.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Core Chat API

### POST /api/chat

The main chat endpoint that processes user messages through the multi-model pipeline.

**Request Body:**
```json
{
  "conversationId": "string (optional)",
  "persona": "string (default: 'krishna')",
  "text": "string (required)",
  "audio": "boolean (default: false)",
  "useTwoStage": "boolean (default: true)"
}
```

**Response:**
```json
{
  "reply": {
    "text": "string",
    "persona": "string",
    "referencedSources": [
      {
        "source_title": "string",
        "snippet_id": "string"
      }
    ],
    "audioUrl": "string|null",
    "audioStatus": "string",
    "timestamp": "string",
    "pipeline": {
      "mode": "two-stage|single-stage|single-stage-fallback",
      "fallbackUsed": "boolean",
      "timing": {
        "thinker": "number (ms)",
        "speaker": "number (ms)",
        "tts": "number (ms)",
        "total": "number (ms)"
      },
      "models": {
        "thinker": "string",
        "speaker": "string",
        "tts": "string"
      },
      "emotion": "string",
      "confidence": "number"
    }
  }
}
```

**Pipeline Modes:**
- `two-stage`: Full multi-model pipeline (Thinker → Speaker)
- `single-stage`: Traditional single-model processing
- `single-stage-fallback`: Fallback mode when pipeline fails

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "text": "What does the Gita say about duty?",
    "persona": "krishna",
    "audio": true,
    "useTwoStage": true
  }'
```

### GET /api/chat/status

Check the status of the multi-model pipeline.

**Response:**
```json
{
  "twoStageEnabled": "boolean",
  "pipelineAvailable": "boolean",
  "ttsProvider": "string",
  "timeout": "number",
  "pipelineStatus": {
    "thinkerAvailable": "boolean",
    "speakerAvailable": "boolean",
    "lastError": "string|null"
  }
}
```

## MCP (Model Context Protocol) API

### GET /api/mcp/status

Check MCP server status and availability.

**Response:**
```json
{
  "success": "boolean",
  "available": "boolean",
  "initialized": "boolean",
  "servers": {
    "sacredTexts": "boolean",
    "deityPersonas": "boolean"
  }
}
```

### POST /api/mcp/search-texts

Search sacred texts via MCP.

**Request Body:**
```json
{
  "query": "string (required)",
  "tradition": "string (default: 'all')",
  "language": "string (default: 'en')"
}
```

**Response:**
```json
{
  "success": "boolean",
  "results": [
    {
      "book": "string",
      "chapter": "string",
      "verse": "string",
      "text": "string",
      "score": "number",
      "tradition": "string"
    }
  ],
  "count": "number"
}
```

### GET /api/mcp/deities/:tradition

List available deities for a specific tradition.

**Parameters:**
- `tradition`: Religious tradition (e.g., "hindu", "greek", "norse")

**Response:**
```json
{
  "success": "boolean",
  "tradition": "string",
  "deities": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "voiceId": "string"
    }
  ],
  "count": "number"
}
```

### GET /api/mcp/persona/:deity

Get deity persona configuration.

**Parameters:**
- `deity`: Deity identifier (e.g., "krishna", "zeus")

**Query Parameters:**
- `language`: Language code (default: "en")

**Response:**
```json
{
  "success": "boolean",
  "persona": {
    "name": "string",
    "style": "string",
    "personality": "object",
    "voiceSettings": "object",
    "books": "array"
  }
}
```

### GET /api/mcp/texts

List available sacred texts.

**Query Parameters:**
- `tradition`: Filter by tradition (default: "all")

**Response:**
```json
{
  "success": "boolean",
  "texts": [
    {
      "title": "string",
      "tradition": "string",
      "language": "string",
      "chapters": "number"
    }
  ],
  "count": "number"
}
```

## Authentication API

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "age": "number (required)",
  "religion": "string (required)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "age": "number",
    "religion": "string"
  }
}
```

### POST /api/auth/login

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "age": "number",
    "religion": "string"
  }
}
```

## Conversation API

### GET /api/conversations

Get user's conversation history.

**Query Parameters:**
- `limit`: Number of conversations to return (default: 10)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "conversations": [
    {
      "conversationId": "string",
      "title": "string",
      "lastMessage": "string",
      "timestamp": "string",
      "messageCount": "number"
    }
  ],
  "total": "number"
}
```

### GET /api/conversations/:id

Get specific conversation messages.

**Parameters:**
- `id`: Conversation ID

**Response:**
```json
{
  "conversationId": "string",
  "messages": [
    {
      "sender": "user|assistant",
      "text": "string",
      "persona": "string",
      "timestamp": "string",
      "referencedSources": "array",
      "audioUrl": "string|null"
    }
  ]
}
```

## Health Check

### GET /health

System health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "string"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "string",
  "details": "string (optional)",
  "code": "string (optional)"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (access denied)
- `404`: Not Found (resource not found)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- Default: 60 requests per minute per user
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Pipeline Processing Modes

### Two-Stage Mode (Recommended)

1. **Thinker Stage (Mistral 7B)**:
   - Generates embeddings for user question
   - Searches vector database for relevant scriptures
   - Analyzes retrieved texts for factual accuracy
   - Extracts proper references (book, chapter, verse)
   - Creates structured, factual response

2. **Speaker Stage (Llama 3.1 8B)**:
   - Receives structured data from Thinker
   - Converts complex language to simple terms
   - Adds emotional intelligence and warmth
   - Applies deity personality traits
   - Generates final humanized response

### Single-Stage Mode (Fallback)

- Uses traditional single-model processing
- Faster but less sophisticated
- Automatically used when pipeline fails
- Maintains backward compatibility

## Supported Personas

### Hindu Tradition
- `krishna`: Lord Krishna (Bhagavad Gita, Puranas)
- `rama`: Lord Rama (Ramayana)
- `shiva`: Lord Shiva (Shiva Purana)
- `vishnu`: Lord Vishnu (Vishnu Purana)
- `ganesha`: Lord Ganesha (Ganesha Purana)
- `hanuman`: Lord Hanuman (Hanuman Chalisa)
- `lakshmi`: Goddess Lakshmi (Lakshmi Purana)

### Greek Tradition
- `zeus`: Zeus (Iliad, Odyssey)
- `athena`: Athena (Greek mythology)
- `apollo`: Apollo (Greek mythology)
- `poseidon`: Poseidon (Greek mythology)

### Norse Tradition
- `odin`: Odin (Prose Edda, Poetic Edda)
- `thor`: Thor (Norse mythology)
- `loki`: Loki (Norse mythology)
- `freyja`: Freyja (Norse mythology)

## TTS (Text-to-Speech) Support

### Supported Providers
- `elevenlabs`: High-quality AI voices (paid)
- `google`: Google Text-to-Speech (free)
- `coqui`: Open-source TTS (free)

### Voice Configuration
Each persona has specific voice settings:
- Voice ID mapping
- Emotion-based modulation
- Stability and similarity settings
- Speaking style adjustments

### Audio Response Format
- Format: MP3
- Quality: 44.1kHz, 128kbps
- Delivery: Base64 encoded or URL

## Best Practices

### Request Optimization
1. Use `useTwoStage: false` for simple queries to reduce latency
2. Enable audio only when needed to save bandwidth
3. Reuse conversation IDs to maintain context
4. Cache persona configurations client-side

### Error Handling
1. Always check `pipeline.fallbackUsed` to detect degraded performance
2. Implement retry logic for 5xx errors
3. Handle rate limiting gracefully
4. Provide fallback UI for TTS failures

### Performance Monitoring
1. Monitor `pipeline.timing` for performance insights
2. Track `pipeline.mode` usage patterns
3. Alert on high fallback usage rates
4. Monitor error rates by endpoint

## SDK Examples

### JavaScript/Node.js
```javascript
const MythAI = require('mythai-sdk');

const client = new MythAI({
  baseURL: 'http://localhost:3000/api',
  token: 'your-jwt-token'
});

// Send message with two-stage processing
const response = await client.chat({
  text: "What is dharma?",
  persona: "krishna",
  audio: true,
  useTwoStage: true
});

console.log(response.reply.text);
console.log(`Processing time: ${response.reply.pipeline.timing.total}ms`);
```

### Python
```python
import requests

class MythAI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def chat(self, text, persona='krishna', audio=False, use_two_stage=True):
        response = requests.post(
            f'{self.base_url}/chat',
            json={
                'text': text,
                'persona': persona,
                'audio': audio,
                'useTwoStage': use_two_stage
            },
            headers=self.headers
        )
        return response.json()

# Usage
client = MythAI('http://localhost:3000/api', 'your-jwt-token')
result = client.chat("Tell me about karma", persona="krishna")
print(result['reply']['text'])
```

## Changelog

### v2.0.0 (Current)
- Added multi-model pipeline support
- Introduced two-stage processing (Thinker + Speaker)
- Enhanced MCP integration
- Added pipeline status monitoring
- Improved error handling and fallback logic

### v1.0.0
- Initial API release
- Basic chat functionality
- Single-model processing
- Authentication system