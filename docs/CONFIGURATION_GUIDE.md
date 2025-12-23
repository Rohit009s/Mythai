# MythAI Multi-Model Pipeline Configuration Guide

## Overview

This guide covers all configuration options for the MythAI Multi-Model Pipeline system. The system uses a hierarchical configuration approach with environment variables, configuration files, and runtime settings.

## Configuration Hierarchy

Configuration is loaded in the following order (later sources override earlier ones):

1. **Default Values** (hardcoded in configuration files)
2. **Configuration Files** (`server/config/*.js`)
3. **Environment Variables** (`.env` file or system environment)
4. **Runtime Configuration** (hot-reloadable settings)

## Environment Variables

### Core System Configuration

```bash
# Application Environment
NODE_ENV=production                    # Environment: development, production, test
PORT=3000                             # Server port
LOG_LEVEL=info                        # Logging level: debug, info, warn, error

# JWT Authentication
JWT_SECRET=your-super-secret-key      # JWT signing secret (change in production!)
JWT_EXPIRES_IN=24h                    # Token expiration time

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60             # Requests per minute per user
RATE_LIMIT_WINDOW_MS=60000           # Rate limit window in milliseconds
```

### Database Configuration

```bash
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/mythai    # MongoDB connection string
DB_NAME=mythai                               # Database name
MONGO_OPTIONS={}                             # Additional MongoDB options (JSON)

# Vector Database (Qdrant)
QDRANT_URL=http://localhost:6333             # Qdrant server URL
QDRANT_API_KEY=your-qdrant-api-key          # Qdrant API key (for cloud)
QDRANT_COLLECTION=myth_texts_384             # Collection name
VECTOR_DIM=384                               # Vector dimensions (must match embedding model)
```

### Multi-Model Pipeline Configuration

```bash
# Pipeline Control
ENABLE_TWO_STAGE_PIPELINE=true              # Enable/disable two-stage processing
ENABLE_FALLBACK=true                        # Enable fallback to single-stage
PIPELINE_TOTAL_TIMEOUT=10000                # Total pipeline timeout (ms)
MAX_CONCURRENT_REQUESTS=10                  # Maximum concurrent pipeline requests

# Thinker Model (Stage 1)
THINKER_MODEL=mistralai/Mistral-7B-Instruct-v0.2    # Hugging Face model ID
THINKER_MAX_TOKENS=1000                     # Maximum tokens to generate
THINKER_TEMPERATURE=0.3                     # Temperature (0.0-1.0, lower = more factual)
THINKER_TIMEOUT=5000                        # Request timeout (ms)
THINKER_ENABLED=true                        # Enable/disable Thinker stage

# Speaker Model (Stage 2)
SPEAKER_MODEL=meta-llama/Llama-3.1-8B-Instruct     # Hugging Face model ID
SPEAKER_MAX_TOKENS=1500                     # Maximum tokens to generate
SPEAKER_TEMPERATURE=0.7                     # Temperature (0.0-1.0, higher = more creative)
SPEAKER_TIMEOUT=5000                        # Request timeout (ms)
SPEAKER_ENABLED=true                        # Enable/disable Speaker stage
```

### External API Configuration

```bash
# Hugging Face Inference API
HUGGINGFACE_API_TOKEN=hf_your_token_here    # Hugging Face API token
HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co    # API base URL
HUGGINGFACE_TIMEOUT=10000                   # Request timeout (ms)

# ElevenLabs TTS
ELEVENLABS_API_KEY=sk_your_key_here         # ElevenLabs API key
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1    # API base URL
ELEVENLABS_TIMEOUT=15000                    # Request timeout (ms)

# Alternative TTS Providers
TTS_PROVIDER=elevenlabs                     # TTS provider: elevenlabs, google, coqui
TTS_SERVICE_URL=http://localhost:8000       # Local TTS service URL
```

### Vector Search Configuration

```bash
# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2    # Embedding model ID
EMBEDDING_CACHE_SIZE=1000                   # Cache size for embeddings
EMBEDDING_BATCH_SIZE=32                     # Batch size for embedding generation

# Search Parameters
VECTOR_DB_TOP_K=5                          # Number of top results to retrieve
VECTOR_DB_SCORE_THRESHOLD=0.6              # Minimum similarity score (0.0-1.0)
PRIMARY_BOOK_BOOST=1.5                     # Score boost for primary books
SECONDARY_BOOK_BOOST=1.0                   # Score boost for secondary books
```

### Performance and Monitoring

```bash
# Performance Settings
MAX_RETRIES=3                              # Maximum API call retries
RETRY_DELAY=1000                           # Initial retry delay (ms)
ENABLE_STREAMING=false                     # Enable streaming between stages
DEGRADATION_THRESHOLD=8000                 # Performance degradation threshold (ms)

# Monitoring
MONITORING_ENABLED=true                    # Enable performance monitoring
LOG_TIMING=true                           # Log timing for each stage
LOG_DEBUG=false                           # Enable debug logging
TRACK_DEGRADATION=true                    # Track performance degradation
```

### TTS Configuration

```bash
# TTS Settings
TTS_ENABLED=true                          # Enable/disable TTS generation
TTS_DEFAULT_STABILITY=0.5                 # Default voice stability (0.0-1.0)
TTS_DEFAULT_SIMILARITY=0.75               # Default voice similarity (0.0-1.0)
TTS_DEFAULT_STYLE=0.5                     # Default voice style (0.0-1.0)
TTS_USE_SPEAKER_BOOST=true                # Enable speaker boost
```

## Configuration Files

### Multi-Model Pipeline Configuration

**File**: `server/config/multiModelPipeline.js`

```javascript
module.exports = {
  // Thinker Model Configuration (Stage 1)
  thinker: {
    model: process.env.THINKER_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
    maxTokens: parseInt(process.env.THINKER_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.THINKER_TEMPERATURE) || 0.3,
    timeout: parseInt(process.env.THINKER_TIMEOUT) || 5000,
    enabled: process.env.THINKER_ENABLED !== 'false'
  },

  // Speaker Model Configuration (Stage 2)
  speaker: {
    model: process.env.SPEAKER_MODEL || 'meta-llama/Llama-3.1-8B-Instruct',
    maxTokens: parseInt(process.env.SPEAKER_MAX_TOKENS) || 1500,
    temperature: parseFloat(process.env.SPEAKER_TEMPERATURE) || 0.7,
    timeout: parseInt(process.env.SPEAKER_TIMEOUT) || 5000,
    enabled: process.env.SPEAKER_ENABLED !== 'false'
  },

  // Vector Database Configuration
  vectorDB: {
    topK: parseInt(process.env.VECTOR_DB_TOP_K) || 5,
    scoreThreshold: parseFloat(process.env.VECTOR_DB_SCORE_THRESHOLD) || 0.6,
    embeddingModel: process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
    embeddingCacheSize: parseInt(process.env.EMBEDDING_CACHE_SIZE) || 1000,
    primaryBookBoost: parseFloat(process.env.PRIMARY_BOOK_BOOST) || 1.5,
    secondaryBookBoost: parseFloat(process.env.SECONDARY_BOOK_BOOST) || 1.0
  },

  // Pipeline Configuration
  pipeline: {
    enableTwoStage: process.env.ENABLE_TWO_STAGE_PIPELINE !== 'false',
    enableFallback: process.env.ENABLE_FALLBACK !== 'false',
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
    enableStreaming: process.env.ENABLE_STREAMING === 'true',
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 10,
    totalTimeout: parseInt(process.env.PIPELINE_TOTAL_TIMEOUT) || 10000
  },

  // Text-to-Speech Configuration
  tts: {
    provider: process.env.TTS_PROVIDER || 'elevenlabs',
    defaultStability: parseFloat(process.env.TTS_DEFAULT_STABILITY) || 0.5,
    defaultSimilarity: parseFloat(process.env.TTS_DEFAULT_SIMILARITY) || 0.75,
    defaultStyle: parseFloat(process.env.TTS_DEFAULT_STYLE) || 0.5,
    useSpeakerBoost: process.env.TTS_USE_SPEAKER_BOOST !== 'false',
    enabled: process.env.TTS_ENABLED !== 'false'
  },

  // Performance Monitoring
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    logTiming: process.env.LOG_TIMING !== 'false',
    logDebug: process.env.LOG_DEBUG === 'true',
    trackDegradation: process.env.TRACK_DEGRADATION !== 'false',
    degradationThreshold: parseInt(process.env.DEGRADATION_THRESHOLD) || 8000
  },

  // Text Processing
  textProcessing: {
    targetReadabilityGrade: parseInt(process.env.TARGET_READABILITY_GRADE) || 8,
    maxComplexityScore: parseFloat(process.env.MAX_COMPLEXITY_SCORE) || 0.7,
    enableFactVerification: process.env.ENABLE_FACT_VERIFICATION !== 'false'
  }
};
```

### Deity Personalities Configuration

**File**: `server/config/deityPersonalities.js`

```javascript
module.exports = {
  krishna: {
    name: "Krishna",
    tradition: "hindu",
    personality: {
      tone: "wise_playful",
      style: "conversational",
      traits: ["compassionate", "wise", "playful", "loving"]
    },
    voiceSettings: {
      voiceId: "JBFqnCBsd6RMkjVY5Cd5",
      stability: 0.5,
      similarity: 0.75,
      style: 0.6
    },
    books: ["Bhagavad Gita", "Bhagavata Purana", "Mahabharata"],
    language: {
      complexity: "moderate",
      formality: "informal",
      modernization: "high"
    }
  },
  
  // Add more deities...
};
```

### Religion and Book Mapping

**File**: `server/config/religionMapping.js`

```javascript
module.exports = {
  hindu: {
    name: "Hinduism",
    deities: {
      krishna: {
        name: "Krishna",
        primaryBooks: ["Bhagavad Gita", "Bhagavata Purana"],
        secondaryBooks: ["Mahabharata", "Vishnu Purana"],
        group: "krishna"
      },
      rama: {
        name: "Rama",
        primaryBooks: ["Ramayana"],
        secondaryBooks: ["Vishnu Purana"],
        group: "rama"
      }
      // Add more Hindu deities...
    }
  },
  
  greek: {
    name: "Greek Mythology",
    deities: {
      zeus: {
        name: "Zeus",
        primaryBooks: ["Iliad", "Odyssey"],
        secondaryBooks: ["Theogony", "Works and Days"],
        group: "zeus"
      }
      // Add more Greek deities...
    }
  }
  
  // Add more religions...
};
```

## Runtime Configuration

### Hot-Reloadable Settings

The system supports hot-reloading of certain configuration changes without restart:

```javascript
// Update pipeline timeout
await configManager.updateConfig('pipeline.totalTimeout', 15000);

// Update model temperature
await configManager.updateConfig('thinker.temperature', 0.2);

// Update TTS settings
await configManager.updateConfig('tts.defaultStability', 0.6);
```

### Configuration API

Access configuration via REST API:

```bash
# Get current configuration
GET /api/config

# Update configuration
PUT /api/config
{
  "pipeline.totalTimeout": 15000,
  "thinker.temperature": 0.2
}

# Reset to defaults
POST /api/config/reset
```

## Environment-Specific Configurations

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
LOG_DEBUG=true

# Use local services
MONGO_URI=mongodb://localhost:27017/mythai_dev
QDRANT_URL=http://localhost:6333

# Faster timeouts for development
PIPELINE_TOTAL_TIMEOUT=5000
THINKER_TIMEOUT=3000
SPEAKER_TIMEOUT=3000

# Disable TTS for faster testing
TTS_ENABLED=false

# Enable streaming for testing
ENABLE_STREAMING=true
```

### Testing Environment

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error

# Use test database
MONGO_URI=mongodb://localhost:27017/mythai_test
QDRANT_COLLECTION=myth_texts_test

# Shorter timeouts for tests
PIPELINE_TOTAL_TIMEOUT=3000
THINKER_TIMEOUT=2000
SPEAKER_TIMEOUT=2000

# Disable external services
TTS_ENABLED=false
MONITORING_ENABLED=false

# Use mock APIs
USE_MOCK_HUGGINGFACE=true
USE_MOCK_ELEVENLABS=true
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info

# Production databases
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/mythai
QDRANT_URL=https://your-cluster.qdrant.tech
QDRANT_API_KEY=your-production-api-key

# Production timeouts
PIPELINE_TOTAL_TIMEOUT=10000
THINKER_TIMEOUT=5000
SPEAKER_TIMEOUT=5000

# Enable all features
TTS_ENABLED=true
MONITORING_ENABLED=true
TRACK_DEGRADATION=true

# Production security
JWT_SECRET=your-super-secure-production-secret
RATE_LIMIT_PER_MINUTE=30

# Performance optimization
EMBEDDING_CACHE_SIZE=5000
MAX_CONCURRENT_REQUESTS=20
```

## Advanced Configuration

### Custom Model Configuration

Add support for new models:

```javascript
// server/config/customModels.js
module.exports = {
  customThinker: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1,
    maxTokens: 2000
  },
  
  customSpeaker: {
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.8,
    maxTokens: 3000
  }
};
```

### Load Balancing Configuration

```javascript
// server/config/loadBalancing.js
module.exports = {
  huggingface: {
    endpoints: [
      'https://api-inference.huggingface.co',
      'https://api-inference-eu.huggingface.co'
    ],
    strategy: 'round-robin', // round-robin, least-connections, random
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000
    }
  }
};
```

### Caching Configuration

```javascript
// server/config/caching.js
module.exports = {
  embeddings: {
    type: 'memory', // memory, redis, file
    maxSize: 1000,
    ttl: 3600000 // 1 hour
  },
  
  responses: {
    type: 'redis',
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    ttl: 300000 // 5 minutes
  }
};
```

## Configuration Validation

### Schema Validation

The system validates configuration on startup:

```javascript
// server/lib/configValidator.js
const configSchema = {
  type: 'object',
  properties: {
    thinker: {
      type: 'object',
      properties: {
        model: { type: 'string', minLength: 1 },
        temperature: { type: 'number', minimum: 0, maximum: 1 },
        maxTokens: { type: 'integer', minimum: 1, maximum: 4000 }
      },
      required: ['model', 'temperature', 'maxTokens']
    },
    // ... more schema definitions
  },
  required: ['thinker', 'speaker', 'pipeline']
};
```

### Environment Variable Validation

```bash
# Required environment variables check
if [ -z "$MONGO_URI" ]; then
  echo "Error: MONGO_URI is required"
  exit 1
fi

if [ -z "$HUGGINGFACE_API_TOKEN" ]; then
  echo "Error: HUGGINGFACE_API_TOKEN is required"
  exit 1
fi
```

## Configuration Best Practices

### Security
1. **Never commit secrets to version control**
2. **Use environment variables for sensitive data**
3. **Rotate API keys regularly**
4. **Use different secrets for each environment**

### Performance
1. **Tune timeouts based on your infrastructure**
2. **Adjust cache sizes based on available memory**
3. **Monitor and adjust concurrency limits**
4. **Use appropriate temperature settings for each model**

### Reliability
1. **Enable fallback mechanisms**
2. **Set reasonable retry limits**
3. **Configure health checks**
4. **Monitor configuration drift**

### Maintainability
1. **Document all configuration changes**
2. **Use consistent naming conventions**
3. **Group related settings together**
4. **Validate configuration on startup**

## Troubleshooting Configuration Issues

### Common Problems

1. **Pipeline not starting**
   - Check `ENABLE_TWO_STAGE_PIPELINE` setting
   - Verify model names are correct
   - Check API token validity

2. **Slow response times**
   - Increase timeout values
   - Reduce `maxTokens` settings
   - Check network connectivity

3. **High error rates**
   - Verify API quotas and limits
   - Check model availability
   - Review retry settings

4. **Memory issues**
   - Reduce cache sizes
   - Lower concurrent request limits
   - Check for memory leaks

### Configuration Debugging

```bash
# Check current configuration
curl http://localhost:3000/api/config

# Validate configuration
npm run config:validate

# Test configuration changes
npm run config:test

# Reset to defaults
npm run config:reset
```

## Migration Guide

### Upgrading from v1.x to v2.x

1. **Update environment variables**:
   ```bash
   # Old format
   USE_TWO_STAGE_LLM=true
   
   # New format
   ENABLE_TWO_STAGE_PIPELINE=true
   ```

2. **Update configuration files**:
   - Rename `twoStageLLM.js` to `multiModelPipeline.js`
   - Update model configuration structure
   - Add new TTS configuration options

3. **Update API calls**:
   - New pipeline status endpoint
   - Updated response format with metadata
   - New MCP endpoints

For detailed migration instructions, see [MIGRATION.md](./MIGRATION.md).

---

This configuration guide covers all aspects of configuring the MythAI Multi-Model Pipeline. For additional help, refer to the [Developer Guide](./DEVELOPER_GUIDE.md) or [Troubleshooting Guide](./TROUBLESHOOTING.md).