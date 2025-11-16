require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { embedText } = require('./lib/openaiClient');
const { ensureCollection, upsertPoints } = require('./lib/qdrantClient');

const COLLECTION = process.env.QDRANT_COLLECTION || 'myth_texts';
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || '1536', 10);
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE_CHARS || '1200', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP_CHARS || '150', 10);

function chunkText(text){
  const chunks = [];
  let i = 0;
  while(i < text.length){
    const end = Math.min(i + CHUNK_SIZE, text.length);
    const chunk = text.slice(i, end);
    chunks.push(chunk.trim());
    // Move forward by (CHUNK_SIZE - CHUNK_OVERLAP), but at minimum 1 char
    const nextStart = i + (CHUNK_SIZE - CHUNK_OVERLAP);
    i = Math.max(nextStart, i + 1);
    if(i >= text.length) break;
  }
  return chunks;
}

async function ingestFile(filePath){
  const raw = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  const title = filename.replace(/\.txt$/i, '');
  const chunks = chunkText(raw);
  const points = [];
  for(let idx=0; idx<chunks.length; idx++){
    const text = chunks[idx];
    try{
      const vector = await embedText(text);
      const id = `${title}-${idx}`;
      points.push({ id, vector, payload: { id, source_title: title, book: title, chapter: null, verse: null, translator: 'unknown', license: 'public-domain', text } });
    }catch(e){
      console.warn('Embedding failed for chunk', idx, e.message);
    }
  }
  if(points.length) await upsertPoints(COLLECTION, points);
  console.log(`Ingested ${points.length} chunks from ${filePath}`);
}

async function main(){
  await ensureCollection(COLLECTION, VECTOR_DIM);
  const dataDir = path.resolve(__dirname, '..', 'data', 'texts');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.txt'));
  for(const f of files){
    await ingestFile(path.join(dataDir, f));
  }
}

if(require.main === module){
  main().catch(err => { console.error(err); process.exit(1); });
}
