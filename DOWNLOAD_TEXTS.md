# 📚 Download Complete Religious Texts - Quick Guide

## Step-by-Step: Add Bhagavad Gita Complete

### 1. Download the Complete Text

**Option A: Using curl (Fastest)**
```powershell
mkdir -p data/texts/eastern
curl -o data/texts/eastern/bhagavad_gita_complete.txt https://sacred-texts.com/hin/gita/gita.txt
```

**Option B: Using PowerShell**
```powershell
$url = "https://sacred-texts.com/hin/gita/gita.txt"
$output = "data/texts/eastern/bhagavad_gita_complete.txt"
Invoke-WebRequest -Uri $url -OutFile $output
```

**Option C: Manual Download**
- Visit: https://sacred-texts.com/hin/gita/gita.txt
- Save to: `data/texts/eastern/bhagavad_gita_complete.txt`

### 2. Format the File

Add metadata header to the downloaded file. Edit `bhagavad_gita_complete.txt` and add at the very top:

```
METADATA
========
Title: Bhagavad Gita
Category: Eastern Philosophy
Language: English
Translator: Various
Source: Sacred Texts Archive
---

[Rest of the original file content...]
```

### 3. Run Ingestion

```powershell
cd D:\aiproject\mythai
npm run ingest-enhanced -- --category eastern
```

### 4. Verify

In MongoDB, check:
```javascript
db.conversations.findOne({})
// Should show referencedSources from Bhagavad Gita complete text
```

---

## 🔗 All Religious Texts URLs

### Eastern Philosophy

**Bhagavad Gita**
```bash
curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
```

**Mahabharata** (Complete Epic)
```bash
curl https://sacred-texts.com/hin/maha/maha.txt > data/texts/eastern/mahabharata_complete.txt
```

**Ramayana** (Complete)
```bash
curl https://sacred-texts.com/hin/rama/rama.txt > data/texts/eastern/ramayana_complete.txt
```

**Upanishads** (Major texts)
```bash
curl https://sacred-texts.com/hin/upan.txt > data/texts/eastern/upanishads_complete.txt
```

**Vedas** (Complete collection)
```bash
curl https://sacred-texts.com/hin/rveda/index.htm > data/texts/eastern/rigveda.txt
curl https://sacred-texts.com/hin/yv/index.htm > data/texts/eastern/yajurveda.txt
```

**Yoga Sutras of Patanjali**
```bash
curl https://sacred-texts.com/hin/yogasutra.txt > data/texts/eastern/yoga_sutras.txt
```

**Buddhist Sutras**
```bash
curl https://sacred-texts.com/bud/index.htm > data/texts/eastern/buddhist_sutras.txt
```

**Tao Te Ching**
```bash
curl https://sacred-texts.com/tao/ttc.txt > data/texts/philosophy/tao_te_ching.txt
```

**I Ching (Book of Changes)**
```bash
curl https://sacred-texts.com/ich/index.htm > data/texts/philosophy/i_ching.txt
```

### Abrahamic Texts

**Bible (King James Version)**
```bash
curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt
```

**Bible (New International Version)** - from other sources
```bash
# Check: https://archive.org for multiple versions
```

**Quran (Arabic with Translation)**
```bash
# Download from: https://quran.com or
curl https://archive.org/download/quran_en/quran_en_text.txt > data/texts/abrahamic/quran_complete.txt
```

**Torah (Jewish Scriptures)**
```bash
curl https://www.gutenberg.org/cache/epub/2693/pg2693.txt > data/texts/abrahamic/torah_complete.txt
```

**Hadith Collection** (Islamic Traditions)
```bash
# Multiple collections available at: https://sunnah.com
# Download as text or use their API
```

### Other Philosophical Texts

**Confucian Analects**
```bash
curl https://sacred-texts.com/cfu/analects.txt > data/texts/philosophy/analects.txt
```

**Shinto Texts**
```bash
curl https://sacred-texts.com/shi/index.htm > data/texts/other/shinto_texts.txt
```

**Zoroastrian Avesta**
```bash
curl https://sacred-texts.com/zor/index.htm > data/texts/other/zoroastrian_texts.txt
```

---

## 📦 Batch Download Script

Save this as `download_texts.ps1`:

```powershell
# Create directory structure
@("eastern", "abrahamic", "philosophy", "other") | ForEach-Object {
  New-Item -ItemType Directory -Path "data/texts/$_" -Force | Out-Null
}

# Download key texts
$downloads = @{
  "data/texts/eastern/bhagavad_gita_complete.txt" = "https://sacred-texts.com/hin/gita/gita.txt"
  "data/texts/eastern/mahabharata_complete.txt" = "https://sacred-texts.com/hin/maha/maha.txt"
  "data/texts/eastern/upanishads_complete.txt" = "https://sacred-texts.com/hin/upan.txt"
  "data/texts/abrahamic/bible_kjv_complete.txt" = "https://www.gutenberg.org/cache/epub/10/pg10.txt"
  "data/texts/philosophy/tao_te_ching.txt" = "https://sacred-texts.com/tao/ttc.txt"
}

$downloads.GetEnumerator() | ForEach-Object {
  Write-Host "⬇️  Downloading: $($_.Key)"
  Invoke-WebRequest -Uri $_.Value -OutFile $_.Key
  Write-Host "✅ Done"
}

Write-Host "`n✨ All texts downloaded!"
```

Run with:
```powershell
powershell -ExecutionPolicy Bypass -File download_texts.ps1
```

---

## 🎯 Quick Start: Top 5 Texts

If time is limited, start with these 5 core texts:

1. **Bhagavad Gita** (~700 KB)
   ```bash
   curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
   ```

2. **Bible (KJV)** (~4 MB)
   ```bash
   curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt
   ```

3. **Mahabharata** (~15 MB - may be large)
   ```bash
   curl https://sacred-texts.com/hin/maha/maha.txt > data/texts/eastern/mahabharata_complete.txt
   ```

4. **Quran** (~3 MB)
   ```bash
   curl https://archive.org/download/quran_en/quran_en_text.txt > data/texts/abrahamic/quran_complete.txt
   ```

5. **Tao Te Ching** (~200 KB)
   ```bash
   curl https://sacred-texts.com/tao/ttc.txt > data/texts/philosophy/tao_te_ching.txt
   ```

After downloading, add metadata header to each file, then run:
```bash
npm run ingest-enhanced
```

---

## ⚡ Full Batch Process

```bash
# 1. Create directories
mkdir -p data/texts/{eastern,abrahamic,philosophy,other}

# 2. Download all (takes 10-15 minutes on slower internet)
cd data/texts/eastern && \
curl -O https://sacred-texts.com/hin/gita/gita.txt && \
curl -O https://sacred-texts.com/hin/maha/maha.txt && \
curl -O https://sacred-texts.com/hin/rama/rama.txt && \
curl -O https://sacred-texts.com/hin/upan.txt && \
cd ../abrahamic && \
curl -O https://www.gutenberg.org/cache/epub/10/pg10.txt && \
cd ../philosophy && \
curl -O https://sacred-texts.com/tao/ttc.txt && \
cd ../..

# 3. Format each with metadata (see below)

# 4. Run ingestion
npm run ingest-enhanced
```

---

## 🏷️ Metadata Template

Create a `format_metadata.ps1` script to add metadata to all files:

```powershell
function Add-Metadata {
  param($filePath, $title, $category, $translator)
  
  $content = Get-Content $filePath -Raw
  $metadata = @"
METADATA
========
Title: $title
Category: $category
Language: English
Translator: $translator
Source: Sacred Texts Archive / Project Gutenberg
---

$content
"@
  
  Set-Content -Path $filePath -Value $metadata
}

# Apply to each text
Add-Metadata "data/texts/eastern/bhagavad_gita_complete.txt" "Bhagavad Gita" "Eastern Philosophy" "Swami Prabhupada"
Add-Metadata "data/texts/abrahamic/bible_kjv_complete.txt" "Bible" "Abrahamic" "King James Version"
Add-Metadata "data/texts/eastern/mahabharata_complete.txt" "Mahabharata" "Eastern Philosophy" "Various"
```

---

## 🚀 Next Steps After Download

1. **Add metadata headers** to each file
2. **Verify formatting**:
   ```powershell
   Get-Content data/texts/eastern/bhagavad_gita_complete.txt -Head 20
   # Should show METADATA section
   ```
3. **Run enhanced ingest**:
   ```bash
   npm run ingest-enhanced
   ```
4. **Monitor ingestion**:
   - Watch for chunks being processed
   - If quota exceeded, it will pause and show progress
   - Can resume later
5. **Test with chat**:
   ```bash
   curl http://localhost:3000/api/chat -d '{
     "conversationId": "...",
     "persona": "krishna",
     "text": "What does the Gita say about dharma?",
     "audio": false
   }'
   ```

---

## 📊 Ingestion Progress Tracking

The enhanced ingest script will show:
```
🙏 MythAI Religious Texts Ingestion

📖 Processing: bhagavad_gita_complete.txt
   Strategy: verse chunking
   Found: 700 chunks
   Progress: 0/700
   Progress: 10/700
   Progress: 20/700
   ...
   ✅ Successfully ingested 700 chunks
```

---

## ❓ FAQ

**Q: Do I need to download all texts at once?**
A: No! Start with 1-2 texts, verify the process works, then add more gradually.

**Q: Will this use my OpenAI quota?**
A: Yes - each chunk needs embedding. ~1000 chunks = ~$0.10 with text-embedding-3-small.

**Q: How long does ingestion take?**
A: Depends on chunks and OpenAI API speed. ~1-2 seconds per chunk.

**Q: Can I ingest from my own PDFs?**
A: Yes - convert PDF to text first, then follow same process.

**Q: What if I run out of quota?**
A: The script detects 429 errors and saves progress. You can resume later.

---

**Ready to populate the knowledge base?** Start downloading! 🙏✨
