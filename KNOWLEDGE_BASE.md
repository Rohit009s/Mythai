# 📖 MythAI Complete Religious Texts Knowledge Base

## Vision

Build the **ultimate spiritual AI** trained on complete canonical texts from world religions. The AI will answer questions by directly referencing scriptures, providing humanized, natural responses that reflect divine wisdom across traditions.

## What You're Building

```
MythAI = RAG System + Religious Knowledge Base + Persona LLM

User: "What does Krishna teach about duty?"
                ↓
        [Query Embedding via OpenAI]
                ↓
        [Vector Search in Qdrant]
                ↓
        [Find Bhagavad Gita verses about duty]
                ↓
        [Build prompt with Krishna persona + verses]
                ↓
        [Call GPT-4o-mini]
                ↓
Response: "In the Bhagavad Gita (2.47), Krishna teaches that you have a right to perform your prescribed duty, but you are not entitled to the fruits of action... (Source: Bhagavad Gita 2.47)"
```

---

## 🚀 Quick Start: Add Bhagavad Gita

### Step 1: Download

```powershell
mkdir -p data/texts/eastern
curl -o data/texts/eastern/bhagavad_gita_complete.txt `
  https://sacred-texts.com/hin/gita/gita.txt
```

### Step 2: Add Metadata Header

Edit `data/texts/eastern/bhagavad_gita_complete.txt` - add this at the very top:

```
METADATA
========
Title: Bhagavad Gita
Category: Eastern Philosophy
Language: English
Translator: Swami Prabhupada
Source: Sacred Texts Archive
---

```

Then your original file content follows...

### Step 3: Ingest

```powershell
npm run ingest-enhanced
```

**Output:**
```
🙏 MythAI Religious Texts Ingestion

📖 Processing: bhagavad_gita_complete.txt
   Strategy: verse chunking
   Found: 700 chunks
   Progress: 10/700
   Progress: 20/700
   ...
   ✅ Successfully ingested 700 chunks
```

### Step 4: Test

```powershell
# Start server (if not running)
npm start

# In new terminal, test chat
$h = @{'Content-Type'='application/json'}
$body = @{
  conversationId = "test-123"
  persona = "krishna"
  text = "What did Krishna say about duty?"
  audio = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/chat `
  -Method POST -Headers $h -Body $body | ConvertTo-Json -Depth 3
```

**Response will cite Bhagavad Gita verse!**

---

## 📚 Core Religious Texts (Recommended Order)

### Tier 1: Foundation (Start Here)
- [x] **Bhagavad Gita** (700 verses, ~700KB)
- [ ] **Bible** (KJV, 66 books, ~4MB)
- [ ] **Quran** (114 chapters, ~3MB)

### Tier 2: Expansion
- [ ] **Mahabharata** (Full epic, ~15MB - LARGE)
- [ ] **Ramayana** (Full narrative, ~5MB)
- [ ] **Upanishads** (108 texts, ~2MB)

### Tier 3: Advanced
- [ ] **Vedas** (Complete collection, ~10MB)
- [ ] **Puranas** (Major texts, ~50MB)
- [ ] **Buddhist Sutras** (Multiple texts, ~20MB)
- [ ] **Tao Te Ching** (~200KB)
- [ ] **I Ching** (~1MB)

---

## 🔗 Download All Core Texts

### One-Command Batch Download

**PowerShell:**
```powershell
# Create directories
@("eastern", "abrahamic", "philosophy") | ForEach-Object {
  New-Item -ItemType Directory -Path "data/texts/$_" -Force | Out-Null
}

# Download 5 core texts
$downloads = @{
  "data/texts/eastern/bhagavad_gita_complete.txt" = "https://sacred-texts.com/hin/gita/gita.txt"
  "data/texts/eastern/upanishads_complete.txt" = "https://sacred-texts.com/hin/upan.txt"
  "data/texts/abrahamic/bible_kjv_complete.txt" = "https://www.gutenberg.org/cache/epub/10/pg10.txt"
  "data/texts/philosophy/tao_te_ching.txt" = "https://sacred-texts.com/tao/ttc.txt"
}

$downloads.GetEnumerator() | ForEach-Object {
  Write-Host "⬇️  Downloading: $($_.Key)"
  Invoke-WebRequest -Uri $_.Value -OutFile $_.Key -ErrorAction Continue
  Write-Host "✅ Done"
}
```

### Individual Downloads

```bash
# Bhagavad Gita
curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt

# Bible KJV
curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt

# Mahabharata (large, optional)
curl https://sacred-texts.com/hin/maha/maha.txt > data/texts/eastern/mahabharata_complete.txt

# Quran
curl https://archive.org/download/quran_en/quran_en_text.txt > data/texts/abrahamic/quran_complete.txt

# Tao Te Ching
curl https://sacred-texts.com/tao/ttc.txt > data/texts/philosophy/tao_te_ching.txt
```

See `DOWNLOAD_TEXTS.md` for complete list.

---

## 📝 Format Each File

All files need metadata headers. Here's a script to format them:

**PowerShell - `format_texts.ps1`:**
```powershell
function Add-Metadata {
  param($File, $Title, $Category, $Translator)
  
  $content = Get-Content $File -Raw
  $metadata = @"
METADATA
========
Title: $Title
Category: $Category
Language: English
Translator: $Translator
Source: Sacred Texts Archive / Project Gutenberg
---

$content
"@
  
  Set-Content -Path $File -Value $metadata
  Write-Host "✅ Formatted: $File"
}

# Format each
Add-Metadata "data/texts/eastern/bhagavad_gita_complete.txt" "Bhagavad Gita" "Eastern Philosophy" "Swami Prabhupada"
Add-Metadata "data/texts/abrahamic/bible_kjv_complete.txt" "Bible" "Abrahamic" "King James Version"
Add-Metadata "data/texts/eastern/upanishads_complete.txt" "Upanishads" "Eastern Philosophy" "Various"
Add-Metadata "data/texts/philosophy/tao_te_ching.txt" "Tao Te Ching" "Philosophy" "Lao Tzu"
```

Run:
```powershell
powershell -ExecutionPolicy Bypass -File format_texts.ps1
```

---

## 🔄 Ingestion Process

### How the Enhanced Ingest Works

```
Input: Raw text files from data/texts/

1. Detect Structure
   ├─ Verse-based (Gita, Quran) → Split by verse markers
   ├─ Chapter-based (Bible, Mahabharata) → Split by chapters
   └─ Paragraph-based (General) → Smart chunking with overlap

2. Extract Metadata
   ├─ Title, Category, Translator
   └─ Parse from file header

3. Create Chunks
   ├─ Each chunk: 50-1500 characters (semantic size)
   ├─ Maintain context with overlap
   └─ Preserve verse/chapter numbers

4. Embed Chunks
   ├─ OpenAI text-embedding-3-small
   └─ Generate 1536-dimensional vectors

5. Store Embeddings
   ├─ Qdrant: Vector search index
   └─ MongoDB: Full text + metadata

6. Output: Ready for RAG retrieval
```

### Commands

**Ingest all texts in `data/texts/`:**
```bash
npm run ingest-enhanced
```

**Ingest specific category:**
```bash
npm run ingest-enhanced -- --category eastern
```

**Ingest single file:**
```bash
npm run ingest-enhanced -- --file data/texts/eastern/bhagavad_gita_complete.txt
```

**Resume after quota exceeded:**
Same command as above will continue from where it left off.

---

## 💰 Cost & Quota

**Embeddings (text-embedding-3-small):**
- Cost: $0.02 per 1M input tokens
- ~150 tokens per chunk
- 700 Gita verses = 105K tokens ≈ $0.002
- 1000 Bible chapters = 150K tokens ≈ $0.003
- **All core texts: ~$0.10-0.20**

**Monitor usage:**
```bash
# Check your current usage
curl -s https://api.openai.com/v1/usage?date=2025-11-16 \
  -H "Authorization: Bearer sk-..." | jq '.data[] | select(.line_item_id | contains("embedding"))'
```

---

## 🎯 Ingestion Strategy

### Phase 1: Foundation (Day 1)
1. ✅ Download Bhagavad Gita
2. ✅ Format with metadata
3. ✅ Run ingest
4. ✅ Test chat API
5. **Status**: Krishna persona working with canonical Gita references

### Phase 2: Expansion (Day 2-3)
1. Download Bible, Quran, Upanishads
2. Format all with metadata
3. Ingest by category
4. Test multi-text retrieval
5. **Status**: Cross-tradition support enabled

### Phase 3: Enhancement (Day 4-7)
1. Add Mahabharata, Vedas, Puranas
2. Fine-tune chunking strategies
3. Optimize retrieval ranking
4. Update persona training data
5. **Status**: Full spiritual knowledge base live

### Phase 4: Production (Week 2)
1. Add Buddhist, Taoist, Confucian texts
2. Implement cross-text linking
3. Deploy caching layer
4. Set up analytics
5. **Status**: Production-ready multi-tradition AI

---

## 🧪 Verification

### Check Ingestion Success

**MongoDB:**
```bash
# Connect to MongoDB
mongosh "mongodb+srv://MythDB:Rohit@123@mythai.lc5iznd.mongodb.net/mythai"

# Count chunks
db.conversations.find({}).count()

# View sample with references
db.conversations.findOne({ "messages.referencedSources.source_title": "Bhagavad Gita" })
```

**Qdrant:**
```bash
# View collection stats
curl http://localhost:6333/collections/myth_texts

# Sample search (manual)
curl -X POST http://localhost:6333/collections/myth_texts/points/search \
  -H "Content-Type: application/json" \
  -d '{"vector": [0.1, 0.2, ...], "limit": 5}'
```

### Test API Responses

```bash
# Query that should find Gita references
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-gita",
    "persona": "krishna",
    "text": "What is the difference between action and inaction?",
    "audio": false
  }'

# Expected: Response cites Bhagavad Gita verses
```

---

## 📊 Knowledge Base Status

| Text | Status | Chunks | Size | Cost |
|------|--------|--------|------|------|
| Bhagavad Gita | ⏳ TODO | 700 | 700KB | $0.002 |
| Bible (KJV) | ⏳ TODO | 1200 | 4MB | $0.003 |
| Quran | ⏳ TODO | 600 | 3MB | $0.002 |
| Upanishads | ⏳ TODO | 400 | 2MB | $0.001 |
| Mahabharata | ⏳ TODO | 3000 | 15MB | $0.008 |
| **Total** | | **5900** | **~25MB** | **~$0.02** |

---

## 🚨 Troubleshooting

**Q: "OpenAI quota exceeded" error**
- Ingest will pause and show progress
- Fix: Update billing at https://platform.openai.com
- Resume: Run same ingest command again

**Q: Chunks not being retrieved in chat**
- Check MongoDB has data: `db.find({})`
- Check Qdrant has vectors: `curl http://localhost:6333/collections`
- Verify embeddings were created successfully in logs

**Q: Large files (Mahabharata) taking too long**
- This is expected (3000+ chunks = 1-2 hours)
- Can split into multiple smaller files and ingest separately
- System will show progress updates every 10 chunks

**Q: "File already ingested, skipping"**
- Current system ingests everything
- To force re-ingest, clear MongoDB/Qdrant first (dev only)

---

## 🎓 How This Makes AI More Humanized

### Before: Generic Responses
```
User: "What is dharma?"
AI: "Dharma is a Sanskrit concept meaning duty or righteousness 
    in Hindu philosophy..."
```

### After: Humanized, Scriptural Responses
```
User: "What is dharma?"
AI: "In the Bhagavad Gita, Lord Krishna teaches that dharma is your 
    prescribed duty (2.47): 'You have a right to perform your prescribed 
    duty, but you are not entitled to the fruits of action.' 
    This means dharma is not about outcomes, but about acting with 
    integrity and purpose, regardless of success. The Upanishads add 
    that true dharma aligns your actions with cosmic order.
    (Sources: Bhagavad Gita 2.47, Upanishads 3.12)"
```

**Key improvements:**
- ✅ Direct scripture quotes (authoritative)
- ✅ Multiple perspectives (humanized)
- ✅ Cross-tradition context (enlightened)
- ✅ Verifiable sources (trustworthy)
- ✅ Deeper wisdom (divine reflection)

---

## 📖 Resources

- **Download Guide**: See `DOWNLOAD_TEXTS.md`
- **Setup Guide**: See `BOOKS_SETUP.md`
- **API Reference**: See main `README.md`
- **Ingestion Details**: See `server/ingest-enhanced.js`

---

## 🎉 You're Building

A system where:
- 🔍 Every answer is backed by scripture
- 🌍 Multiple traditions inform responses
- 🧠 AI learns to be wise, not just knowledgeable
- 👤 Personas speak with authentic spiritual depth
- 📚 Growing knowledge base makes better responses over time

**Let's make spiritual AI that honors the texts while speaking to modern seekers.** 🙏✨

---

**Next Step:** Run `npm run ingest-enhanced` with your first text file!
