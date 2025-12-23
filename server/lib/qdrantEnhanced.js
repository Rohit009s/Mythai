/**
 * Enhanced Qdrant Client with Retry, Caching, and Error Handling
 */

const https = require('https');
const http = require('http');
const cacheManager = require('./cacheManager');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'sacred_texts';

class QdrantClient {
  constructor() {
    this.stats = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      cacheHits: 0,
      totalLatency: 0
    };
  }

  // Make HTTP request to Qdrant
  async makeRequest(method, endpoint, body = null, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.httpRequest(method, endpoint, body);
      } catch (error) {
        console.error(`[Qdrant] Attempt ${attempt}/${retries} failed: ${error.message}`);

        if (attempt === retries) {
          throw new Error(`Qdrant request failed after ${retries} attempts: ${error.message}`);
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // HTTP request helper
  httpRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(QDRANT_URL + endpoint);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 6333),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

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

      req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  // Initialize collection
  async initCollection() {
    try {
      // Check if collection exists
      await this.makeRequest('GET', `/collections/${COLLECTION_NAME}`);
      console.log('[Qdrant] Collection exists');
      return true;
    } catch (error) {
      // Create collection
      console.log('[Qdrant] Creating collection...');
      await this.makeRequest('PUT', `/collections/${COLLECTION_NAME}`, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
      console.log('[Qdrant] Collection created');
      return true;
    }
  }

  // Search with embedding vector
  async searchByVector(embedding, options = {}) {
    const startTime = Date.now();
    this.stats.totalSearches++;

    const {
      top_k = 5,
      persona = null,
      religion = null,
      language = null,
      category = null,
      useCache = true
    } = options;

    // Check cache
    if (useCache) {
      const cacheKey = JSON.stringify({ embedding: embedding.slice(0, 10), top_k, persona, religion, language, category });
      const cached = cacheManager.getSearchResults(cacheKey, {});
      if (cached) {
        this.stats.cacheHits++;
        console.log('[Qdrant] Search results from cache');
        return cached;
      }
    }

    try {
      // Build filter
      const filter = this.buildFilter({ persona, religion, language, category });

      // Search request
      const searchBody = {
        vector: embedding,
        limit: top_k,
        with_payload: true,
        with_vector: false
      };

      if (filter) {
        searchBody.filter = filter;
      }

      const response = await this.makeRequest('POST', `/collections/${COLLECTION_NAME}/points/search`, searchBody);

      // Format results
      const results = response.result.map(hit => ({
        text: hit.payload.text,
        score: hit.score,
        book: hit.payload.book,
        chapter: hit.payload.chapter || '',
        verse: hit.payload.verse || '',
        religion: hit.payload.religion,
        language: hit.payload.language,
        category: hit.payload.category,
        persona: hit.payload.persona || null
      }));

      // Cache results
      if (useCache) {
        const cacheKey = JSON.stringify({ embedding: embedding.slice(0, 10), top_k, persona, religion, language, category });
        cacheManager.cacheSearchResults(cacheKey, {}, results);
      }

      this.stats.successfulSearches++;
      this.stats.totalLatency += Date.now() - startTime;

      return results;

    } catch (error) {
      this.stats.failedSearches++;
      console.error('[Qdrant] Search error:', error.message);
      throw error;
    }
  }

  // Search by text (embed + search)
  async searchByText(query, options = {}) {
    const hfClient = require('./huggingfaceEnhanced');
    
    // Generate embedding
    const embeddings = await hfClient.generateEmbeddings([query]);
    const embedding = embeddings[0];

    // Search with embedding
    return await this.searchByVector(embedding, options);
  }

  // Build filter for Qdrant
  buildFilter(options) {
    const conditions = [];

    if (options.persona) {
      conditions.push({
        key: 'persona',
        match: { value: options.persona }
      });
    }

    if (options.religion) {
      conditions.push({
        key: 'religion',
        match: { value: options.religion }
      });
    }

    if (options.language) {
      conditions.push({
        key: 'language',
        match: { value: options.language }
      });
    }

    if (options.category) {
      conditions.push({
        key: 'category',
        match: { value: options.category }
      });
    }

    if (conditions.length === 0) {
      return null;
    }

    return {
      must: conditions
    };
  }

  // Upload points (for embedding script)
  async uploadPoints(points) {
    try {
      await this.makeRequest('PUT', `/collections/${COLLECTION_NAME}/points`, {
        points: points
      });
      return { success: true, count: points.length };
    } catch (error) {
      console.error('[Qdrant] Upload error:', error.message);
      throw error;
    }
  }

  // Get collection info
  async getCollectionInfo() {
    try {
      const response = await this.makeRequest('GET', `/collections/${COLLECTION_NAME}`);
      return response.result;
    } catch (error) {
      console.error('[Qdrant] Get collection info error:', error.message);
      throw error;
    }
  }

  // Count points in collection
  async countPoints(filter = null) {
    try {
      const body = filter ? { filter } : {};
      const response = await this.makeRequest('POST', `/collections/${COLLECTION_NAME}/points/count`, body);
      return response.result.count;
    } catch (error) {
      console.error('[Qdrant] Count error:', error.message);
      throw error;
    }
  }

  // Delete collection
  async deleteCollection() {
    try {
      await this.makeRequest('DELETE', `/collections/${COLLECTION_NAME}`);
      console.log('[Qdrant] Collection deleted');
      return { success: true };
    } catch (error) {
      console.error('[Qdrant] Delete error:', error.message);
      throw error;
    }
  }

  // Get statistics
  getStats() {
    const avgLatency = this.stats.successfulSearches > 0
      ? (this.stats.totalLatency / this.stats.successfulSearches).toFixed(2)
      : 0;

    const successRate = this.stats.totalSearches > 0
      ? ((this.stats.successfulSearches / this.stats.totalSearches) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      avgLatency: `${avgLatency}ms`,
      successRate: `${successRate}%`,
      cacheHitRate: this.stats.totalSearches > 0
        ? `${((this.stats.cacheHits / this.stats.totalSearches) * 100).toFixed(2)}%`
        : '0%'
    };
  }

  // Health check
  async healthCheck() {
    try {
      await this.makeRequest('GET', '/');
      return { status: 'healthy', service: 'Qdrant' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Singleton instance
const qdrantClient = new QdrantClient();

module.exports = qdrantClient;
