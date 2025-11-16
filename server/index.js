require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./db');
const chatRoutes = require('./routes/chat');
const convRoutes = require('./routes/conversations');

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

  app.use('/api', chatRoutes);
  app.use('/api', convRoutes);

  app.get('/', (req,res) => res.send('MythAI backend'));

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

main().catch(err => {
  console.error('Fatal error starting server', err);
  process.exit(1);
});
