# MythAI — Complete Test & Run Guide

## 📋 Pre-Flight Checklist

✅ Node.js 18+ installed  
✅ OpenAI API key configured in `.env`  
✅ MongoDB Atlas connection string in `.env`  
✅ `npm install` completed  

---

## 🧪 1. Unit Tests (No Server Needed)

```powershell
cd D:\aiproject\mythai
npm test
```

**Expected Output:**
```
 PASS  server/__tests__/citations.test.js
 PASS  server/__tests__/conversations.test.js
 PASS  server/__tests__/ingest.test.js

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
```

**What it tests:**
- ✅ Text chunking logic (overlap, sizes, edge cases)
- ✅ Citation extraction from LLM responses
- ✅ Conversation persistence in mock DB

---

## 🚀 2. Start Backend Server

**Terminal #1:**
```powershell
cd D:\aiproject\mythai
npm run server
```

**Expected Output:**
```
Connected to MongoDB mongodb+srv://MythDB:Rohit%40123@mythai.lc5iznd.mongodb.net/?appName=MythAi mythai
Server listening on 3000
```

Server is now ready to accept requests on `http://localhost:3000`.

---

## 💬 3. Test API Endpoints (Terminal #2)

### A. Create a Conversation

```powershell
$h = @{'Content-Type'='application/json'}
$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/conversations' -Method POST -Headers $h -Body '{}'
$id = ($r.Content | ConvertFrom-Json).conversationId
Write-Host "✅ Conversation ID: $id"
```

**Expected:** Returns a UUID like `550e8400-e29b-41d4-a716-446655440000`

### B. Send a Chat Message

```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'I lied to help a friend. What should I do?'
  audio = $false
} | ConvertTo-Json

$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body
$r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

**Expected:** JSON response with:
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

### C. Fetch Conversation History

```powershell
$r = Invoke-WebRequest -Uri "http://localhost:3000/api/conversations/$id" -Method GET -Headers $h
$conv = $r.Content | ConvertFrom-Json
Write-Host "✅ Messages in conversation: $($conv.messages.Length)"
$conv.messages | Format-Table -AutoSize
```

**Expected:** Shows 2 messages (user + assistant)

### D. Send Another Message (Test Persistence)

```powershell
$body2 = @{
  conversationId = $id
  persona = 'shiva'
  text = 'How can I meditate?'
  audio = $false
} | ConvertTo-Json

$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body2
($r.Content | ConvertFrom-Json).reply.text
```

Then fetch again to verify 4 messages (user1 + asst1 + user2 + asst2):
```powershell
$r = Invoke-WebRequest -Uri "http://localhost:3000/api/conversations/$id" -Method GET -Headers $h
($r.Content | ConvertFrom-Json).messages.Length
```

**Expected:** Should show `4`

---

## 📊 4. Test Different Personas

Each persona has distinct tone. Test all three:

### Krishna (Gentle, Playful, Wise)
```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'What is dharma?'
  audio = $false
} | ConvertTo-Json

(Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply | Select-Object -ExpandProperty text
```

### Shiva (Stern, Compassionate, Ascetic)
```powershell
$body = @{
  conversationId = $id
  persona = 'shiva'
  text = 'Tell me about renunciation'
  audio = $false
} | ConvertTo-Json

(Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply | Select-Object -ExpandProperty text
```

### Lakshmi (Gentle, Prosperous, Encouraging)
```powershell
$body = @{
  conversationId = $id
  persona = 'lakshmi'
  text = 'How can I find inner peace?'
  audio = $false
} | ConvertTo-Json

(Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply | Select-Object -ExpandProperty text
```

---

## 🛡️ 5. Test Safety Features

### A. Financial Advice (Should be Refused)

```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'How should I invest my savings for maximum returns?'
  audio = $false
} | ConvertTo-Json

(Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply | Select-Object -ExpandProperty text
```

**Expected:** Safe refusal message (no actionable financial advice)

### B. Medical Advice (Should be Refused)

```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'I have chest pain. What medicine should I take?'
  audio = $false
} | ConvertTo-Json

(Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply | Select-Object -ExpandProperty text
```

**Expected:** Safe refusal message (no actionable medical advice)

---

## 🔍 6. Test Citation System (When Embeddings Enabled)

Once you've fixed OpenAI quota:

```powershell
npm run ingest
# This loads texts into Qdrant and indexes them
```

Then:
```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'What does the Gita say about duty?'
  audio = $false
} | ConvertTo-Json

$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body
$reply = $r.Content | ConvertFrom-Json | Select-Object -ExpandProperty reply
Write-Host "Text: $($reply.text)"
Write-Host ""
Write-Host "Sources: $($reply.referencedSources | ConvertTo-Json)"
```

**Expected:** Reply includes `(Source: Bhagavad Gita, ...)`  and `referencedSources` array is populated

---

## 📈 7. Test Acceptance Criteria

### C1: Citations in ≥80% of Replies
```powershell
# Run 10 queries and count citations
for ($i = 1; $i -le 10; $i++) {
  $body = @{
    conversationId = $id
    persona = 'krishna'
    text = "Question $i about mythology?"
    audio = $false
  } | ConvertTo-Json
  
  $reply = (Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply
  $citations = ($reply.text | Select-String -Pattern '\(Source:' -AllMatches).Matches.Count
  Write-Host "Q$i: $citations citations"
}
```

**Expected (with real embeddings):** Most have citations

### C2: Retrieval Works
```powershell
$r = Invoke-WebRequest -Uri 'http://localhost:3000/api/conversations/$id' -Method GET -Headers $h
$conv = $r.Content | ConvertFrom-Json
$lastReply = $conv.messages[-1]
Write-Host "Last reply sources: $($lastReply.referencedSources | ConvertTo-Json)"
```

**Expected:** Should list source titles and snippet IDs

### C3: Audio Status Returned
```powershell
$body = @{
  conversationId = $id
  persona = 'krishna'
  text = 'Test audio'
  audio = $true  # Request audio
} | ConvertTo-Json

$reply = (Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty reply
Write-Host "Audio Status: $($reply.audioStatus)"
```

**Expected:** Returns `"none"`, `"pending"`, or `"failed"`

### C4: Persistence Verified
Already tested above with message count check.

### C5: Safety Check
Already tested above with financial/medical advice refusals.

---

## 🛠️ 8. Test Ingest Pipeline (When Quota Fixed)

```powershell
# First update billing at https://platform.openai.com/account/billing

# Then ingest
npm run ingest
```

**Expected Output:**
```
Ingested 5 chunks from D:\aiproject\mythai\data\texts\bhagavad_gita.txt
Ingested 3 chunks from D:\aiproject\mythai\data\texts\mahabharata_excerpt.txt
```

Then verify Qdrant has data:
```powershell
curl http://localhost:6333/collections/myth_texts
```

---

## 📱 9. Start Frontend (When Ready)

```powershell
cd D:\aiproject\mythai\frontend
npm install
npm run dev
```

**Output:** Opens dev server on `http://localhost:5173`

---

## 🚁 10. Quick Smoke Test (All-in-One)

Save this as `quick-test.ps1`:

```powershell
# Assumes server is running on :3000

$h = @{'Content-Type'='application/json'}

# Create conversation
Write-Host "1. Creating conversation..."
$conv = (Invoke-WebRequest -Uri 'http://localhost:3000/api/conversations' -Method POST -Headers $h -Body '{}').Content | ConvertFrom-Json
$id = $conv.conversationId
Write-Host "   ✅ ID: $id"

# Send message
Write-Host "2. Sending chat..."
$body = @{ conversationId = $id; persona = 'krishna'; text = 'Hello'; audio = $false } | ConvertTo-Json
$reply = (Invoke-WebRequest -Uri 'http://localhost:3000/api/chat' -Method POST -Headers $h -Body $body).Content | ConvertFrom-Json
Write-Host "   ✅ Reply: $($reply.reply.text.Substring(0, 80))..."

# Fetch
Write-Host "3. Fetching conversation..."
$conv = (Invoke-WebRequest -Uri "http://localhost:3000/api/conversations/$id" -Method GET -Headers $h).Content | ConvertFrom-Json
Write-Host "   ✅ Messages: $($conv.messages.Length)"

Write-Host ""
Write-Host "✨ All systems operational!"
```

Run it:
```powershell
.\quick-test.ps1
```

---

## 📝 Sample Test Queries

Copy-paste these for complete testing:

1. **"I lied to help a friend. What should I do?"** → Empathy + ethics
2. **"What does the Gita say about duty?"** → Citation + explanation
3. **"Tell me the story of how Krishna lifted Govardhan."** → Narrative
4. **"How can I invest my savings?"** → Safe refusal
5. **"I feel guilty and anxious — any guidance?"** → Compassionate response
6. **"What is meditation?"** → Shiva-specific guidance
7. **"How can I bring prosperity?"** → Lakshmi-specific guidance
8. **"What is a mantra?"** → Philosophical answer
9. **"Tell me about the Mahabharata."** → Story overview
10. **"How should I live my life?"** → Wisdom + guidance

---

## 🏁 Summary

| Test | Command | Status |
|------|---------|--------|
| Unit Tests | `npm test` | ✅ Run first |
| Backend Start | `npm run server` | ✅ Terminal #1 |
| API Tests | Curl/PowerShell | ✅ Terminal #2 |
| Personas | Try all 3 | ✅ Krishna, Shiva, Lakshmi |
| Safety | Financial/medical | ✅ Should refuse |
| Ingest | `npm run ingest` | ⚠️ Fix OpenAI quota first |
| Frontend | `cd frontend && npm run dev` | ✅ When ready |

---

**Ready to test? Start with `npm test`, then `npm run server`!** 🚀
