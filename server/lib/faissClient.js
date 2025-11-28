/**
 * FAISS Vector Database Client
 * Free, local, fast vector search
 * 
 * Installation:
 * npm install faiss-node
 * 
 * FAISS (Facebook AI Similarity Search):
 * - Free, open-source
 * - Fast similarity search
 * - Local storage (no cloud costs)
 * - Supports millions of vectors
 */

const fs = require('fs');
const path = require('path');

let faiss = null;
let index = null;
let metadata = []; // Store metadata for each vector

const FAISS_INDEX_PATH = path.join(__dirname, '../../data/faiss-index');
const METADATA_PATH = path.join(__dirname, '../../data/faiss-metadata.json');

/**
 * Initialize FAISS
 */
async function initFAISS(dimension = 384) {
  if (index) return index;
  
  try {
    faiss = require('faiss-node');
    
    // Try to load existing index
    if (fs.existsSync(FAISS_INDEX_PATH)) {
      console.log('[FAISS] Loading existing index...');
      index = faiss.IndexFlatL2.read(FAISS_INDEX_PATH);
      
      // Load metadata
      if (fs.existsSync(METADATA_PATH)) {
        metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
      }
      
      console.log(`[FAISS] Loaded index with ${index.ntotal()} vectors`);
    } else {
      // Create new index
      console.log(`[FAISS] Creating new index (${dimension} dimensions)...`);
      index = new faiss.IndexFlatL2(dimension);
      console.log('[FAISS] New index created');
    }
    
    return index;
  } catch (error) {
    console.error('[FAISS] Failed to initialize:', error.message);
    console.log('[FAISS] Install with: npm install faiss-node');
    return null;
  }
}

/**
 * Check if FAISS is available
 */
function isAvailable() {
  try {
    require.resolve('faiss-node');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Add vectors to FAISS index
 * @param {number[][]} vectors - Array of embedding vectors
 * @param {object[]} payloads - Array of metadata objects
 */
async function addVectors(vectors, payloads) {
  if (!index) {
    await initFAISS(vectors[0].length);
  }
  
  if (!index) {
    throw new Error('FAISS not available. Install with: npm install faiss-node');
  }
  
  try {
    // FAISS expects a 2D array of vectors
    // Convert each vector to Float32Array and add individually
    for (let i = 0; i < vectors.length; i++) {
      const vectorArray = Float32Array.from(vectors[i]);
      index.add(vectorArray);
      metadata.push(payloads[i]);
    }
    
    console.log(`[FAISS] Added ${vectors.length} vectors. Total: ${index.ntotal()}`);
    
    // Save index and metadata
    await saveIndex();
    
    return true;
  } catch (error) {
    console.error('[FAISS] Failed to add vectors:', error.message);
    throw error;
  }
}

/**
 * Search for similar vectors
 * @param {number[]} queryVector - Query embedding vector
 * @param {number} k - Number of results to return
 * @returns {Array} Array of {id, score, payload} objects
 */
async function search(queryVector, k = 4) {
  if (!index) {
    await initFAISS(queryVector.length);
  }
  
  if (!index || index.ntotal() === 0) {
    console.warn('[FAISS] Index is empty or not available');
    return [];
  }
  
  try {
    // Convert to Float32Array
    const queryArray = new Float32Array(queryVector);
    
    // Search
    const result = index.search(queryArray, k);
    
    // Format results
    const results = [];
    for (let i = 0; i < result.labels.length; i++) {
      const id = result.labels[i];
      const distance = result.distances[i];
      
      if (id >= 0 && id < metadata.length) {
        results.push({
          id: id,
          score: 1 / (1 + distance), // Convert distance to similarity score
          payload: metadata[id],
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('[FAISS] Search failed:', error.message);
    return [];
  }
}

/**
 * Save index to disk
 */
async function saveIndex() {
  if (!index) return;
  
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(FAISS_INDEX_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save index
    index.write(FAISS_INDEX_PATH);
    
    // Save metadata
    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
    
    console.log(`[FAISS] Index saved (${index.ntotal()} vectors)`);
  } catch (error) {
    console.error('[FAISS] Failed to save index:', error.message);
  }
}

/**
 * Get index info
 */
function getInfo() {
  if (!index) {
    return { status: 'not_initialized', count: 0 };
  }
  
  return {
    status: 'ready',
    count: index.ntotal(),
    dimension: index.d,
    metadataCount: metadata.length,
  };
}

/**
 * Clear index
 */
async function clearIndex() {
  if (index) {
    index.reset();
    metadata = [];
    await saveIndex();
    console.log('[FAISS] Index cleared');
  }
}

module.exports = {
  initFAISS,
  isAvailable,
  addVectors,
  search,
  saveIndex,
  getInfo,
  clearIndex,
};
