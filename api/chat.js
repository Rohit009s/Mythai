import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, deity, userId } = req.body;

    if (!message || !deity) {
      return res.status(400).json({ message: 'Message and deity are required' });
    }

    // Simple response for now - you can integrate with your AI services here
    const response = {
      message: `Greetings, dear seeker. I am ${deity}. Your message "${message}" has been received with divine wisdom.`,
      deity,
      timestamp: new Date().toISOString()
    };

    // Save conversation to database if userId provided
    if (userId) {
      await client.connect();
      const db = client.db(process.env.DB_NAME);
      const conversations = db.collection('conversations');

      await conversations.insertOne({
        userId,
        deity,
        userMessage: message,
        aiResponse: response.message,
        timestamp: new Date()
      });
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
}