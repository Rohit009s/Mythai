require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
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
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/auth');
const metricsCollector = require('./lib/metricsCollector');
const { getMCPClient } = require('./lib/mcpClient');
const conversationMemory = require('./lib/conversationMemory');
const qdrantUtilizationManager = require('./lib/qdrantUtilizationManager');

// Make metrics collector globally available
global.metricsCollector = metricsCollector;

const PORT = process.env.PORT || 3000;

async function main(){
  const app = express();
  const server = http.createServer(app);
  
  app.use(cors());
  app.use(express.json());

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
  
  // Protected routes (optional auth for demo mode)
  app.use('/api/chat', optionalAuthMiddleware, chatRoutes);
  app.use('/api/conversations', optionalAuthMiddleware, convRoutes);
  app.use('/api/memory', optionalAuthMiddleware, memoryRoutes); // 🧠 Memory API routes
  app.use('/api/call', optionalAuthMiddleware, callRoutes); // 📞 Call API routes

  app.get('/', (req,res) => res.send('MythAI backend with Auth'));
  
  app.get('/health', (req,res) => res.json({ status: 'ok', timestamp: new Date() }));
  
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

  // Start server
  server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
    console.log(`🎤 Voice streaming available at ws://localhost:${PORT}/voice-stream`);
  });
}

main().catch(err => {
  console.error('Fatal error starting server', err);
  process.exit(1);
});
