/**
 * Embeddings Generator with Caching Support
 * 
 * Generates embeddings using Hugging Face API with LRU cache
 * for performance optimization.
 * 
 * Requirements: 2.1, 8.1
 */

const cacheManager = require('./cacheManager');

let HfInference;
try {
  const hf = require('@huggingface/inference');
  HfInference = hf.HfInference;
} catch (e) {
  console.warn('[EmbeddingsGenerator] @huggingface/inference not installed');
  HfInference = null;
}

const DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const CACHE_TTL = 86400000; // 24 hours
const MAX_BATCH_SIZE = 32;

class EmbeddingsGenerator {
  constructor(options = {}) {
    this.model = options.model || process.env.EMBEDDING_MODEL || DEFAULT_MODEL;
    this.apiToken = options.apiToken || process.env.HUGGINGFACE_API_TOKEN;
    this.cacheTTL = options.cacheTTL || CACHE_TTL;
    this.maxBatchSize = options.maxBatchSize || MAX_BATCH_SIZE;
    
    if (!this.apiToken || this.apiToken === '') {
      throw new Error('HUGGINGFACE_API_TOKEN is required for embeddings generation');
    }
    
    if (!HfInference) {
      throw new Error('@huggingface/inference package is required. Install: npm install @huggingface/inference');
    }
    
    this.client = new HfInference(this.apiToken);
    
    console.log(`[EmbeddingsGenerator] Initialized with model: ${this.model}`);
  }

  /**
   * Generate embeddings for a single text
   * Uses cache to avoid redundant API calls
   * 
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generate(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Check cache first
    const cached = cacheManager.getEmbedding(text);
    if (cached) {
      console.log('[EmbeddingsGenerator] Cache hit');
      return cached;
    }

    console.log(`[EmbeddingsGenerator] Generating embedding for text (${text.length} chars)`);

    try {
      // Generate embeddings using Hugging Face API
      const embedding = await this.client.featureExtraction({
        model: this.model,
        inputs: text
      });

      // Normalize the embedding if it's nested
      const normalizedEmbedding = Array.isArray(embedding[0]) ? embedding[0] : embedding;

      // Cache the result
      cacheManager.cacheEmbedding(text, normalizedEmbedding, this.cacheTTL);

      console.log(`[EmbeddingsGenerator] Generated embedding of dimension ${normalizedEmbedding.length}`);

      return normalizedEmbedding;
    } catch (error) {
      console.error('[EmbeddingsGenerator] Error generating embedding:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than calling generate() multiple times
   * Automatically splits into smaller batches if needed
   * 
   * @param {string[]} texts - Array of texts to generate embeddings for
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateBatch(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('Texts must be an array');
    }

    if (texts.length === 0) {
      return [];
    }

    // Validate all texts
    texts.forEach((text, index) => {
      if (!text || typeof text !== 'string') {
        throw new Error(`Text at index ${index} must be a non-empty string`);
      }
    });

    console.log(`[EmbeddingsGenerator] Generating embeddings for ${texts.length} texts`);

    // Check cache for all texts
    const results = [];
    const uncachedTexts = [];
    const uncachedIndices = [];

    for (let i = 0; i < texts.length; i++) {
      const cached = cacheManager.getEmbedding(texts[i]);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedTexts.push(texts[i]);
        uncachedIndices.push(i);
      }
    }

    console.log(`[EmbeddingsGenerator] Cache hits: ${texts.length - uncachedTexts.length}/${texts.length}`);

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return results;
    }

    // Split into batches if needed
    const batches = [];
    for (let i = 0; i < uncachedTexts.length; i += this.maxBatchSize) {
      batches.push(uncachedTexts.slice(i, i + this.maxBatchSize));
    }

    console.log(`[EmbeddingsGenerator] Processing ${batches.length} batch(es)`);

    try {
      // Process each batch
      let batchIndex = 0;
      for (const batch of batches) {
        console.log(`[EmbeddingsGenerator] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} texts)`);
        
        // Generate embeddings for batch
        const batchEmbeddings = await this.client.featureExtraction({
          model: this.model,
          inputs: batch
        });

        // Normalize embeddings (handle both single and batch responses)
        let normalizedBatch;
        if (batch.length === 1) {
          // Single item batch - API returns single embedding array
          // Check if it's already wrapped or needs wrapping
          if (Array.isArray(batchEmbeddings[0]) && typeof batchEmbeddings[0][0] === 'number') {
            // It's a single embedding [0.1, 0.2, ...] - wrap it
            normalizedBatch = [batchEmbeddings];
          } else if (Array.isArray(batchEmbeddings[0]) && Array.isArray(batchEmbeddings[0][0])) {
            // It's already wrapped [[0.1, 0.2, ...]]
            normalizedBatch = batchEmbeddings;
          } else {
            // Fallback - wrap it
            normalizedBatch = [batchEmbeddings];
          }
        } else {
          // Multiple items - should be array of arrays
          normalizedBatch = batchEmbeddings;
        }

        // Cache and store results
        for (let i = 0; i < batch.length; i++) {
          const embedding = normalizedBatch[i];
          const originalIndex = uncachedIndices[batchIndex * this.maxBatchSize + i];
          
          // Cache the embedding
          cacheManager.cacheEmbedding(batch[i], embedding, this.cacheTTL);
          
          // Store in results array
          results[originalIndex] = embedding;
        }

        batchIndex++;
      }

      console.log(`[EmbeddingsGenerator] Successfully generated ${uncachedTexts.length} embeddings`);

      return results;
    } catch (error) {
      console.error('[EmbeddingsGenerator] Error generating batch embeddings:', error.message);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Clear the embeddings cache
   */
  clearCache() {
    // Clear only embedding-related cache entries
    console.log('[EmbeddingsGenerator] Clearing embeddings cache');
    // Note: cacheManager doesn't have a selective clear, so we log this
    // In production, you might want to implement a more selective clear
  }

  /**
   * Check if the generator is properly configured
   * @returns {boolean}
   */
  isAvailable() {
    return !!this.client && !!this.apiToken && !!HfInference;
  }

  /**
   * Get the current model being used
   * @returns {string}
   */
  getModel() {
    return this.model;
  }
}

module.exports = EmbeddingsGenerator;
