require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const convRoutes = require('./routes/conversations');
const mcpRoutes = require('./routes/mcp');
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/auth');

const PORT = process.env.PORT || 3000;

async function main(){
  const app = express();
  app.use(cors());
  app.use(express.json());

  try {
    await connectMongo();
  } catch (err) {
    console.warn('MongoDB connection failed (running in demo mode):', err.message);
  }

  // Public routes (no auth required)
  app.use('/api/auth', authRoutes);
  app.use('/api/mcp', mcpRoutes); // MCP API routes
  
  // Protected routes (optional auth for demo mode)
  app.use('/api/chat', optionalAuthMiddleware, chatRoutes);
  app.use('/api/conversations', optionalAuthMiddleware, convRoutes);

  app.get('/', (req,res) => res.send('MythAI backend with Auth'));
  
  app.get('/health', (req,res) => res.json({ status: 'ok', timestamp: new Date() }));

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

main().catch(err => {
  console.error('Fatal error starting server', err);
  process.exit(1);
});
