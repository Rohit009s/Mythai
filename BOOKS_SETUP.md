# MythAI Religious Texts Knowledge Base Setup

## Overview
Build a comprehensive spiritual knowledge base with complete religious texts to train the AI for natural, humanized responses reflecting divine wisdom.

## Supported Religious Texts

### Priority 1 (Foundation)
1. **Bhagavad Gita** - Complete text (Sanskrit/English)
2. **Bible** - King James Version or New International Version
3. **Quran** - Complete with translations
4. **Mahabharata** - Full epic
5. **Ramayana** - Complete narrative
6. **Upanishads** - Major texts

### Priority 2 (Eastern Philosophy)
7. **Vedas** - Rigveda, Yajurveda, Samaveda, Atharvaveda
8. **Puranas** - Brahma Purana, Vishnu Purana, Shiva Purana, Bhagavata Purana
9. **Sutras** - Yoga Sutras, Buddhist Sutras
10. **Tao Te Ching** - Daodejing
11. **I Ching** - Book of Changes
12. **Buddhist Texts** - Tripitaka, Diamond Sutra, Lotus Sutra

### Priority 3 (Abrahamic & Others)
13. **Torah** - Jewish scriptures
14. **Hadith** - Islamic traditions
15. **Confucian Classics** - Analects, Mencius
16. **Shinto Texts** - Nihon Shoki, Kojiki
17. **Zoroastrian Texts** - Avesta

## File Organization

```
data/
├── texts/
│   ├── eastern/
│   │   ├── bhagavad_gita_complete.txt
│   │   ├── mahabharata_complete.txt
│   │   ├── ramayana_complete.txt
│   │   ├── upanishads_complete.txt
│   │   ├── vedas_complete.txt
│   │   ├── puranas_complete.txt
│   │   └── yoga_sutras.txt
│   ├── abrahamic/
│   │   ├── bible_kjv_complete.txt
│   │   ├── quran_complete.txt
│   │   ├── torah_complete.txt
│   │   └── hadith_collection.txt
│   ├── philosophy/
│   │   ├── tao_te_ching.txt
│   │   ├── i_ching.txt
│   │   ├── analects.txt
│   │   └── buddhist_sutras.txt
│   └── other/
│       ├── shinto_texts.txt
│       └── zoroastrian_texts.txt
└── books_metadata.json
```

## How to Add Books

### Option 1: Direct Text Files (.txt)
1. Convert PDF to text using:
   - **Recommended**: Python `pdfplumber` or `PyPDF2`
   - **Online**: https://pdf2go.com/pdf-to-txt
   - **CLI**: `pdftotext book.pdf book.txt`

2. Place in `data/texts/` with structure:
   ```
   Book Title: [Title]
   Translator/Source: [Author/Version]
   ---
   [Chapter/Section metadata]
   [Full text content]
   ```

### Option 2: Using Python Script (Automated)
```python
# Extract from PDF and chunk automatically
python scripts/extract_pdf.py --file bhagavad_gita.pdf --category eastern
```

### Option 3: Using Online APIs
```bash
# Download from open sources
curl https://archive.org/download/bhagavad_gita_complete/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
```

## Text Preprocessing

Each text file should follow this format:

```
METADATA
========
Title: Bhagavad Gita Complete
Category: Eastern Philosophy
Language: English
Translator: Swami Prabhupada
Source: Sacred Texts Archive
Total Verses: 700
---

CONTENT
=======

Chapter 1: Observing the Armies

Verse 1: Dhritarashtra said: O Sanjaya, after gathering on the holy field of Kurukshetra...
[Verse text]
Commentary: [Optional scholarly notes]

Verse 2: [Continue...]
```

## Database Schema Updates

### MongoDB Collection: `spiritual_texts`

```javascript
{
  _id: ObjectId,
  
  // Document metadata
  title: "Bhagavad Gita",
  category: "Eastern Philosophy",
  subcategory: "Hindu Scriptures",
  language: "English",
  translator: "Swami Prabhupada",
  source_url: "https://...",
  
  // Book structure
  book: "Bhagavad Gita",
  chapter: "1",
  verse_or_section: "1",
  section_title: "Observing the Armies",
  
  // Content
  text: "Long verse text...",
  original_text: "Sanskrit original (if available)",
  
  // Metadata for retrieval
  keywords: ["dharma", "duty", "action", "Krishna"],
  themes: ["ethics", "philosophy", "duty", "devotion"],
  
  // Vector embedding (for similarity search)
  embedding: [0.123, 0.456, ...],  // 1536-dimensional
  
  // Indexing
  full_text_search: "text representation for indexing",
  ingest_date: ISODate,
  last_updated: ISODate,
  
  // Cross-references
  related_verses: ["Bhagavad Gita 2.47", "Upanishads 3.12"],
  persona_relevance: {
    krishna: 0.95,
    shiva: 0.60,
    lakshmi: 0.50
  }
}
```

## Ingestion Pipeline

### Updated `server/ingest.js` Features

```javascript
// 1. Automatic directory traversal
fs.readdirSync('data/texts/').forEach(dir => {
  fs.readdirSync(`data/texts/${dir}`).forEach(file => {
    ingestBook(`data/texts/${dir}/${file}`, dir);
  });
});

// 2. Intelligent chunking by verse/chapter
const chunks = chunkByStructure(text, metadata);

// 3. Metadata extraction
const metadata = extractMetadata(text);

// 4. Embedding generation
const embedding = await embedText(chunk.text);

// 5. Qdrant upsert with metadata
await upsertWithMetadata(chunk, embedding, metadata);

// 6. MongoDB indexing
await indexInMongoDB(chunk, embedding, metadata);
```

### Enhanced Chunking Strategy

Instead of fixed 1200-char chunks, use semantic chunks:

```javascript
const chunkStrategies = {
  // Verse-based chunking (Vedas, Gita, Quran)
  'verse': (text) => text.split(/Verse \d+:|Ayah \d+:/),
  
  // Chapter-based chunking (Bible, Mahabharata)
  'chapter': (text) => text.split(/Chapter \d+:|Book \d+:/),
  
  // Section-based chunking (Tao Te Ching)
  'section': (text) => text.split(/Section \d+:|^#+/m),
  
  // Paragraph-based with overlap (General)
  'paragraph': (text) => chunkByParagraph(text, {
    size: 1500,
    overlap: 200,
    minChunkSize: 300
  })
};

// Auto-detect based on text structure
const strategy = detectChunkStrategy(text);
```

## Retrieval Enhancements

### 1. Hierarchical Search
When user asks about Krishna:
- Search across ALL texts for Krishna mentions
- Rank by relevance + persona match
- Return cross-referenced results

### 2. Semantic Search with Filtering
```javascript
POST /api/search
{
  query: "What is dharma?",
  categories: ["Eastern Philosophy"],
  texts: ["Bhagavad Gita", "Upanishads"],
  limit: 10
}
```

### 3. Cross-Text Citations
Link related concepts across religions:
- Dharma (Hindu) ↔ Torah (Jewish) ↔ Sharia (Islamic)
- Karma ↔ Cause and Effect (Universal)
- Nirvana ↔ Heaven ↔ Paradise

## API Enhancements

### New Endpoints

```javascript
// Get available texts
GET /api/texts
{
  texts: [
    { title: "Bhagavad Gita", category: "Eastern", verses: 700 },
    { title: "Bible", category: "Abrahamic", chapters: 66 }
  ]
}

// Search across texts
GET /api/search?query=dharma&limit=5
{
  results: [
    {
      text: "...",
      source: "Bhagavad Gita 2.47",
      relevance: 0.95,
      category: "Eastern Philosophy"
    }
  ]
}

// Get book chapter
GET /api/texts/bhagavad_gita/chapters/1
{
  chapter: 1,
  title: "Observing the Armies",
  verses: [...]
}

// Chat with text awareness
POST /api/chat
{
  conversationId: "...",
  persona: "krishna",
  text: "What is dharma?",
  audio: true,
  sources_filter: ["Bhagavad Gita"]  // Optional: limit to specific texts
}
```

## Training & Fine-tuning

### Persona Training Data

Each persona gets trained on relevant texts:

```javascript
{
  persona: "krishna",
  training_texts: [
    "Bhagavad Gita",
    "Harivamsha",
    "Mahabharata",
    "Krishna Upanishad"
  ],
  tone: "gentle, playful, wise",
  example_citations: [
    "Bhagavad Gita 2.47",
    "Bhagavad Gita 18.2"
  ],
  response_style: "Teach through questions and metaphors"
}
```

## Implementation Timeline

### Week 1: Foundation
- ✅ Setup text extraction pipeline
- ✅ Add 3 core texts (Gita, Bible, Quran)
- ✅ Test chunking and embedding

### Week 2: Expansion
- Add 5 more texts (Vedas, Mahabharata, Upanishads, etc.)
- Implement hierarchical search
- Update personas with text references

### Week 3: Refinement
- Fine-tune embeddings for religious concepts
- Add cross-text linking
- Optimize retrieval ranking

### Week 4: Production
- Performance testing with full dataset
- Caching layer for frequent queries
- Analytics dashboard

## Storage Requirements

**Estimated sizes:**
- Bhagavad Gita: ~2 MB
- Mahabharata: ~15 MB
- Bible (complete): ~5 MB
- Quran (complete): ~3 MB
- Vedas (complete): ~10 MB
- Puranas (6 major): ~50 MB
- Buddhist Texts: ~20 MB

**Total: ~150-200 MB text** → **~5-10 GB MongoDB** (with embeddings)

**Vector Database (Qdrant):**
- Each chunk embedding: 1536 dimensions × 4 bytes = 6.1 KB
- ~100K chunks × 6.1 KB = **600 MB**

## Getting Texts

### Free Open Sources
1. **Sacred Texts Archive** - https://sacred-texts.com
2. **Project Gutenberg** - https://www.gutenberg.org
3. **Internet Archive** - https://archive.org
4. **Google Books** (for preview/limited)
5. **OpenSource Religious Texts** - Various APIs

### Commands to Download

```bash
# Bhagavad Gita
curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt

# Bible (KJV)
curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt

# Quran
curl https://api.quran.com/api/v4/quran/en-sahih > data/texts/abrahamic/quran_complete.json

# Mahabharata
wget -O data/texts/eastern/mahabharata_complete.txt https://sacred-texts.com/hin/maha/maha.txt
```

## Quick Start: Add Bhagavad Gita Complete

1. **Download:**
   ```bash
   curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt
   ```

2. **Format metadata** at top of file

3. **Run ingest:**
   ```bash
   npm run ingest
   ```

4. **Verify in MongoDB:**
   ```javascript
   db.conversations.findOne({}) // Will show citations from complete Gita
   ```

## Next Steps
1. Choose which texts to add first
2. Download or provide PDF files
3. Run automated extraction
4. Test with chat API
5. Iterate and refine

---

**Ready to build the ultimate spiritual AI?** 🙏✨

Let me create the enhanced ingest script and PDF extraction tool...
