#!/usr/bin/env node
/**
 * Qdrant Cloud HTTP Client
 * Makes HTTP requests to Qdrant cloud API with proper authentication
 */

const https = require('https');
const { URL } = require('url');

require('dotenv').config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'myth_texts';

/**
 * Make HTTP request to Qdrant Cloud
 */
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    if (!QDRANT_URL || !QDRANT_API_KEY) {
      // Fallback to mock mode
      console.warn('[Qdrant] Cloud credentials not configured, using mock mode');
      return resolve({ status: 200, data: [] });
    }

    // Parse URL and handle port correctly
    let urlString = QDRANT_URL.replace(':6333', ''); // Remove port, use HTTPS default
    let urlObj = new URL(urlString);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'api-key': QDRANT_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    };

    if (body) {
      const jsonBody = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(jsonBody);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.warn(`[Qdrant] HTTP Error: ${error.message}, using mock fallback`);
      resolve({ status: 503, data: [] }); // Return empty results, will use mock
    });

    req.on('timeout', () => {
      req.abort();
      console.warn('[Qdrant] Request timeout, using mock fallback');
      resolve({ status: 504, data: [] });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Search for similar vectors with optional filters
 */
async function searchVectors(vector, limit = 4, filters = null, scoreThreshold = 0.0) {
  const path = `/collections/${COLLECTION_NAME}/points/search`;
  
  const body = {
    vector: vector,
    limit: limit,
    score_threshold: scoreThreshold,
    with_payload: true,
  };

  // Add filters if provided
  if (filters) {
    const filterConditions = [];
    
    if (filters.religion) {
      filterConditions.push({
        key: 'religion',
        match: { value: filters.religion }
      });
    }
    
    if (filters.deity_group) {
      filterConditions.push({
        key: 'deity_group',
        match: { value: filters.deity_group }
      });
    }
    
    if (filters.books && filters.books.length > 0) {
      filterConditions.push({
        key: 'book',
        match: { any: filters.books }
      });
    }
    
    if (filterConditions.length > 0) {
      body.filter = {
        must: filterConditions
      };
    }
  }

  try {
    const response = await makeRequest(path, 'POST', body);
    
    if (response.status === 200 && response.data.result) {
      return response.data.result.map(item => ({
        id: item.id,
        score: item.score,
        payload: item.payload,
      }));
    }
    
    console.warn(`[Qdrant] Search returned status ${response.status}`);
    return [];
  } catch (error) {
    console.warn(`[Qdrant] Search error: ${error.message}`);
    return [];
  }
}

/**
 * Upsert points (create or update)
 */
async function upsertPoints(points) {
  const path = `/collections/${COLLECTION_NAME}/points?wait=false`;
  
  const body = {
    points: points.map(p => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    })),
  };

  try {
    const response = await makeRequest(path, 'PUT', body);
    
    if (response.status === 200) {
      console.log(`[Qdrant] Successfully upserted ${points.length} points`);
      return true;
    }
    
    console.warn(`[Qdrant] Upsert returned status ${response.status}`);
    return false;
  } catch (error) {
    console.warn(`[Qdrant] Upsert error: ${error.message}`);
    return false;
  }
}

/**
 * Create collection if it doesn't exist
 */
async function ensureCollection(vectorSize = 1536) {
  const path = `/collections/${COLLECTION_NAME}`;
  
  try {
    // Check if collection exists
    const response = await makeRequest(path, 'GET');
    
    if (response.status === 200) {
      console.log(`[Qdrant] Collection "${COLLECTION_NAME}" already exists`);
      return true;
    }

    // Create collection if it doesn't exist
    if (response.status === 404) {
      const createPath = `/collections/${COLLECTION_NAME}`;
      const createBody = {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      };

      const createResponse = await makeRequest(createPath, 'PUT', createBody);
      
      if (createResponse.status === 200 || createResponse.status === 201) {
        console.log(`[Qdrant] Collection "${COLLECTION_NAME}" created successfully`);
        return true;
      }
      
      console.warn(`[Qdrant] Collection creation failed with status ${createResponse.status}`);
      return false;
    }

    return false;
  } catch (error) {
    console.warn(`[Qdrant] Collection ensure error: ${error.message}`);
    return false;
  }
}

/**
 * Get collection info
 */
async function getCollectionInfo() {
  const path = `/collections/${COLLECTION_NAME}`;
  
  try {
    const response = await makeRequest(path, 'GET');
    
    if (response.status === 200) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.warn(`[Qdrant] Get collection info error: ${error.message}`);
    return null;
  }
}

module.exports = {
  searchVectors,
  upsertPoints,
  ensureCollection,
  getCollectionInfo,
  makeRequest,
};
