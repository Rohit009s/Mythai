const { MongoClient } = require('mongodb');
let client;
let db;

async function connectMongo(){
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'mythai';
  
  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB', uri, dbName);
  }
  
  return { client, db };
}

function getDb(){
  if(!db) {
    // Return in-memory mock for demo mode
    return {
      collection: (name) => ({
        updateOne: async () => ({ modifiedCount: 1 }),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: 'demo' })
      })
    };
  }
  return db;
}

module.exports = { connectMongo, getDb };
