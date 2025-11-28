/**
 * MiniLM-L6-v2 Embeddings Client
 * Free, semantic embeddings using sentence-transformers
 * 384-dimensional vectors, perfect for RAG
 * 
 * Installation:
 * npm install @xenova/transformers
 * 
 * Model: sentence-transformers/all-MiniLM-L6-v2
 * - Free, open-source
 * - 384 dimensions
 * - Fast inference (~50ms per sentence)
 * - Good for semantic search
 */

let pipeline = null;
let model = null;

/**
 * Initialize the MiniLM model
 */
async function initModel() {
  if (model) return model;
  
  try {
    // Use Xenova's transformers.js for browser/Node.js compatibility
    const { pipeline: createPipeline } = require('@xenova/transformers');
    
    console.log('[MiniLM] Loading sentence-transformers/all-MiniLM-L6-v2...');
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    model = pipeline;
    console.log('[MiniLM] Model loaded successfully');
    
    return model;
  } catch (error) {
    console.error('[MiniLM] Failed to load model:', error.message);
    console.log('[MiniLM] Install with: npm install @xenova/transformers');
    return null;
  }
}

/**
 * Generate embeddings using MiniLM-L6-v2
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 384-dimensional embedding vector
 */
async function embedText(text) {
  if (!model) {
    await initModel();
  }
  
  if (!model) {
    throw new Error('MiniLM model not available. Install with: npm install @xenova/transformers');
  }
  
  try {
    // Generate embedding
    const output = await pipeline(text, { pooling: 'mean', normalize: true });
    
    // Convert to array
    const embedding = Array.from(output.data);
    
    return embedding;
  } catch (error) {
    console.error('[MiniLM] Embedding generation failed:', error.message);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function embedBatch(texts) {
  if (!model) {
    await initModel();
  }
  
  if (!model) {
    throw new Error('MiniLM model not available');
  }
  
  const embeddings = [];
  
  for (const text of texts) {
    const embedding = await embedText(text);
    embeddings.push(embedding);
  }
  
  return embeddings;
}

/**
 * Check if MiniLM is available
 */
function isAvailable() {
  try {
    require.resolve('@xenova/transformers');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get model info
 */
function getModelInfo() {
  return {
    name: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 384,
    maxTokens: 256,
    provider: 'Xenova/transformers.js',
    cost: 'Free',
    speed: 'Fast (~50ms per sentence)',
  };
}

module.exports = {
  embedText,
  embedBatch,
  initModel,
  isAvailable,
  getModelInfo,
};
