# MythAI Quick Reference

## 1. First Time Setup (1 minute)

```powershell
cd D:\aiproject\mythai
copy .env.example .env
# (Optional: edit .env to add OPENAI_API_KEY)
npm install
```

## 2. Run All Tests (1 minute)

```powershell
npm test
```

**Expected:** All 12 tests pass.

## 3. Start Backend Server (10 seconds)

Terminal #1:
```powershell
npm run server
# Output: "Server listening on 3000"
```

## 4. Test API (use Terminal #2)

### Create a conversation:
```powershell
$h = @{'Content-Type'='application/json'}
$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/conversations' -Method POST -Headers $h -Body '{}'
$id = ($r.Content | ConvertFrom-Json).conversationId
Write-Host "Conversation ID: $id"
```

### Send a chat message:
```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'I lied to help a friend. What should I do?'
  audio = $false
} | ConvertTo-Json

$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body
$r.Content | ConvertFrom-Json | ConvertTo-Json
```

Expected: JSON response with `reply.text` (demo: "This is a demo response...").

### Fetch conversation:
```powershell
$r = Invoke-WebRequest -Uri "http://localhost:3000/api/conversations/$id" -Method GET -Headers $h
$r.Content | ConvertFrom-Json | ConvertTo-Json
```

Expected: Full conversation with user + assistant messages.

## 5. With Real Data (requires OPENAI_API_KEY)

```powershell
# Set OPENAI_API_KEY in .env first

# Start Qdrant + MongoDB
docker-compose up -d

# Ingest texts
npm run ingest
# Watch for: "Ingested X chunks from ..."

# Restart server (Ctrl+C in Terminal #1, then:)
npm run server

# Test again
npm run test:api
# Expect: Real LLM responses + citations
```

## 6. Helpful Commands

```powershell
# Run unit tests only
npm test

# Run tests in watch mode (dev)
npm run test:watch

# Run acceptance test suite (requires server on :3000)
npm run test:api

# Start frontend (separate terminal)
cd frontend && npm install && npm run dev
# Opens http://localhost:5173

# Stop Docker services
docker-compose down

# View server logs (if running in background)
# (Logs appear in terminal #1)
```

## 7. Project Structure (One-liner)

```
server/     - Express backend, routes, ingest, tests
frontend/   - React/Vite app (scaffold)
data/       - Sample texts + persona JSON configs
scripts/    - Test runners
README.md   - Full docs
```

## 8. API Reference (Quick)

| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/api/conversations` | POST | `{}` | `{ conversationId: "uuid" }` |
| `/api/chat` | POST | `{ conversationId, persona, text, audio }` | `{ reply: { text, persona, referencedSources[], audioStatus, timestamp } }` |
| `/api/conversations/:id` | GET | - | `{ _id, messages[], createdAt }` |

## 9. Key Files

- **Backend entry:** `server/index.js`
- **Chat logic:** `server/routes/chat.js`
- **Tests:** `server/__tests__/`
- **Personas:** `data/personas/`
- **Env config:** `.env.example`

## 10. Demo vs. Production Mode

| Aspect | Demo (no keys) | Production |
|--------|---|---|
| Embeddings | Random vectors | OpenAI API |
| Chat | Mock response | LLM API |
| Vector DB | In-memory | Qdrant |
| DB | In-memory mock | MongoDB |
| Moderation | Skipped | OpenAI API |

## 11. Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Ensure Node 18+, `npm install` passed, no port 3000 conflict |
| Tests fail | Run `npm install` again; check Node version |
| MongoDB error | It's optional; demo mode uses in-memory fallback |
| No citations | Add `OPENAI_API_KEY`, run `npm run ingest`, restart server |
| Can't connect to API | Ensure server is running on :3000 |

---

**For detailed instructions, see `README.md`.**
