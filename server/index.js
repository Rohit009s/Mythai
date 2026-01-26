// Load environment variables (Vercel handles this automatically)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
}
const express = require('express');
const cors = require('cors');
const http = require('http');
const { connectMongo } = require('./db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const convRoutes = require('./routes/conversations');
const mcpRoutes = require('./routes/mcp');
const memoryRoutes = require('./routes/memory');
const callRoutes = require('./routes/call');
const statusRoutes = require('./routes/status');
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/auth');
const metricsCollector = require('./lib/metricsCollector');
const { getMCPClient } = require('./lib/mcpClient');
const conversationMemory = require('./lib/conversationMemory');
const qdrantUtilizationManager = require('./lib/qdrantUtilizationManager');
const externalDataLoader = require('./lib/externalDataLoader');
const productionConfig = require('./config/productionConfig');

// Make metrics collector globally available
global.metricsCollector = metricsCollector;

// Make external data loader globally available
global.externalDataLoader = externalDataLoader;

const PORT = process.env.PORT || 3000;

async function main(){
  const app = express();
  const server = http.createServer(app);
  
  // Configure CORS for production
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://spirit-ai-psi.vercel.app', 'https://spirit-ai-backend.onrender.com']
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());

  // Serve static files from frontend build
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, 'public')));
  }

  try {
    await connectMongo();
    
    // 🧠 Initialize conversation memory system indexes
    await conversationMemory.initializeIndexes();
    console.log('[Memory] Conversation memory system initialized');
  } catch (err) {
    console.warn('MongoDB connection failed (running in demo mode):', err.message);
  }

  // Initialize MCP client
  try {
    const mcpClient = await getMCPClient();
    console.log('[MCP] Client initialization completed');
  } catch (err) {
    console.warn('[MCP] Client initialization failed:', err.message);
  }

  // 🔍 Initialize Qdrant Utilization Manager
  qdrantUtilizationManager.start();
  console.log('[QdrantUtil] Vector database utilization manager started');

  // Public routes (no auth required)
  app.use('/api/auth', authRoutes);
  app.use('/api/mcp', mcpRoutes); // MCP API routes
  app.use('/api/status', statusRoutes); // Status and deployment info
  
  // Protected routes (optional auth for demo mode)
  app.use('/api/chat', optionalAuthMiddleware, chatRoutes);
  app.use('/api/conversations', optionalAuthMiddleware, convRoutes);
  app.use('/api/memory', optionalAuthMiddleware, memoryRoutes); // 🧠 Memory API routes
  app.use('/api/call', optionalAuthMiddleware, callRoutes); // 📞 Call API routes

  app.get('/', (req,res) => {
    if (process.env.NODE_ENV === 'production') {
      const path = require('path');
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
      res.send('Spirit AI backend with Auth - Development Mode');
    }
  });
  
  app.get('/health', (req,res) => res.json({ status: 'ok', timestamp: new Date() }));

  // Catch-all handler for frontend routes (SPA)
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      const path = require('path');
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }
  
  // Metrics endpoint
  app.get('/api/metrics', (req, res) => {
    try {
      const metrics = metricsCollector.getMetrics();
      const qdrantStats = qdrantUtilizationManager.getStats();
      
      res.json({
        ...metrics,
        qdrant: qdrantStats
      });
    } catch (error) {
      console.error('[Metrics] Error getting metrics:', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  // Start server (always start in production on Render)
  const actualPort = process.env.PORT || PORT;
  server.listen(actualPort, '0.0.0.0', () => {
    console.log(`🚀 Spirit AI Server listening on port ${actualPort}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎤 Voice streaming available at ws://localhost:${actualPort}/voice-stream`);
  });

  // Return app for testing
  return app;
}

// Initialize the app
if (require.main === module) {
  // Direct execution
  main().catch(err => {
    console.error('Fatal error starting server', err);
    process.exit(1);
  });
} else {
  // Module export for testing
  module.exports = main;
}
