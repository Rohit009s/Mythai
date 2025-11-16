// Qdrant Client Router
// Routes requests to cloud or local based on configuration
// Supports both cloud (HTTP) and local (mock) modes

require('dotenv').config();

const qdrantCloud = require('./qdrantCloud');
let mockDb = {}; // in-memory fallback

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
    return await qdrantCloud.upsertPoints(points);
  }else{
    // Mock mode - store in memory
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
}

async function search(collectionName, vector, topK=4){
  if(IS_CLOUD){
    return await qdrantCloud.searchVectors(vector, topK);
  }else{
    // Mock mode - return mock results
    if(!mockDb[collectionName] || !mockDb[collectionName].vectors){
      return [];
    }
    // Simple mock similarity by checking payload text contains keywords
    const results = mockDb[collectionName].vectors.map(p => ({
      id: p.id,
      score: Math.random() * 0.5 + 0.5, // fake score
      payload: p.payload
    })).slice(0, topK);
    return results;
  }
}

async function getInfo(){
  if(IS_CLOUD){
    return await qdrantCloud.getCollectionInfo();
  }else{
    return { mode: 'MOCK', status: 'ready' };
  }
}

module.exports = { getClient, ensureCollection, upsertPoints, search, getInfo, mockDb, MODE };
