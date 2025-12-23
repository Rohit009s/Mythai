/**
 * Cache Manager with LRU Cache and TTL
 * Caches embeddings, search results, and LLM responses
 */

class CacheManager {
  constructor(maxSize = 1000, defaultTTL = 3600000) { // 1 hour default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  // Generate cache key
  generateKey(prefix, data) {
    if (typeof data === 'string') {
      return `${prefix}:${data}`;
    }
    return `${prefix}:${JSON.stringify(data)}`;
  }

  // Set cache entry
  set(key, value, ttl = this.defaultTTL) {
    // Remove if exists (to update access order)
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }

    // Add new entry
    const entry = {
      value,
      expires: Date.now() + ttl,
      created: Date.now()
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.stats.sets++;

    return true;
  }

  // Get cache entry
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.stats.misses++;
      return null;
    }

    // Update access order (LRU)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
    this.stats.hits++;

    return entry.value;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key) {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    console.log('[Cache] Cleared all entries');
  }

  // Clear expired entries
  clearExpired() {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[Cache] Cleared ${cleared} expired entries`);
    }

    return cleared;
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      ...this.stats
    };
  }

  // Cache embeddings
  cacheEmbedding(text, embedding, ttl = 86400000) { // 24 hours
    const key = this.generateKey('embedding', text);
    return this.set(key, embedding, ttl);
  }

  // Get cached embedding
  getEmbedding(text) {
    const key = this.generateKey('embedding', text);
    return this.get(key);
  }

  // Cache search results
  cacheSearchResults(query, filters, results, ttl = 3600000) { // 1 hour
    const key = this.generateKey('search', { query, filters });
    return this.set(key, results, ttl);
  }

  // Get cached search results
  getSearchResults(query, filters) {
    const key = this.generateKey('search', { query, filters });
    return this.get(key);
  }

  // Cache LLM response
  cacheLLMResponse(prompt, response, ttl = 1800000) { // 30 minutes
    const key = this.generateKey('llm', prompt);
    return this.set(key, response, ttl);
  }

  // Get cached LLM response
  getLLMResponse(prompt) {
    const key = this.generateKey('llm', prompt);
    return this.get(key);
  }

  // Cache classification result
  cacheClassification(message, result, ttl = 3600000) { // 1 hour
    const key = this.generateKey('classification', message);
    return this.set(key, result, ttl);
  }

  // Get cached classification
  getClassification(message) {
    const key = this.generateKey('classification', message);
    return this.get(key);
  }

  // Cache persona config
  cachePersona(personaName, config, ttl = 86400000) { // 24 hours
    const key = this.generateKey('persona', personaName);
    return this.set(key, config, ttl);
  }

  // Get cached persona
  getPersona(personaName) {
    const key = this.generateKey('persona', personaName);
    return this.get(key);
  }

  // Start periodic cleanup
  startCleanup(interval = 300000) { // 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, interval);
    console.log('[Cache] Started periodic cleanup');
  }

  // Stop periodic cleanup
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      console.log('[Cache] Stopped periodic cleanup');
    }
  }

  // Warm up cache with common queries
  async warmUp(commonQueries = []) {
    console.log('[Cache] Warming up cache...');
    // This would be called with common queries to pre-populate cache
    // Implementation depends on your specific needs
  }
}

// Singleton instance
const cacheManager = new CacheManager(1000, 3600000);

// Start periodic cleanup
cacheManager.startCleanup();

// Graceful shutdown
process.on('SIGINT', () => {
  cacheManager.stopCleanup();
});

module.exports = cacheManager;
