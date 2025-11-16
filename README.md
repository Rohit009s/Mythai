# MythAI — persona-driven RAG chat for Indian mythology

A full-stack RAG (Retrieval-Augmented Generation) chat system that allows users to interact with mythological personas (Krishna, Shiva, Lakshmi) grounded in canonical Sanskrit texts. Replies are citation-backed, emotionally aware, and respect cultural sensitivity.

## Features

- **Persona-driven responses:** Each deity has distinct tone, vocabulary, and style.
- **Citation-backed answers:** Every factual claim references the source text.
- **RAG pipeline:** OpenAI embeddings → Qdrant vector search → LLM generation.
- **Conversation persistence:** Full history stored in MongoDB.
- **Safety & moderation:** Built-in checks to refuse medical/legal/financial advice.
- **TTS-ready:** Placeholder for voice/audio integration (ElevenLabs).
- **Demo mode:** Works without API keys using mock embeddings and responses.

## Project Structure

```
mythai/
├── server/                 # Node/Express backend
│   ├── index.js           # Server entrypoint
│   ├── db.js              # MongoDB connection
│   ├── ingest.js          # CLI: chunk → embed → upsert to Qdrant
│   ├── lib/               # Helpers (OpenAI, Qdrant clients)
│   ├── routes/            # /api/chat, /api/conversations
│   └── __tests__/         # Jest tests (chunking, citations, persistence)
├── frontend/              # React/Vite demo app
│   └── src/               # React components
├── data/
│   ├── texts/             # Source files (bhagavad_gita.txt, mahabharata_excerpt.txt)
│   └── personas/          # Krishna, Shiva, Lakshmi persona JSONs
├── scripts/               # run_tests.js, utilities
├── package.json           # Dependencies
├── .env.example           # Template env vars
├── docker-compose.yml     # Qdrant + Mongo containers
├── jest.config.js         # Test config
└── README.md              # This file
```

## Prerequisites

- **Node.js 18+**
- **Docker** (optional, for running Qdrant + MongoDB locally)
- **OpenAI API key** (optional; demo mode works without it)

## Quick Start (5 minutes)

### 1. Setup environment

```powershell
# Copy and edit env
copy .env.example .env
# Edit .env with your OPENAI_API_KEY (optional; leave blank for demo mode)
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Start local services (optional, for real data)

```powershell
# Requires Docker
docker-compose up -d
```

This starts Qdrant (vector DB on :6333) and MongoDB (:27017).

### 4. Run tests

```powershell
npm test
```

Expected output: **All 12 tests passing** (chunking, citations, conversation persistence).

```
 PASS  server/__tests__/citations.test.js
 PASS  server/__tests__/conversations.test.js
 PASS  server/__tests__/ingest.test.js

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
```

### 5. Start the server

```powershell
npm run server
# Output: Server listening on 3000
```

The server will:
- Try to connect to MongoDB (gracefully falls back to in-memory if unavailable).
- Expose endpoints on `http://localhost:3000`.
- Auto-enable demo mode if `OPENAI_API_KEY` is not set.

### 6. Test the API (new PowerShell terminal)

**Create a conversation:**
```powershell
$h = @{'Content-Type'='application/json'}
$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/conversations' -Method POST -Headers $h -Body '{}'
$convId = ($r.Content | ConvertFrom-Json).conversationId
$convId
```

**Send a chat message:**
```powershell
$body = @{
  conversationId = $convId
  persona = 'krishna'
  text = 'I lied to help a friend. What should I do?'
  audio = $false
} | ConvertTo-Json

$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body
$r.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected response (demo mode):**
```json
{
  "reply": {
    "text": "This is a demo response...",
    "persona": "Krishna",
    "referencedSources": [],
    "audioUrl": null,
    "audioStatus": "none",
    "timestamp": "2025-11-15T..."
  }
}
```

### 7. Ingest data (requires OpenAI + Qdrant running)

```powershell
npm run ingest
```

This will:
- Read `data/texts/*.txt` files.
- Chunk them (configurable via `CHUNK_SIZE_CHARS`, `CHUNK_OVERLAP_CHARS`).
- Call OpenAI embeddings API for each chunk.
- Upsert vectors into Qdrant collection `myth_texts`.

### 8. Run full acceptance test suite

```powershell
npm run test:api
```

This exercises 5 sample queries and checks for citation-backed responses.

## Sample Test Queries

These queries test the RAG pipeline:

1. **"I lied to help a friend. What should I do?"** → Expect: empathy + ethical guidance from Gita.
2. **"What does the Gita say about duty?"** → Expect: citation to Bhagavad Gita chapter/verse.
3. **"Tell me the story of how Krishna lifted Govardhan."** → Expect: narrative + source.
4. **"How can I invest my savings?"** → Expect: safe refusal (financial advice blocked).
5. **"I feel guilty and anxious — any guidance?"** → Expect: compassionate response + takeaway.

## Environment Variables

Create a `.env` file from `.env.example` and adjust:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
DB_NAME=mythai

# Qdrant (vector DB)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=myth_texts
VECTOR_DIM=1536

# OpenAI (leave blank for demo mode)
OPENAI_API_KEY=sk-...
OPENAI_EMBED_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
TEMPERATURE=0.2
MAX_TOKENS=800

# Retrieval & chunking
RETRIEVE_TOP_K=4
CHUNK_SIZE_CHARS=1200
CHUNK_OVERLAP_CHARS=150

# Optional: ElevenLabs for TTS (future feature)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# Safety
RATE_LIMIT_PER_MINUTE=60
MODERATION_THRESHOLD=0.7
```

## API Endpoints

### `POST /api/conversations`

Create a new conversation.

**Request:**
```json
{}
```

**Response:**
```json
{
  "conversationId": "uuid-string"
}
```

### `POST /api/chat`

Send a message and get a reply.

**Request:**
```json
{
  "conversationId": "uuid",
  "persona": "krishna",
  "text": "What is dharma?",
  "audio": false
}
```

**Response:**
```json
{
  "reply": {
    "text": "Dharma is...",
    "persona": "Krishna",
    "referencedSources": [
      {
        "source_title": "Bhagavad Gita",
        "snippet_id": "bg-2-47"
      }
    ],
    "audioUrl": null,
    "audioStatus": "none|pending|failed",
    "timestamp": "2025-11-15T18:30:00Z"
  }
}
```

### `GET /api/conversations/:id`

Retrieve a conversation and all messages.

**Response:**
```json
{
  "_id": "uuid",
  "messages": [
    {
      "sender": "user",
      "text": "What is dharma?",
      "timestamp": "..."
    },
    {
      "sender": "assistant",
      "persona": "Krishna",
      "text": "Dharma is...",
      "referencedSources": [...],
      "timestamp": "..."
    }
  ],
  "createdAt": "..."
}
```

## Personas

Each persona is defined in `data/personas/{name}.json`:

- **Krishna**: gentle, playful, wise. Focus: dharma, karma, duty, action.
- **Shiva**: stern, compassionate, ascetic. Focus: renunciation, meditation, transformation.
- **Lakshmi**: gentle, prosperous, encouraging. Focus: abundance, balance, generosity.

Add more by creating new JSON files with the template:
```json
{
  "name": "SomeDiety",
  "tone": "tone description",
  "vocab": ["word1", "word2"],
  "style": "guidance on style",
  "forbidden": ["restrictions"],
  "citation_format": "(Source: ...)",
  "tts_voice_id": "voice_id",
  "examples": [
    {"q": "question", "a": "answer"}
  ]
}
```

## Running Tests

### Jest unit tests (chunking, citations, persistence)

```powershell
npm test
```

### Full API acceptance tests

```powershell
npm run test:api
```

Requires server running on :3000.

### Watch mode (for development)

```powershell
npm run test:watch
```

## Demo Mode

If `OPENAI_API_KEY` is not set:

- Embeddings are mocked (random vectors).
- LLM responses are canned ("This is a demo response...").
- Moderation is skipped.
- Vector search uses in-memory mock (always returns empty or demo results).

To use real embeddings + chat:
1. Set `OPENAI_API_KEY` in `.env`.
2. (Optionally) Run `docker-compose up -d` and set `QDRANT_URL` and `MONGO_URI` correctly.
3. Restart server.

## Acceptance Criteria (Testing)

The system is validated against these criteria:

- **C1**: Replies include at least one citation for factual claims ≥80% of the time.
- **C2**: Retrieved chunks (top-4 from Qdrant) are relevant and reflected in LLM output.
- **C3**: TTS placeholder works; audio generation can be triggered (async job).
- **C4**: Conversations persist; messages retrievable by ID.
- **C5**: Medical/legal/financial actionable requests are safely refused.

See `scripts/run_tests.js` and `server/__tests__/` for automated checks.

## Production Deployment

### Architecture

For 100+ concurrent users:

- **Frontend:** Deploy React app to Vercel/Netlify.
- **Backend:** Deploy Node server to Render/Railway/ECS with auto-scaling.
- **Vector DB:** Use managed Qdrant Cloud or Pinecone.
- **Database:** MongoDB Atlas (managed).
- **Audio storage:** S3 + CloudFront for TTS audio.

### Cost estimate (monthly, 10k users)

- OpenAI embeddings & chat: ~$50–200 (depends on usage).
- MongoDB Atlas: ~$50.
- Qdrant Cloud: ~$50–500 (scales with vector count).
- Backend hosting (Render): ~$20–100.
- **Total:** ~$170–850/month (highly dependent on query volume and model choices).

### CI/CD

Recommended: GitHub Actions

```yaml
- npm install
- npm test
- npm run ingest (in staging)
- Deploy to production
```

## Known Limitations & Future Work

1. **TTS:** Currently a stub. Integrate ElevenLabs for voice generation.
2. **Fine-tuning:** No active feedback loop yet; can add labeled examples to improve persona consistency.
3. **Retrieval:** In-memory mock used if Qdrant unavailable. For production, ensure Qdrant is always running.
4. **Rate limiting:** Placeholder; implement token-bucket or sliding-window in production.
5. **Auth:** No authentication yet. Add JWT or OAuth2 for multi-user safety.

## Contributing

1. Add new source texts to `data/texts/`.
2. Run `npm run ingest` to embed and index.
3. Add new personas to `data/personas/`.
4. Test with `npm test` and `npm run test:api`.
5. Submit PRs with tests + persona domain expert review.

## License & Attribution

This project uses:

- Public-domain translations of the Bhagavad Gita, Mahabharata, and other texts.
- Always store and surface translator and license metadata.

For production, ensure all source texts have proper licensing and attribution.

## Support & Questions

- **Server crashes?** Check logs; ensure MongoDB is running or set `MONGO_URI` to a valid instance.
- **No citations in replies?** Ensure `OPENAI_API_KEY` is set and `RETRIEVE_TOP_K` > 0.
- **Tests failing?** Run `npm install` again; check Node version ≥18.
- **Frontend not connecting?** Ensure backend is on :3000; check CORS headers.

---

**Happy exploring the depths of Indian mythology with MythAI! 🙏**
