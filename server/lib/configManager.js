/**
 * Configuration Manager with Hot-Reload and Validation
 * Manages multi-model pipeline configuration with environment variable support
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class ConfigManager extends EventEmitter {
  constructor(configPath = null) {
    super();
    
    this.configPath = configPath || path.join(__dirname, '../config/multiModelPipeline.js');
    this.config = null;
    this.watchers = new Map();
    this.validationRules = this.defineValidationRules();
    this.lastModified = null;
    
    // Load initial configuration
    this.loadConfig();
    
    // Set up file watching for hot-reload
    this.setupFileWatcher();
    
    console.log('[ConfigManager] Initialized with hot-reload support');
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      // Clear require cache to get fresh config
      delete require.cache[require.resolve(this.configPath)];
      
      // Load the configuration
      this.config = require(this.configPath);
      
      // Validate configuration
      const validation = this.validateConfig(this.config);
      if (!validation.isValid) {
        console.error('[ConfigManager] Configuration validation failed:', validation.errors);
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Update last modified time
      const stats = fs.statSync(this.configPath);
      this.lastModified = stats.mtime;
      
      console.log('[ConfigManager] Configuration loaded and validated successfully');
      
      // Emit configuration loaded event
      this.emit('config_loaded', this.config);
      
    } catch (error) {
      console.error('[ConfigManager] Failed to load configuration:', error.message);
      
      // If this is the initial load, throw the error
      if (!this.config) {
        throw error;
      }
      
      // Otherwise, keep the existing configuration and emit error
      this.emit('config_error', error);
    }
  }

  /**
   * Set up file watcher for hot-reload
   */
  setupFileWatcher() {
    if (process.env.NODE_ENV === 'test') {
      // Skip file watching in test environment
      return;
    }

    try {
      const watcher = fs.watch(this.configPath, (eventType, filename) => {
        if (eventType === 'change') {
          console.log('[ConfigManager] Configuration file changed, reloading...');
          
          // Debounce rapid file changes
          setTimeout(() => {
            this.reloadConfig();
          }, 100);
        }
      });

      this.watchers.set(this.configPath, watcher);
      
      console.log('[ConfigManager] File watcher set up for hot-reload');
      
    } catch (error) {
      console.warn('[ConfigManager] Failed to set up file watcher:', error.message);
    }
  }

  /**
   * Reload configuration (hot-reload)
   */
  reloadConfig() {
    try {
      // Check if file was actually modified
      const stats = fs.statSync(this.configPath);
      if (this.lastModified && stats.mtime <= this.lastModified) {
        return; // No actual changes
      }

      const oldConfig = { ...this.config };
      this.loadConfig();
      
      // Emit configuration changed event
      this.emit('config_changed', {
        oldConfig,
        newConfig: this.config,
        timestamp: new Date()
      });
      
      console.log('[ConfigManager] Configuration hot-reloaded successfully');
      
    } catch (error) {
      console.error('[ConfigManager] Hot-reload failed:', error.message);
      this.emit('config_error', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get specific configuration section
   */
  getSection(sectionName) {
    if (!this.config) return null;
    return this.config.hasOwnProperty(sectionName) ? this.config[sectionName] : null;
  }

  /**
   * Get configuration value with dot notation
   */
  get(path, defaultValue = null) {
    if (!this.config) return defaultValue;
    
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value (runtime only, not persisted)
   */
  set(path, value) {
    if (!this.config) return false;
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    // Emit configuration changed event
    this.emit('config_value_changed', {
      path,
      oldValue,
      newValue: value,
      timestamp: new Date()
    });
    
    console.log(`[ConfigManager] Runtime configuration updated: ${path} = ${value}`);
    return true;
  }

  /**
   * Define validation rules for configuration
   */
  defineValidationRules() {
    return {
      thinker: {
        model: { type: 'string', required: true },
        maxTokens: { type: 'number', min: 100, max: 4000 },
        temperature: { type: 'number', min: 0, max: 2 },
        timeout: { type: 'number', min: 1000, max: 30000 },
        enabled: { type: 'boolean' }
      },
      speaker: {
        model: { type: 'string', required: true },
        maxTokens: { type: 'number', min: 100, max: 4000 },
        temperature: { type: 'number', min: 0, max: 2 },
        timeout: { type: 'number', min: 1000, max: 30000 },
        enabled: { type: 'boolean' }
      },
      vectorDB: {
        topK: { type: 'number', min: 1, max: 20 },
        scoreThreshold: { type: 'number', min: 0, max: 1 },
        embeddingModel: { type: 'string', required: true },
        embeddingCacheSize: { type: 'number', min: 10, max: 10000 },
        primaryBookBoost: { type: 'number', min: 1, max: 3 },
        secondaryBookBoost: { type: 'number', min: 0.5, max: 2 }
      },
      tts: {
        provider: { type: 'string', enum: ['elevenlabs', 'google', 'coqui'] },
        defaultStability: { type: 'number', min: 0, max: 1 },
        defaultSimilarity: { type: 'number', min: 0, max: 1 },
        defaultStyle: { type: 'number', min: 0, max: 1 },
        useSpeakerBoost: { type: 'boolean' },
        enabled: { type: 'boolean' }
      },
      pipeline: {
        enableTwoStage: { type: 'boolean' },
        enableFallback: { type: 'boolean' },
        maxRetries: { type: 'number', min: 0, max: 10 },
        retryDelay: { type: 'number', min: 100, max: 10000 },
        enableStreaming: { type: 'boolean' },
        maxConcurrentRequests: { type: 'number', min: 1, max: 100 },
        totalTimeout: { type: 'number', min: 5000, max: 60000 }
      },
      monitoring: {
        enabled: { type: 'boolean' },
        logTiming: { type: 'boolean' },
        logDebug: { type: 'boolean' },
        trackDegradation: { type: 'boolean' },
        degradationThreshold: { type: 'number', min: 1000, max: 30000 }
      },
      textProcessing: {
        targetReadabilityGrade: { type: 'number', min: 1, max: 20 },
        maxComplexityScore: { type: 'number', min: 0, max: 1 },
        enableFactVerification: { type: 'boolean' }
      }
    };
  }

  /**
   * Validate configuration against rules
   */
  validateConfig(config) {
    const errors = [];
    
    for (const [sectionName, sectionRules] of Object.entries(this.validationRules)) {
      const section = config[sectionName];
      
      if (!section) {
        errors.push(`Missing configuration section: ${sectionName}`);
        continue;
      }
      
      for (const [fieldName, rules] of Object.entries(sectionRules)) {
        const value = section[fieldName];
        const fieldPath = `${sectionName}.${fieldName}`;
        
        // Check required fields
        if (rules.required && (value === undefined || value === null)) {
          errors.push(`Required field missing: ${fieldPath}`);
          continue;
        }
        
        // Skip validation if value is undefined and not required
        if (value === undefined || value === null) {
          continue;
        }
        
        // Type validation
        if (rules.type) {
          const actualType = typeof value;
          if (actualType !== rules.type) {
            errors.push(`Invalid type for ${fieldPath}: expected ${rules.type}, got ${actualType}`);
            continue;
          }
        }
        
        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Invalid value for ${fieldPath}: must be one of [${rules.enum.join(', ')}]`);
        }
        
        // Number range validation
        if (rules.type === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`Value too small for ${fieldPath}: ${value} < ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`Value too large for ${fieldPath}: ${value} > ${rules.max}`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration status and health
   */
  getStatus() {
    return {
      loaded: !!this.config,
      lastModified: this.lastModified,
      watchersActive: this.watchers.size,
      validation: this.config ? this.validateConfig(this.config) : { isValid: false, errors: ['No configuration loaded'] }
    };
  }

  /**
   * Export current configuration to JSON
   */
  exportConfig() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      status: this.getStatus()
    };
  }

  /**
   * Get environment variable overrides
   */
  getEnvironmentOverrides() {
    const overrides = {};
    const envVars = process.env;
    
    // Map environment variables to configuration paths
    const envMappings = {
      'THINKER_MODEL': 'thinker.model',
      'THINKER_MAX_TOKENS': 'thinker.maxTokens',
      'THINKER_TEMPERATURE': 'thinker.temperature',
      'THINKER_TIMEOUT': 'thinker.timeout',
      'THINKER_ENABLED': 'thinker.enabled',
      'SPEAKER_MODEL': 'speaker.model',
      'SPEAKER_MAX_TOKENS': 'speaker.maxTokens',
      'SPEAKER_TEMPERATURE': 'speaker.temperature',
      'SPEAKER_TIMEOUT': 'speaker.timeout',
      'SPEAKER_ENABLED': 'speaker.enabled',
      'VECTOR_DB_TOP_K': 'vectorDB.topK',
      'VECTOR_DB_SCORE_THRESHOLD': 'vectorDB.scoreThreshold',
      'EMBEDDING_MODEL': 'vectorDB.embeddingModel',
      'EMBEDDING_CACHE_SIZE': 'vectorDB.embeddingCacheSize',
      'PRIMARY_BOOK_BOOST': 'vectorDB.primaryBookBoost',
      'SECONDARY_BOOK_BOOST': 'vectorDB.secondaryBookBoost',
      'TTS_PROVIDER': 'tts.provider',
      'TTS_DEFAULT_STABILITY': 'tts.defaultStability',
      'TTS_DEFAULT_SIMILARITY': 'tts.defaultSimilarity',
      'TTS_DEFAULT_STYLE': 'tts.defaultStyle',
      'TTS_USE_SPEAKER_BOOST': 'tts.useSpeakerBoost',
      'TTS_ENABLED': 'tts.enabled',
      'ENABLE_TWO_STAGE_PIPELINE': 'pipeline.enableTwoStage',
      'ENABLE_FALLBACK': 'pipeline.enableFallback',
      'MAX_RETRIES': 'pipeline.maxRetries',
      'RETRY_DELAY': 'pipeline.retryDelay',
      'ENABLE_STREAMING': 'pipeline.enableStreaming',
      'MAX_CONCURRENT_REQUESTS': 'pipeline.maxConcurrentRequests',
      'PIPELINE_TOTAL_TIMEOUT': 'pipeline.totalTimeout',
      'MONITORING_ENABLED': 'monitoring.enabled',
      'LOG_TIMING': 'monitoring.logTiming',
      'LOG_DEBUG': 'monitoring.logDebug',
      'TRACK_DEGRADATION': 'monitoring.trackDegradation',
      'DEGRADATION_THRESHOLD': 'monitoring.degradationThreshold',
      'TARGET_READABILITY_GRADE': 'textProcessing.targetReadabilityGrade',
      'MAX_COMPLEXITY_SCORE': 'textProcessing.maxComplexityScore',
      'ENABLE_FACT_VERIFICATION': 'textProcessing.enableFactVerification'
    };
    
    for (const [envVar, configPath] of Object.entries(envMappings)) {
      if (envVars[envVar] !== undefined) {
        overrides[configPath] = envVars[envVar];
      }
    }
    
    return overrides;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Close all file watchers
    for (const [path, watcher] of this.watchers) {
      try {
        watcher.close();
        console.log(`[ConfigManager] Closed file watcher for ${path}`);
      } catch (error) {
        console.warn(`[ConfigManager] Failed to close watcher for ${path}:`, error.message);
      }
    }
    
    this.watchers.clear();
    this.removeAllListeners();
    
    console.log('[ConfigManager] Cleanup complete');
  }
}

// Create singleton instance
const configManager = new ConfigManager();

// Handle process termination
process.on('SIGINT', () => {
  configManager.destroy();
});

process.on('SIGTERM', () => {
  configManager.destroy();
});

module.exports = configManager;
module.exports.ConfigManager = ConfigManager;