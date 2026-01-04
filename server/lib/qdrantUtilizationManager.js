/**
 * Qdrant Utilization Manager
 * Ensures regular usage of Qdrant Cloud to prevent expiration
 * Integrates vector search into application workflows
 * Uses OpenRouter for LLM and ElevenLabs for TTS only
 */

const qdrantClient = require('./qdrantClient');
const qdrantCloud = require('./qdrantCloud');

class QdrantUtilizationManager {
  constructor() {
    this.stats = {
      totalSearches: 0,
      successfulSearches: 0,
      lastActivity: null,
      healthChecks: 0,
      errors: 0
    };
    
    this.isActive = false;
    this.healthCheckInterval = null;
    this.utilizationInterval = null;
  }

  /**
   * Start the utilization manager
   * Begins regular health checks and usage patterns
   */
  start() {
    if (this.isActive) {
      console.log('[QdrantUtil] Already active');
      return;
    }

    this.isActive = true;
    console.log('[QdrantUtil] Starting Qdrant utilization manager');

    // Health check every 30 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30 * 60 * 1000);

    // Utilization activity every 2 hours
    this.utilizationInterval = setInterval(() => {
      this.performUtilizationActivity();
    }, 2 * 60 * 60 * 1000);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Stop the utilization manager
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    console.log('[QdrantUtil] Stopping Qdrant utilization manager');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.utilizationInterval) {
      clearInterval(this.utilizationInterval);
      this.utilizationInterval = null;
    }
  }

  /**
   * Perform health check on Qdrant Cloud
   */
  async performHealthCheck() {
    try {
      console.log('[QdrantUtil] Performing health check...');
      
      const info = await qdrantCloud.getCollectionInfo();
      this.stats.healthChecks++;
      
      if (info && info.result) {
        const pointCount = info.result.points_count;
        const indexedCount = info.result.indexed_vectors_count;
        const status = info.result.status;
        
        console.log(`[QdrantUtil] ✅ Health check passed - Status: ${status}, Points: ${pointCount}, Indexed: ${indexedCount}`);
        this.stats.lastActivity = new Date();
        
        // Log utilization stats
        this.logUtilizationStats();
        
        return true;
      } else {
        console.warn('[QdrantUtil] ⚠️ Health check returned no data');
        return false;
      }
    } catch (error) {
      console.error('[QdrantUtil] ❌ Health check failed:', error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Perform utilization activities to keep database active
   */
  async performUtilizationActivity() {
    console.log('[QdrantUtil] Performing utilization activity...');
    
    const activities = [
      () => this.searchSpiritual(['wisdom', 'knowledge']),
      () => this.searchSpiritual(['dharma', 'duty']),
      () => this.searchSpiritual(['meditation', 'peace']),
      () => this.searchSpiritual(['love', 'devotion']),
      () => this.searchSpiritual(['truth', 'reality'])
    ];

    let successCount = 0;
    
    for (const activity of activities) {
      try {
        const success = await activity();
        if (success) successCount++;
        
        // Small delay between activities
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('[QdrantUtil] Activity failed:', error.message);
        this.stats.errors++;
      }
    }

    console.log(`[QdrantUtil] Utilization activity completed: ${successCount}/${activities.length} successful`);
    this.stats.lastActivity = new Date();
  }

  /**
   * Search for spiritual concepts
   */
  async searchSpiritual(concepts, filters = {}) {
    try {
      this.stats.totalSearches++;
      
      // Generate semantic embedding
      const embedding = this.generateSemanticEmbedding(concepts);
      
      // Perform search
      const results = await qdrantCloud.searchVectors(
        embedding,
        3,
        filters,
        0.1
      );

      if (results.length > 0) {
        this.stats.successfulSearches++;
        console.log(`[QdrantUtil] 🔍 ${concepts.join('+')} search: ${results.length} results`);
        return true;
      } else {
        console.log(`[QdrantUtil] 🔍 ${concepts.join('+')} search: no results`);
        return false;
      }
    } catch (error) {
      console.error(`[QdrantUtil] Search failed for ${concepts.join('+')}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Enhanced search for user queries
   * This method is called by the main application
   */
  async searchForUserQuery(query, options = {}) {
    try {
      this.stats.totalSearches++;
      
      const {
        persona = null,
        religion = null,
        language = 'en',
        topK = 5,
        scoreThreshold = 0.6
      } = options;

      // Build filters
      const filters = {};
      if (religion) filters.religion = religion;
      if (language) filters.language = language;
      if (persona) filters.deity_group = persona;

      // For now, use semantic embedding based on query keywords
      const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 3);
      const embedding = this.generateSemanticEmbedding(queryWords.slice(0, 5));

      // Search with filters
      const results = await qdrantCloud.searchVectors(
        embedding,
        topK,
        filters,
        scoreThreshold
      );

      if (results.length > 0) {
        this.stats.successfulSearches++;
        this.stats.lastActivity = new Date();
        
        console.log(`[QdrantUtil] 📖 User query search: ${results.length} results for "${query.substring(0, 50)}..."`);
        
        return results.map(result => ({
          text: result.payload?.text || '',
          score: result.score,
          book: result.payload?.book || '',
          religion: result.payload?.religion || '',
          language: result.payload?.language || '',
          metadata: result.payload || {}
        }));
      } else {
        console.log(`[QdrantUtil] 📖 User query search: no results for "${query.substring(0, 50)}..."`);
        return [];
      }
    } catch (error) {
      console.error('[QdrantUtil] User query search failed:', error.message);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Generate semantic embedding for concepts
   */
  generateSemanticEmbedding(concepts) {
    const embedding = new Array(384).fill(0);
    
    // Create semantic patterns for different concepts
    const conceptPatterns = {
      'dharma': [0.8, 0.6, 0.4, 0.7, 0.5],
      'krishna': [0.9, 0.7, 0.3, 0.8, 0.6],
      'buddha': [0.7, 0.8, 0.5, 0.6, 0.9],
      'wisdom': [0.6, 0.9, 0.7, 0.5, 0.8],
      'spiritual': [0.5, 0.7, 0.9, 0.6, 0.4],
      'duty': [0.8, 0.5, 0.6, 0.9, 0.7],
      'meditation': [0.4, 0.8, 0.7, 0.5, 0.9],
      'enlightenment': [0.7, 0.6, 0.8, 0.9, 0.5],
      'love': [0.9, 0.8, 0.6, 0.7, 0.5],
      'devotion': [0.8, 0.9, 0.5, 0.6, 0.7],
      'peace': [0.6, 0.7, 0.9, 0.8, 0.4],
      'truth': [0.7, 0.5, 0.8, 0.9, 0.6],
      'reality': [0.5, 0.6, 0.7, 0.8, 0.9],
      'knowledge': [0.8, 0.7, 0.6, 0.5, 0.9]
    };
    
    // Blend patterns based on concepts
    concepts.forEach((concept, idx) => {
      const pattern = conceptPatterns[concept.toLowerCase()] || [0.5, 0.5, 0.5, 0.5, 0.5];
      for (let i = 0; i < 384; i++) {
        const patternIdx = i % pattern.length;
        embedding[i] += pattern[patternIdx] * Math.sin(idx + i * 0.1) * 0.3;
      }
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Log utilization statistics
   */
  logUtilizationStats() {
    const successRate = this.stats.totalSearches > 0 
      ? ((this.stats.successfulSearches / this.stats.totalSearches) * 100).toFixed(1)
      : '0.0';

    console.log(`[QdrantUtil] 📊 Stats - Searches: ${this.stats.totalSearches}, Success: ${this.stats.successfulSearches} (${successRate}%), Health Checks: ${this.stats.healthChecks}, Errors: ${this.stats.errors}`);
    
    if (this.stats.lastActivity) {
      const timeSinceActivity = Date.now() - this.stats.lastActivity.getTime();
      const hoursSince = (timeSinceActivity / (1000 * 60 * 60)).toFixed(1);
      console.log(`[QdrantUtil] 🕒 Last activity: ${hoursSince} hours ago`);
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      isActive: this.isActive,
      successRate: this.stats.totalSearches > 0 
        ? ((this.stats.successfulSearches / this.stats.totalSearches) * 100).toFixed(1) + '%'
        : '0.0%'
    };
  }

  /**
   * Force a utilization activity (for testing)
   */
  async forceUtilization() {
    console.log('[QdrantUtil] Forcing utilization activity...');
    await this.performUtilizationActivity();
  }

  /**
   * Check if database is being utilized properly
   */
  isUtilizedProperly() {
    const recentActivity = this.stats.lastActivity && 
      (Date.now() - this.stats.lastActivity.getTime()) < (24 * 60 * 60 * 1000); // 24 hours
    
    const goodSuccessRate = this.stats.totalSearches > 0 && 
      (this.stats.successfulSearches / this.stats.totalSearches) > 0.1; // 10% success rate
    
    return recentActivity && goodSuccessRate;
  }
}

// Create singleton instance
const qdrantUtilizationManager = new QdrantUtilizationManager();

module.exports = qdrantUtilizationManager;