#!/usr/bin/env node
/**
 * Enhanced Ingest Script for Complete Religious Texts
 * Supports: Verse-based, Chapter-based, and Paragraph-based chunking
 * 
 * Usage:
 *   npm run ingest
 *   npm run ingest -- --category eastern
 *   npm run ingest -- --file data/texts/eastern/bhagavad_gita_complete.txt
 */

const fs = require('fs');
const path = require('path');
const { embedText } = require('./lib/openaiClient');
const { upsertPoints } = require('./lib/qdrantClient');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

// Configuration
const CHUNK_SIZE_CHARS = parseInt(process.env.CHUNK_SIZE_CHARS || '1200', 10);
const CHUNK_OVERLAP_CHARS = parseInt(process.env.CHUNK_OVERLAP_CHARS || '150', 10);
const TEXTS_DIR = path.resolve(__dirname, '..', 'data', 'texts');

/**
 * Extract metadata from file header
 * Expected format:
 * METADATA
 * ========
 * Title: Book Title
 * Category: Category
 * Translator: Name
 * ...
 * ---
 */
function extractMetadata(fileContent) {
  const metadataMatch = fileContent.match(/METADATA\s*\n=+\n([\s\S]*?)\n---/);
  if (!metadataMatch) {
    return {
      title: 'Unknown',
      category: 'general',
      translator: 'Unknown',
      language: 'English',
    };
  }

  const lines = metadataMatch[1].split('\n');
  const metadata = {};
  lines.forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      metadata[key.toLowerCase()] = value;
    }
  });

  return metadata;
}

/**
 * Detect chunking strategy based on text structure
 */
function detectChunkStrategy(text) {
  if (text.includes('Verse ') || text.match(/Ayah \d+:/)) {
    return 'verse';
  }
  if (text.includes('Chapter ') || text.includes('Book ')) {
    return 'chapter';
  }
  if (text.match(/^#+\s/m)) {
    return 'section';
  }
  return 'paragraph';
}

/**
 * Chunk text by verses (Bhagavad Gita, Quran, etc.)
 */
function chunkByVerse(text) {
  const chunks = [];
  
  // Split by verse markers
  const versePattern = /(?:Verse|Ayah)\s+(\d+):|^(\d+)\.\s+/gm;
  let currentVerse = '';
  let lastIndex = 0;
  let match;

  while ((match = versePattern.exec(text)) !== null) {
    if (lastIndex > 0) {
      const verseText = text.substring(lastIndex, match.index).trim();
      if (verseText.length > 50) {
        chunks.push({
          text: verseText,
          verse: match[1] || match[2],
          type: 'verse'
        });
      }
    }
    lastIndex = match.index;
  }

  // Add last verse
  const lastVerse = text.substring(lastIndex).trim();
  if (lastVerse.length > 50) {
    chunks.push({
      text: lastVerse,
      type: 'verse'
    });
  }

  return chunks;
}

/**
 * Chunk text by chapters
 */
function chunkByChapter(text) {
  const chunks = [];
  
  const chapterPattern = /(?:Chapter|Book)\s+(\d+):|^#+\s+(.+)$/gm;
  let currentChapter = '';
  let lastIndex = 0;
  let match;

  while ((match = chapterPattern.exec(text)) !== null) {
    if (lastIndex > 0) {
      const chapterText = text.substring(lastIndex, match.index).trim();
      if (chapterText.length > 100) {
        chunks.push({
          text: chapterText,
          chapter: match[1] || match[2],
          type: 'chapter'
        });
      }
    }
    lastIndex = match.index;
  }

  const lastChapter = text.substring(lastIndex).trim();
  if (lastChapter.length > 100) {
    chunks.push({
      text: lastChapter,
      type: 'chapter'
    });
  }

  return chunks;
}

/**
 * Chunk text by paragraphs with overlap
 */
function chunkByParagraph(text, options = {}) {
  const size = options.size || CHUNK_SIZE_CHARS;
  const overlap = options.overlap || CHUNK_OVERLAP_CHARS;
  const minSize = options.minSize || 300;

  const chunks = [];
  let i = 0;

  while (i < text.length) {
    let end = Math.min(i + size, text.length);
    
    // Extend to sentence boundary
    while (end < text.length && text[end] !== '.') {
      end++;
    }
    if (end < text.length) end++; // Include the period

    const chunk = text.substring(i, end).trim();
    
    if (chunk.length >= minSize) {
      chunks.push({
        text: chunk,
        type: 'paragraph'
      });
    }

    const nextStart = i + (size - overlap);
    i = Math.max(nextStart, i + 1);
  }

  return chunks;
}

/**
 * Process a single text file
 */
async function ingestFile(filePath, category) {
  console.log(`\n📖 Processing: ${path.basename(filePath)}`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const metadata = extractMetadata(fileContent);
    
    // Remove metadata from content
    const contentStart = fileContent.indexOf('---') + 3;
    const contentOnly = fileContent.substring(contentStart);
    
    // Detect and apply chunking strategy
    const strategy = detectChunkStrategy(contentOnly);
    console.log(`   Strategy: ${strategy} chunking`);
    
    let chunks;
    switch(strategy) {
      case 'verse':
        chunks = chunkByVerse(contentOnly);
        break;
      case 'chapter':
        chunks = chunkByChapter(contentOnly);
        break;
      default:
        chunks = chunkByParagraph(contentOnly);
    }

    console.log(`   Found: ${chunks.length} chunks`);
    
    // Embed and upsert each chunk
    let successCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Embed chunk text
        const embedding = await embedText(chunk.text);
        
        // Create point for Qdrant
        const point = {
          id: uuidv4(),
          vector: embedding,
          payload: {
            source_title: metadata.title,
            category: category || metadata.category,
            translator: metadata.translator,
            language: metadata.language,
            book: metadata.title,
            chapter: chunk.chapter || 'N/A',
            verse: chunk.verse || 'N/A',
            text: chunk.text.substring(0, 500), // Store first 500 chars
            full_text: chunk.text, // Store full for retrieval
            chunk_type: chunk.type,
            chunk_index: i,
            total_chunks: chunks.length,
          }
        };
        
        // Upsert to Qdrant
        await upsertPoints(process.env.QDRANT_COLLECTION || 'myth_texts', [point]);
        
        successCount++;
        
        // Rate limiting (be nice to OpenAI)
        if (i % 10 === 0) {
          console.log(`   Progress: ${i}/${chunks.length}`);
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (e) {
        if (e.response?.status === 429) {
          console.log(`\n   ⚠️  OpenAI quota exceeded. Processed ${successCount} chunks so far.`);
          console.log(`   Continue later with: npm run ingest -- --file ${filePath}`);
          break;
        }
        console.error(`   Error on chunk ${i}:`, e.message);
      }
    }
    
    console.log(`   ✅ Successfully ingested ${successCount} chunks`);
    return successCount;
  } catch (e) {
    console.error(`   ❌ Error processing file:`, e.message);
    return 0;
  }
}

/**
 * Main ingestion process
 */
async function main() {
  console.log('\n🙏 MythAI Religious Texts Ingestion\n');
  console.log('Processing texts from:', TEXTS_DIR);

  const args = process.argv.slice(2);
  const categoryFilter = args.includes('--category') 
    ? args[args.indexOf('--category') + 1]
    : null;
  const fileFilter = args.includes('--file')
    ? args[args.indexOf('--file') + 1]
    : null;

  let totalChunks = 0;

  try {
    if (fileFilter) {
      // Single file mode
      const fullPath = path.resolve(fileFilter);
      const dir = path.dirname(fullPath).split(path.sep).pop();
      totalChunks += await ingestFile(fullPath, dir);
    } else if (categoryFilter) {
      // Category mode
      const categoryPath = path.join(TEXTS_DIR, categoryFilter);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.txt'));
        for (const file of files) {
          totalChunks += await ingestFile(path.join(categoryPath, file), categoryFilter);
        }
      } else {
        console.log(`Category directory not found: ${categoryFilter}`);
      }
    } else {
      // Full directory traversal
      if (!fs.existsSync(TEXTS_DIR)) {
        console.log(`Creating texts directory: ${TEXTS_DIR}`);
        fs.mkdirSync(TEXTS_DIR, { recursive: true });
      }

      const dirs = fs.readdirSync(TEXTS_DIR);
      for (const dir of dirs) {
        const dirPath = path.join(TEXTS_DIR, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.txt'));
          for (const file of files) {
            totalChunks += await ingestFile(path.join(dirPath, file), dir);
          }
        }
      }
      
      // Also ingest loose .txt files in root texts dir
      const files = fs.readdirSync(TEXTS_DIR).filter(f => f.endsWith('.txt'));
      for (const file of files) {
        totalChunks += await ingestFile(path.join(TEXTS_DIR, file), 'general');
      }
    }

    console.log(`\n✅ Ingestion complete! Total chunks: ${totalChunks}`);
    console.log('\n📊 Next steps:');
    console.log('   1. Test chat: curl http://localhost:3000/api/chat');
    console.log('   2. Check MongoDB: db.conversations.findOne()');
    console.log('   3. View Qdrant: http://localhost:6333/collections');
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }
}

main();
