// Production Configuration for Spirit AI
// Handles external data loading and fallbacks

const config = {
  // Data sources in production
  dataSources: {
    personas: 'local', // Small JSON files, keep local
    embeddings: 'qdrant', // Use Qdrant Cloud
    texts: 'external', // Load from CDN or external API
    voices: 'elevenlabs' // Use ElevenLabs API
  },

  // External URLs for data (if needed)
  externalUrls: {
    textsApi: process.env.TEXTS_API_URL || null,
    cdnBase: process.env.CDN_BASE_URL || null
  },

  // Fallback configurations
  fallbacks: {
    useEssentialPersonas: true,
    useEssentialTexts: true,
    enableCaching: true,
    cacheTimeout: 3600000 // 1 hour
  },

  // Performance optimizations
  performance: {
    enableCompression: true,
    enableCaching: true,
    maxCacheSize: 50, // MB
    lazyLoadData: true
  },

  // Feature flags for production
  features: {
    enableVoice: process.env.ELEVENLABS_API_KEY ? true : false,
    enableEmbeddings: process.env.QDRANT_API_KEY ? true : false,
    enableFullTexts: process.env.TEXTS_API_URL ? true : false,
    enableMCP: false // Disable MCP in production
  },

  // Deployment info
  deployment: {
    platform: 'vercel',
    maxSize: '100MB',
    currentSize: '~78MB',
    optimized: true,
    dataStrategy: 'external'
  }
};

module.exports = config;