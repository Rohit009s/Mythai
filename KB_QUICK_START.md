# 🚀 Religious Texts Knowledge Base - Quick Reference

## TL;DR - Add Complete Books in 3 Steps

### Step 1️⃣ Download
```powershell
curl -o data/texts/eastern/bhagavad_gita_complete.txt `
  https://sacred-texts.com/hin/gita/gita.txt
```

### Step 2️⃣ Format
Add this at the **top** of your downloaded file:
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

### Step 3️⃣ Ingest
```bash
npm run ingest-enhanced
```

**Done!** Your AI now answers using Bhagavad Gita. 📖✨

---

## 🔗 One-Click Downloads

### Core Texts (Start Here)

| Text | Download | Size | Chunks |
|------|----------|------|--------|
| **Bhagavad Gita** | `curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt` | 700KB | 700 |
| **Bible (KJV)** | `curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt` | 4MB | 1200 |
| **Quran** | `curl https://archive.org/download/quran_en/quran_en_text.txt > data/texts/abrahamic/quran_complete.txt` | 3MB | 600 |
| **Upanishads** | `curl https://sacred-texts.com/hin/upan.txt > data/texts/eastern/upanishads_complete.txt` | 2MB | 400 |
| **Tao Te Ching** | `curl https://sacred-texts.com/tao/ttc.txt > data/texts/philosophy/tao_te_ching.txt` | 200KB | 80 |

### All Commands in One Block
```bash
mkdir -p data/texts/{eastern,abrahamic,philosophy,other}

curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt
curl https://archive.org/download/quran_en/quran_en_text.txt > data/texts/abrahamic/quran_complete.txt
curl https://sacred-texts.com/hin/upan.txt > data/texts/eastern/upanishads_complete.txt
curl https://sacred-texts.com/tao/ttc.txt > data/texts/philosophy/tao_te_ching.txt

npm run ingest-enhanced
```

---

## 🎯 Quick Tasks

### Add One Text
```bash
# Download
curl URL > data/texts/category/filename.txt

# Add metadata header to file (edit in VS Code)

# Ingest
npm run ingest-enhanced -- --category category
```

### Add Multiple Texts
```bash
# Download all

# Format all with metadata

# Ingest all
npm run ingest-enhanced
```

### Ingest Specific File
```bash
npm run ingest-enhanced -- --file data/texts/eastern/bhagavad_gita_complete.txt
```

### Test Chat
```powershell
$h = @{'Content-Type'='application/json'}
$body = @{
  conversationId = "test"
  persona = "krishna"
  text = "What is dharma?"
  audio = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/chat `
  -Method POST -Headers $h -Body $body
```

---

## 📊 Ingestion Status

### Texts Added
- [ ] Bhagavad Gita (700 verses, 700KB)
- [ ] Bible (KJV, 66 books, 4MB)
- [ ] Quran (114 chapters, 3MB)
- [ ] Upanishads (108 texts, 2MB)
- [ ] Mahabharata (full epic, 15MB)

### Progress
```
Total Chunks: 0/5900
Storage Used: 0 MB / 25 MB
Estimated Cost: $0 / $0.02
```

---

## 🧵 Extended Resources

| Document | Purpose |
|----------|---------|
| `KNOWLEDGE_BASE.md` | Full guide + philosophy |
| `DOWNLOAD_TEXTS.md` | All text URLs + batch scripts |
| `BOOKS_SETUP.md` | Detailed setup architecture |
| `server/ingest-enhanced.js` | Smart chunking code |
| `scripts/extract_pdf.js` | PDF extraction tool |

---

## 💡 Common Questions

**Q: Do I need all texts?**
A: No! Start with Bhagavad Gita (small, works great). Add others gradually.

**Q: How much does it cost?**
A: ~$0.02 for all core texts with text-embedding-3-small.

**Q: What if I have a PDF?**
A: Convert to .txt first (use online converters or pdftotext), then follow same steps.

**Q: Can I edit/update texts?**
A: Yes - modify the file and re-ingest. Current system ingests everything.

**Q: How do I know it's working?**
A: Chat will cite the sources! Look for "(Source: Bhagavad Gita 2.47)" in responses.

---

## ⚡ Next Steps

1. ✅ Download Bhagavad Gita (5 min)
2. ✅ Add metadata header (2 min)
3. ✅ Run `npm run ingest-enhanced` (5-10 min)
4. ✅ Test chat API (2 min)
5. 📖 Add more texts (repeat 1-4)

**Total time to first full sacred text integration: ~30 minutes!**

---

**Ready?** Grab the Gita and let's go! 🙏✨

```bash
curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
```
