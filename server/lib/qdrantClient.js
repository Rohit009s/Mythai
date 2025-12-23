// Qdrant Client Router
// Routes requests to cloud, FAISS, or mock based on configuration
// Priority: FAISS (free, local) > Qdrant Cloud > Mock

require('dotenv').config();

const qdrantCloud = require('./qdrantCloud');
let mockDb = {}; // in-memory fallback
let faissClient = null;

// Check if FAISS is available
const USE_FAISS = process.env.USE_FAISS !== 'false'; // Default to true
try {
  if (USE_FAISS) {
    faissClient = require('./faissClient');
    if (faissClient.isAvailable()) {
      console.log('[Qdrant] Using FAISS for vector storage');
    } else {
      faissClient = null;
    }
  }
} catch (e) {
  console.warn('[Qdrant] FAISS not available, using fallback');
  faissClient = null;
}

// On startup, try to load any precomputed embeddings from disk into mockDb
try{
  const path = require('path');
  const fs = require('fs');
  const embedDir = path.join(__dirname, '..', '..', 'data', 'embeddings');
  if(fs.existsSync(embedDir)){
    const files = fs.readdirSync(embedDir).filter(f => f.endsWith('_embeddings.json'));
    for(const f of files){
      try{
        const full = path.join(embedDir, f);
        const arr = JSON.parse(fs.readFileSync(full, 'utf8'));
        const collectionName = process.env.QDRANT_COLLECTION || 'myth_texts';
        if(!mockDb[collectionName]) mockDb[collectionName] = { vectors: [] };
        for(const item of arr){
          mockDb[collectionName].vectors.push({ id: item.id, vector: item.embedding || null, payload: item.payload });
        }
        console.log(`[Qdrant] Loaded ${arr.length} embeddings from ${f} into mock store`);
      }catch(e){
        console.warn('[Qdrant] Failed to load embeddings file', f, e && e.message ? e.message : e);
      }
    }
  }
}catch(e){
  // ignore
}

// Determine mode
const IS_CLOUD = !!process.env.QDRANT_URL && process.env.QDRANT_URL.includes('qdrant.io');
const MODE = IS_CLOUD ? 'CLOUD' : 'MOCK';

function getClient(){
  console.log(`[Qdrant] Using ${MODE} mode`);
  return { mode: MODE };
}

async function ensureCollection(collectionName, vectorSize){
  if(IS_CLOUD){
    return await qdrantCloud.ensureCollection(vectorSize);
  }else{
    // Mock mode
    if(!mockDb[collectionName]){
      mockDb[collectionName] = { vectors: [] };
    }
    return true;
  }
}

async function upsertPoints(collectionName, points){
  if(IS_CLOUD){
    try{
      const ok = await qdrantCloud.upsertPoints(points);
      if(ok) return true;
      // fallthrough to mock fallback
      console.warn('[Qdrant] Cloud upsert failed, falling back to local mock store');
    }catch(e){
      console.warn('[Qdrant] Cloud upsert error, falling back to local mock store', e && e.message ? e.message : e);
    }
  }
  // Mock mode or cloud fallback - store in memory
  if(!mockDb[collectionName]){
    mockDb[collectionName] = { vectors: [] };
  }
  for(const point of points){
    const existing = mockDb[collectionName].vectors.findIndex(p => p.id === point.id);
    if(existing >= 0){
      mockDb[collectionName].vectors[existing] = point;
    }else{
      mockDb[collectionName].vectors.push(point);
    }
  }
  return true;
}

async function search(collectionName, vector, topK=4, filters=null){
  // Try FAISS first (free, local, fast)
  if(faissClient){
    try{
      const faissRes = await faissClient.search(vector, topK);
      if(faissRes && faissRes.length) {
        console.log(`[Qdrant] FAISS returned ${faissRes.length} results`);
        // Apply filters if provided
        if(filters){
          return applyFilters(faissRes, filters);
        }
        return faissRes;
      }
    }catch(e){
      console.warn('[Qdrant] FAISS search error, falling back:', e.message);
    }
  }
  
  // Try Qdrant Cloud
  if(IS_CLOUD){
    try{
      const cloudRes = await qdrantCloud.searchVectors(vector, topK, filters);
      if(cloudRes && cloudRes.length) return cloudRes;
      console.warn('[Qdrant] Cloud search returned no results, falling back to local mock store');
    }catch(e){
      console.warn('[Qdrant] Cloud search error, falling back to local mock store', e && e.message ? e.message : e);
    }
  }
  
  // Mock mode - return mock results
  if(!mockDb[collectionName] || !mockDb[collectionName].vectors){
    return [];
  }
  
  // Apply filters to mock data
  let vectors = mockDb[collectionName].vectors;
  if(filters){
    vectors = vectors.filter(p => matchesFilters(p.payload, filters));
  }
  
  // Simple mock similarity by returning the first topK points with a synthetic score
  const results = vectors.slice(0, topK).map((p, idx) => ({
    id: p.id,
    score: 1.0 - (idx * 0.01),
    payload: p.payload
  }));
  return results;
}

/**
 * Check if payload matches filters
 */
function matchesFilters(payload, filters){
  if(!payload) return false;
  
  // Check religion filter
  if(filters.religion && payload.religion !== filters.religion){
    return false;
  }
  
  // Check deity_group filter
  if(filters.deity_group && payload.deity_group !== filters.deity_group){
    return false;
  }
  
  // Check books filter (payload.book should be in the allowed books list)
  if(filters.books && filters.books.length > 0){
    if(!payload.book || !filters.books.includes(payload.book)){
      return false;
    }
  }
  
  return true;
}

/**
 * Apply filters to search results
 */
function applyFilters(results, filters){
  return results.filter(r => matchesFilters(r.payload, filters));
}

async function getInfo(){
  if(IS_CLOUD){
    return await qdrantCloud.getCollectionInfo();
  }else{
    return { mode: 'MOCK', status: 'ready' };
  }
}

/**
 * Search sacred texts with advanced filtering for multi-model pipeline
 * @param {Array} embeddings - Query vector embeddings
 * @param {Object} filters - Advanced filter options
 * @param {string} filters.deityId - Deity identifier
 * @param {string} filters.religion - Religion filter
 * @param {string} filters.language - Language filter
 * @param {Array<string>} filters.primaryBooks - Primary books to prioritize
 * @param {Array<string>} filters.secondaryBooks - Secondary books to include
 * @param {number} filters.topK - Number of results to return (default: 5)
 * @param {number} filters.scoreThreshold - Minimum similarity score (default: 0.6)
 * @returns {Promise<Array>} Ranked search results
 */
async function searchSacredTexts(embeddings, filters = {}) {
  const {
    deityId,
    religion,
    language,
    primaryBooks = [],
    secondaryBooks = [],
    topK = 5,
    scoreThreshold = 0.6
  } = filters;

  // Build filter object for search
  const searchFilters = {};
  
  if (religion) {
    searchFilters.religion = religion;
  }
  
  if (language) {
    searchFilters.language = language;
  }
  
  // Combine primary and secondary books for initial search
  const allBooks = [...primaryBooks, ...secondaryBooks];
  if (allBooks.length > 0) {
    searchFilters.books = allBooks;
  }
  
  // Perform search with increased limit to allow for ranking
  const searchLimit = topK * 2; // Get more results for better ranking
  const results = await search(
    process.env.QDRANT_COLLECTION || 'myth_texts',
    embeddings,
    searchLimit,
    searchFilters
  );
  
  // Filter by score threshold
  const filteredResults = results.filter(r => r.score >= scoreThreshold);
  
  // Rank by book priority
  const rankedResults = rankByBookPriority(
    filteredResults,
    primaryBooks,
    secondaryBooks
  );
  
  // Return top K results
  return rankedResults.slice(0, topK);
}

/**
 * Rank search results by book priority
 * Prioritizes primary books over secondary books
 * @param {Array} results - Search results from vector DB
 * @param {Array<string>} primaryBooks - Primary books (higher priority)
 * @param {Array<string>} secondaryBooks - Secondary books (lower priority)
 * @returns {Array} Ranked results
 */
function rankByBookPriority(results, primaryBooks = [], secondaryBooks = []) {
  // Normalize book names for comparison
  const normalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().trim()
      .replace(/[_\s-]+/g, ' ')
      .replace(/\s+/g, ' ');
  };
  
  const normalizedPrimary = primaryBooks.map(normalizeName);
  const normalizedSecondary = secondaryBooks.map(normalizeName);
  
  // Calculate adjusted scores with book priority boost
  const scoredResults = results.map(result => {
    const bookName = normalizeName(result.payload?.book || '');
    let priorityBoost = 1.0;
    
    // Check if book is in primary list (1.5x boost)
    if (normalizedPrimary.some(primary => {
      return bookName.includes(primary) || primary.includes(bookName);
    })) {
      priorityBoost = 1.5;
    }
    // Check if book is in secondary list (1.0x - no boost)
    else if (normalizedSecondary.some(secondary => {
      return bookName.includes(secondary) || secondary.includes(bookName);
    })) {
      priorityBoost = 1.0;
    }
    // Book not in either list (0.7x penalty)
    else {
      priorityBoost = 0.7;
    }
    
    return {
      ...result,
      adjustedScore: result.score * priorityBoost,
      priorityBoost
    };
  });
  
  // Sort by adjusted score (descending)
  scoredResults.sort((a, b) => b.adjustedScore - a.adjustedScore);
  
  return scoredResults;
}

module.exports = { 
  getClient, 
  ensureCollection, 
  upsertPoints, 
  search, 
  getInfo, 
  searchSacredTexts,
  rankByBookPriority,
  mockDb, 
  MODE 
};
