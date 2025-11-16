# 🚀 MythAI Command Reference - Add Religious Texts

## All Commands in One Place

### Step 1: Download a Text
```bash
# Download Bhagavad Gita
curl -o data/texts/eastern/bhagavad_gita_complete.txt https://sacred-texts.com/hin/gita/gita.txt

# Download Bible (KJV)
curl -o data/texts/abrahamic/bible_kjv_complete.txt https://www.gutenberg.org/cache/epub/10/pg10.txt

# Download Quran
curl -o data/texts/abrahamic/quran_complete.txt https://archive.org/download/quran_en/quran_en_text.txt

# Download Upanishads
curl -o data/texts/eastern/upanishads_complete.txt https://sacred-texts.com/hin/upan.txt

# Download Tao Te Ching
curl -o data/texts/philosophy/tao_te_ching.txt https://sacred-texts.com/tao/ttc.txt

# Download Mahabharata (LARGE - ~15MB)
curl -o data/texts/eastern/mahabharata_complete.txt https://sacred-texts.com/hin/maha/maha.txt

# Download Ramayana
curl -o data/texts/eastern/ramayana_complete.txt https://sacred-texts.com/hin/rama/rama.txt
```

### Step 2: Create Directory
```bash
mkdir -p data/texts/{eastern,abrahamic,philosophy,other}
```

### Step 3: Format Files
Edit each downloaded file and add this at the **VERY TOP**:

```
METADATA
========
Title: [Book Name]
Category: [Category]
Language: English
Translator: [Translator Name]
Source: Sacred Texts Archive
---
```

**Examples:**

For Bhagavad Gita:
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

For Bible:
```
METADATA
========
Title: Bible
Category: Abrahamic
Language: English
Translator: King James Version
Source: Project Gutenberg
---
```

### Step 4: Ingest (Main Command)

**All texts:**
```bash
npm run ingest-enhanced
```

**Specific category:**
```bash
npm run ingest-enhanced -- --category eastern
npm run ingest-enhanced -- --category abrahamic
npm run ingest-enhanced -- --category philosophy
```

**Single file:**
```bash
npm run ingest-enhanced -- --file data/texts/eastern/bhagavad_gita_complete.txt
```

**Resume after quota exceeded:**
```bash
npm run ingest-enhanced  # Just rerun same command
```

### Step 5: Test (Verify It Works)

**Start backend:**
```bash
npm start
```

**In new terminal, test chat:**
```powershell
$h = @{'Content-Type'='application/json'}

# Test 1: Krishna persona with Gita question
$body = @{
  conversationId = "test-123"
  persona = "krishna"
  text = "What did Krishna teach about duty and action?"
  audio = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/chat `
  -Method POST -Headers $h -Body $body
```

**Expected Response:**
```
Your question relates to the Bhagavad Gita, particularly 
verse 2.47 where Krishna teaches: "You have a right to 
perform your prescribed duty, but you are not entitled to 
the fruits of action..." (Source: Bhagavad Gita 2.47)
```

---

## 🎯 Complete Workflow (One Command Per Line)

```bash
# Setup
mkdir -p data/texts/{eastern,abrahamic,philosophy,other}

# Download core texts (copy-paste as one block)
curl -o data/texts/eastern/bhagavad_gita_complete.txt https://sacred-texts.com/hin/gita/gita.txt
curl -o data/texts/abrahamic/bible_kjv_complete.txt https://www.gutenberg.org/cache/epub/10/pg10.txt
curl -o data/texts/abrahamic/quran_complete.txt https://archive.org/download/quran_en/quran_en_text.txt
curl -o data/texts/eastern/upanishads_complete.txt https://sacred-texts.com/hin/upan.txt
curl -o data/texts/philosophy/tao_te_ching.txt https://sacred-texts.com/tao/ttc.txt

# Now open each file in editor and add metadata header at top...

# Ingest all
npm run ingest-enhanced

# Test
npm start
# Then in another terminal:
# Use PowerShell test commands above
```

---

## 📊 Batch Download Script (PowerShell)

Save as `download_and_format.ps1`:

```powershell
# Create directories
@("eastern", "abrahamic", "philosophy", "other") | ForEach-Object {
  New-Item -ItemType Directory -Path "data/texts/$_" -Force | Out-Null
}

# Download files
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

Write-Host "`n✨ All texts downloaded! Now add metadata headers and run: npm run ingest-enhanced"
```

Run:
```powershell
powershell -ExecutionPolicy Bypass -File download_and_format.ps1
```

---

## 📋 Metadata Template Reference

### For Gita
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

### For Bible
```
METADATA
========
Title: Bible
Category: Abrahamic
Language: English
Translator: King James Version
Source: Project Gutenberg
---
```

### For Quran
```
METADATA
========
Title: Quran
Category: Abrahamic
Language: English
Translator: Multiple
Source: Archive.org
---
```

### For Upanishads
```
METADATA
========
Title: Upanishads
Category: Eastern Philosophy
Language: English
Translator: Various
Source: Sacred Texts Archive
---
```

### For Any Custom Text
```
METADATA
========
Title: [Name]
Category: [eastern|abrahamic|philosophy|other]
Language: English
Translator: [Name]
Source: [Where You Got It]
---
```

---

## 🔄 Ingest Command Variations

| Use Case | Command |
|----------|---------|
| First time | `npm run ingest-enhanced` |
| Add one file | `npm run ingest-enhanced -- --file data/texts/eastern/gita.txt` |
| Add category | `npm run ingest-enhanced -- --category eastern` |
| Resume after error | `npm run ingest-enhanced` (same command) |
| All texts | `npm run ingest-enhanced` |
| Check available | `npm run ingest-enhanced -- --list` |

---

## ✅ Verification

**Check MongoDB has data:**
```bash
mongosh "mongodb+srv://MythDB:Rohit%40123@mythai.lc5iznd.mongodb.net/mythai"
> db.conversations.find({}).count()
# Should show > 0
```

**Check Qdrant has vectors:**
```bash
curl http://localhost:6333/collections/myth_texts
# Should show collection with points
```

**Test API:**
```bash
curl http://localhost:3000/api/chat -d '{...}'
# Should return citations
```

---

## 🎓 Complete Text URLs

**Eastern:**
- Bhagavad Gita: `https://sacred-texts.com/hin/gita/gita.txt`
- Mahabharata: `https://sacred-texts.com/hin/maha/maha.txt`
- Ramayana: `https://sacred-texts.com/hin/rama/rama.txt`
- Upanishads: `https://sacred-texts.com/hin/upan.txt`
- Vedas: `https://sacred-texts.com/hin/rveda/index.htm`

**Abrahamic:**
- Bible KJV: `https://www.gutenberg.org/cache/epub/10/pg10.txt`
- Quran: `https://archive.org/download/quran_en/quran_en_text.txt`
- Torah: `https://www.gutenberg.org/cache/epub/2693/pg2693.txt`

**Philosophy:**
- Tao Te Ching: `https://sacred-texts.com/tao/ttc.txt`
- I Ching: `https://sacred-texts.com/ich/index.htm`
- Analects: `https://sacred-texts.com/cfu/analects.txt`

See `DOWNLOAD_TEXTS.md` for complete list.

---

## 🚀 30-Minute Quick Start

```bash
# 1. Download (2 min)
curl -o data/texts/eastern/bhagavad_gita_complete.txt https://sacred-texts.com/hin/gita/gita.txt

# 2. Format (5 min)
# Open file in editor, add metadata header at top

# 3. Ingest (10-15 min)
npm run ingest-enhanced

# 4. Start server (1 min)
npm start

# 5. Test (5 min)
# Use PowerShell test command above
```

**Result: Your AI can now cite Bhagavad Gita!** ✨

---

## 📞 Need Help?

- **Quick Start**: See `KB_QUICK_START.md`
- **Full Guide**: See `KNOWLEDGE_BASE.md`
- **Download Links**: See `DOWNLOAD_TEXTS.md`
- **All Docs**: See `KB_SUMMARY.md`

---

## 🎉 You're All Set!

Go download those texts and build the ultimate spiritual AI! 🙏✨

Start with:
```bash
curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
```
