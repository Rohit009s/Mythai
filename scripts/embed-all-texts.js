/**
 * Complete Text Embedding and Qdrant Indexing Script
 * 
 * This script:
 * 1. Reads all sacred texts from data/texts/
 * 2. Chunks them intelligently (by verse, paragraph, or sentence)
 * 3. Generates embeddings using MiniLM-L6-v2
 * 4. Stores in Qdrant with metadata
 * 5. Includes retry logic and error handling
 * 6. Shows progress and statistics
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config();

// Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'sacred_texts';
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const BATCH_SIZE = 10; // Embed 10 chunks at a time
const CHUNK_SIZE = 500; // Characters per chunk
const CHUNK_OVERLAP = 50; // Overlap between chunks

console.log('🔧 Configuration:');
console.log(`   Qdrant URL: ${QDRANT_URL}`);
console.log(`   Collection: ${COLLECTION_NAME}`);
console.log(`   Has API Key: ${!!QDRANT_API_KEY}`);
console.log(`   Has HF Token: ${!!HF_API_TOKEN}\n`);

// Text metadata mapping
const TEXT_METADATA = {
  // Eastern texts
  'bhagavad_gita.txt': { religion: 'hindu', book: 'Bhagavad Gita', category: 'scripture', language: 'en' },
  'ramayana.txt': { religion: 'hindu', book: 'Ramayana', category: 'epic', language: 'en' },
  'mahabharata_kmg.txt': { religion: 'hindu', book: 'Mahabharata', category: 'epic', language: 'en' },
  'upanishads.txt': { religion: 'hindu', book: 'Upanishads', category: 'scripture', language: 'en' },
  'dhammapada.txt': { religion: 'buddhist', book: 'Dhammapada', category: 'scripture', language: 'en' },
  'tao_te_ching.txt': { religion: 'taoist', book: 'Tao Te Ching', category: 'scripture', language: 'en' },
  
  // Puranas
  'bhagavata_purana_en.txt': { religion: 'hindu', book: 'Bhagavata Purana', category: 'purana', language: 'en' },
  'shiva_purana_en.txt': { religion: 'hindu', book: 'Shiva Purana', category: 'purana', language: 'en' },
  'vishnu_purana_en.txt': { religion: 'hindu', book: 'Vishnu Purana', category: 'purana', language: 'en' },
  'garuda_purana_en.txt': { religion: 'hindu', book: 'Garuda Purana', category: 'purana', language: 'en' },
  
  // Western texts
  'bible_kjv.txt': { religion: 'christian', book: 'Bible (KJV)', category: 'scripture', language: 'en' },
  'quran.txt': { religion: 'muslim', book: 'Quran', category: 'scripture', language: 'en' },
  
  // Greek mythology
  'zeus-greek.txt': { religion: 'greek', book: 'Zeus Mythology', category: 'mythology', language: 'en', persona: 'Zeus' },
  'athena-greek.txt': { religion: 'greek', book: 'Athena Mythology', category: 'mythology', language: 'en', persona: 'Athena' },
  'apollo-greek.txt': { religion: 'greek', book: 'Apollo Mythology', category: 'mythology', language: 'en', persona: 'Apollo' },
  'hera-greek.txt': { religion: 'greek', book: 'Hera Mythology', category: 'mythology', language: 'en', persona: 'Hera' },
  
  // Norse mythology
  'odin-norse.txt': { religion: 'norse', book: 'Odin Mythology', category: 'mythology', language: 'en', persona: 'Odin' },
  'thor-norse.txt': { religion: 'norse', book: 'Thor Mythology', category: 'mythology', language: 'en', persona: 'Thor' },
  'loki-norse.txt': { religion: 'norse', book: 'Loki Mythology', category: 'mythology', language: 'en', persona: 'Loki' },
  'freyja-norse.txt': { religion: 'norse', book: 'Freyja Mythology', category: 'mythology', language: 'en', persona: 'Freyja' },
  
  // Egyptian mythology
  'ra.re-egypt.txt': { religion: 'egyptian', book: 'Ra Mythology', category: 'mythology', language: 'en', persona: 'Ra' },
  'isis-egypt.txt': { religion: 'egyptian', book: 'Isis Mythology', category: 'mythology', language: 'en', persona: 'Isis' },
  'osiris-egypt.txt': { religion: 'egyptian', book: 'Osiris Mythology', category: 'mythology', language: 'en', persona: 'Osiris' },
  'anubis-egypt.txt': { religion: 'egyptian', book: 'Anubis Mythology', category: 'mythology', language: 'en', persona: 'Anubis' },
  
  // Hindi texts
  'ramayana_hindi.txt': { religion: 'hindu', book: 'Ramayana', category: 'epic', language: 'hi' },
  'mahabharta_hindi.txt': { religion: 'hindu', book: 'Mahabharata', category: 'epic', language: 'hi' },
  'bible_hindi.txt': { religion: 'christian', book: 'Bible', category: 'scripture', language: 'hi' },
  
  // Telugu texts
  'ramayana_telugu.txt': { religion: 'hindu', book: 'Ramayana', category: 'epic', language: 'te' },
  'mahabharatham_telugu.txt': { religion: 'hindu', book: 'Mahabharata', category: 'epic', language: 'te' },
  'bhagvath-geetha_telugu.txt': { religion: 'hindu', book: 'Bhagavad Gita', category: 'scripture', language: 'te' },
  'quran_telugu.txt': { religion: 'muslim', book: 'Quran', category: 'scripture', language: 'te' },
  
  // Tamil texts
  'ramayana_tamil.txt': { religion: 'hindu', book: 'Ramayana', category: 'epic', language: 'ta' },
};

class TextEmbedder {
  constructor() {
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      totalChunks: 0,
      embeddedChunks: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  // Initialize Qdrant collection
  async initQdrant() {
    console.log('🔧 Initializing Qdrant collection...\n');
    
    try {
      // Check if collection exists
      const exists = await this.qdrantRequest('GET', `/collections/${COLLECTION_NAME}`);
      console.log('✅ Collection already exists\n');
    } catch (error) {
      // Create collection
      console.log('📦 Creating new collection...');
      await this.qdrantRequest('PUT', `/collections/${COLLECTION_NAME}`, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
      console.log('✅ Collection created\n');
    }
  }

  // Qdrant HTTP request helper
  async qdrantRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(QDRANT_URL + endpoint);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 6333),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add API key for Qdrant Cloud
      if (QDRANT_API_KEY) {
        options.headers['api-key'] = QDRANT_API_KEY;
      }

      const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`Qdrant error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // HuggingFace embedding request with retry
  async embedTexts(texts, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.callHuggingFace(texts);
      } catch (error) {
        if (attempt === retries) throw error;
        console.log(`⚠️  Retry ${attempt}/${retries} after error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  // HuggingFace API call
  async callHuggingFace(texts) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ inputs: texts });
      
      const options = {
        hostname: 'router.huggingface.co',
        port: 443,
        path: `/models/${EMBEDDING_MODEL}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HuggingFace error: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // Chunk text intelligently
  chunkText(text, metadata) {
    const chunks = [];
    
    // Try to split by verses (for scriptures)
    if (text.includes('Verse') || text.includes('Chapter')) {
      const verses = text.split(/(?=Chapter|Verse)/);
      for (const verse of verses) {
        if (verse.trim().length > 50) {
          chunks.push({
            text: verse.trim(),
            metadata: { ...metadata, type: 'verse' }
          });
        }
      }
    } 
    // Try to split by paragraphs
    else if (text.includes('\n\n')) {
      const paragraphs = text.split('\n\n');
      for (const para of paragraphs) {
        if (para.trim().length > 50) {
          // If paragraph is too long, split further
          if (para.length > CHUNK_SIZE) {
            const subChunks = this.splitBySize(para, CHUNK_SIZE, CHUNK_OVERLAP);
            chunks.push(...subChunks.map(c => ({ text: c, metadata })));
          } else {
            chunks.push({ text: para.trim(), metadata });
          }
        }
      }
    }
    // Split by size as fallback
    else {
      const sizeChunks = this.splitBySize(text, CHUNK_SIZE, CHUNK_OVERLAP);
      chunks.push(...sizeChunks.map(c => ({ text: c, metadata })));
    }
    
    return chunks;
  }

  // Split text by size with overlap
  splitBySize(text, size, overlap) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + size;
      
      // Try to break at sentence boundary
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        if (sentenceEnd > start + size / 2) {
          end = sentenceEnd + 1;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }
    
    return chunks.filter(c => c.length > 50);
  }

  // Process a single file
  async processFile(filePath, fileName) {
    try {
      console.log(`📖 Processing: ${fileName}`);
      
      // Read file
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Get metadata
      const metadata = TEXT_METADATA[fileName] || {
        religion: 'unknown',
        book: fileName.replace('.txt', ''),
        category: 'text',
        language: 'en'
      };
      
      // Chunk text
      const chunks = this.chunkText(content, metadata);
      console.log(`   📄 Created ${chunks.length} chunks`);
      this.stats.totalChunks += chunks.length;
      
      // Process in batches
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map(c => c.text);
        
        // Generate embeddings
        const embeddings = await this.embedTexts(texts);
        
        // Prepare points for Qdrant
        const points = batch.map((chunk, idx) => ({
          id: `${fileName}_${i + idx}_${Date.now()}`,
          vector: embeddings[idx],
          payload: {
            text: chunk.text,
            ...chunk.metadata,
            file: fileName,
            chunk_index: i + idx
          }
        }));
        
        // Upload to Qdrant
        await this.qdrantRequest('PUT', `/collections/${COLLECTION_NAME}/points`, {
          points: points
        });
        
        this.stats.embeddedChunks += batch.length;
        process.stdout.write(`   ⚡ Embedded: ${this.stats.embeddedChunks}/${this.stats.totalChunks}\r`);
      }
      
      console.log(`\n   ✅ Completed: ${fileName}\n`);
      this.stats.processedFiles++;
      
    } catch (error) {
      console.error(`   ❌ Error processing ${fileName}: ${error.message}\n`);
      this.stats.errors++;
    }
  }

  // Find all text files recursively
  async findTextFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.findTextFiles(fullPath));
      } else if (entry.name.endsWith('.txt') && !entry.name.includes('_raw')) {
        files.push({ path: fullPath, name: entry.name });
      }
    }
    
    return files;
  }

  // Main processing function
  async processAllTexts() {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('  📚 SACRED TEXTS EMBEDDING & INDEXING\n');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Initialize Qdrant
    await this.initQdrant();
    
    // Find all text files
    const textsDir = path.join(__dirname, '..', 'data', 'texts');
    const files = await this.findTextFiles(textsDir);
    this.stats.totalFiles = files.length;
    
    console.log(`📊 Found ${files.length} text files to process\n`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Process each file
    for (const file of files) {
      await this.processFile(file.path, file.name);
    }
    
    // Print final statistics
    this.printStats();
  }

  // Print statistics
  printStats() {
    const duration = ((Date.now() - this.stats.startTime) / 1000).toFixed(2);
    
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('  📊 EMBEDDING STATISTICS\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Total Files:       ${this.stats.totalFiles}`);
    console.log(`Processed Files:   ${this.stats.processedFiles}`);
    console.log(`Total Chunks:      ${this.stats.totalChunks}`);
    console.log(`Embedded Chunks:   ${this.stats.embeddedChunks}`);
    console.log(`Errors:            ${this.stats.errors}`);
    console.log(`Duration:          ${duration}s`);
    console.log(`Avg per file:      ${(duration / this.stats.processedFiles).toFixed(2)}s`);
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    if (this.stats.errors === 0) {
      console.log('✅ All texts embedded successfully!\n');
    } else {
      console.log(`⚠️  Completed with ${this.stats.errors} errors\n`);
    }
  }
}

// Run the embedder
if (require.main === module) {
  const embedder = new TextEmbedder();
  embedder.processAllTexts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TextEmbedder;
