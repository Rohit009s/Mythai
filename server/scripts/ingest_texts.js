const fs = require('fs');
const path = require('path');
const { embedText } = require('../lib/openaiClient');
const qdrant = require('../lib/qdrantClient');

function splitIntoChunks(text, maxChars = 1000){
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  for(const p of paragraphs){
    if(p.length <= maxChars){
      chunks.push(p);
    }else{
      for(let i=0;i<p.length;i+=maxChars){
        chunks.push(p.slice(i, i+maxChars));
      }
    }
  }
  return chunks;
}

async function ingestLang(lang){
  const textsDir = path.join(__dirname, '..', '..', 'data', 'texts', lang);
  if(!fs.existsSync(textsDir)){
    console.error('Texts directory not found:', textsDir);
    process.exit(1);
  }
  const outDir = path.join(__dirname, '..', '..', 'data', 'embeddings');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // gather .txt files recursively
  function walk(dir){
    const acc = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for(const it of items){
      const p = path.join(dir, it.name);
      if(it.isDirectory()) acc.push(...walk(p));
      else if(it.isFile() && it.name.toLowerCase().endsWith('.txt')) acc.push(p);
    }
    return acc;
  }
  const files = walk(textsDir);
  if(files.length === 0){
    console.error('No .txt files found in', textsDir);
    process.exit(1);
  }

  const results = [];
  // ensure collection exists (vector size from env or default)
  const vectorSize = parseInt(process.env.VECTOR_DIM || '1536', 10);
  try{
    await qdrant.ensureCollection(process.env.QDRANT_COLLECTION || 'myth_texts', vectorSize);
  }catch(e){
    console.warn('Qdrant ensureCollection failed', e && e.message ? e.message : e);
  }
  for(const fname of files){
    const full = fname; // now fname is full path
    const text = fs.readFileSync(full, 'utf8');
    const chunks = splitIntoChunks(text, 800);
    console.log(`Processing ${fname}: ${chunks.length} chunks`);
    for(const [i, chunk] of chunks.entries()){
      const safeName = path.relative(textsDir, full).replace(/[^a-z0-9]/gi,'_');
      const id = `${safeName}_${i}`;
      let embedding = null;
      try{
        embedding = await embedText(chunk);
      }catch(e){
        console.warn('Embedding failed for', id, e && e.message ? e.message : e);
        embedding = null;
      }
      const payload = { text: chunk, source_title: path.relative(textsDir, full), lang };
      results.push({ id, text: chunk, embedding, payload });
    }
  }

  const outFile = path.join(outDir, `${lang}_embeddings.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');
  console.log('Wrote', outFile, 'with', results.length, 'entries');

  // Upsert into Qdrant (or mock) if we have embeddings
  const points = results.map(r => ({ id: r.id, vector: r.embedding || new Array(vectorSize).fill(0), payload: r.payload }));
  try{
    const ok = await qdrant.upsertPoints(process.env.QDRANT_COLLECTION || 'myth_texts', points);
    console.log('Qdrant upsert result:', ok);
  }catch(e){
    console.warn('Qdrant upsert failed', e && e.message ? e.message : e);
  }
}

async function main(){
  const args = process.argv.slice(2);
  let lang = process.env.LANG || 'hi';
  for(let i=0;i<args.length;i++){
    const a = args[i];
    if(a === '--lang' || a === '-l'){
      lang = args[i+1];
      break;
    } else if(a.startsWith('--lang=')){
      lang = a.split('=')[1];
      break;
    }
  }
  await ingestLang(lang);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
