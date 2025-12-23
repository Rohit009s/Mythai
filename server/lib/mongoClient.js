/**
 * Enhanced MongoDB Client with Connection Pooling and Error Handling
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'mythai';

class MongoDBClient {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  // Connect with retry logic
  async connect(retries = 3) {
    if (this.isConnected) return this.db;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[MongoDB] Connecting... (attempt ${attempt}/${retries})`);
        
        this.client = new MongoClient(MONGO_URI, {
          maxPoolSize: 10,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });

        await this.client.connect();
        this.db = this.client.db(DB_NAME);
        this.isConnected = true;
        
        console.log('[MongoDB] Connected successfully');
        
        // Create indexes
        await this.createIndexes();
        
        return this.db;
        
      } catch (error) {
        console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`MongoDB connection failed after ${retries} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  // Create necessary indexes
  async createIndexes() {
    try {
      // Users collection indexes
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ username: 1 }, { unique: true });
      
      // Messages collection indexes
      await this.db.collection('messages').createIndex({ conversation_id: 1, timestamp: -1 });
      await this.db.collection('messages').createIndex({ user_id: 1, timestamp: -1 });
      
      // Conversations collection indexes
      await this.db.collection('conversations').createIndex({ user_id: 1, updated_at: -1 });
      await this.db.collection('conversations').createIndex({ persona: 1 });
      
      console.log('[MongoDB] Indexes created');
    } catch (error) {
      console.error('[MongoDB] Index creation error:', error.message);
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = await this.db.collection('users').findOne({ _id: userId });
      return user;
    } catch (error) {
      console.error('[MongoDB] getUserProfile error:', error.message);
      throw error;
    }
  }

  // Create or update user
  async upsertUser(userId, userData) {
    try {
      const result = await this.db.collection('users').updateOne(
        { _id: userId },
        { 
          $set: {
            ...userData,
            updated_at: new Date()
          },
          $setOnInsert: {
            created_at: new Date()
          }
        },
        { upsert: true }
      );
      return result;
    } catch (error) {
      console.error('[MongoDB] upsertUser error:', error.message);
      throw error;
    }
  }

  // Save message
  async saveMessage(messageData) {
    try {
      const message = {
        ...messageData,
        timestamp: new Date(),
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      await this.db.collection('messages').insertOne(message);
      
      // Update conversation last message
      if (messageData.conversation_id) {
        await this.db.collection('conversations').updateOne(
          { _id: messageData.conversation_id },
          {
            $set: {
              last_message: message.text,
              updated_at: new Date()
            },
            $inc: { message_count: 1 }
          },
          { upsert: true }
        );
      }
      
      return message;
    } catch (error) {
      console.error('[MongoDB] saveMessage error:', error.message);
      throw error;
    }
  }

  // Get conversation context
  async getConversationContext(conversationId, maxMessages = 10) {
    try {
      const messages = await this.db.collection('messages')
        .find({ conversation_id: conversationId })
        .sort({ timestamp: -1 })
        .limit(maxMessages)
        .toArray();
      
      return messages.reverse();
    } catch (error) {
      console.error('[MongoDB] getConversationContext error:', error.message);
      throw error;
    }
  }

  // Get user conversations
  async getUserConversations(userId, limit = 20) {
    try {
      const conversations = await this.db.collection('conversations')
        .find({ user_id: userId })
        .sort({ updated_at: -1 })
        .limit(limit)
        .toArray();
      
      return conversations;
    } catch (error) {
      console.error('[MongoDB] getUserConversations error:', error.message);
      throw error;
    }
  }

  // Create new conversation
  async createConversation(userId, persona, title = null) {
    try {
      const conversation = {
        _id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        persona: persona,
        title: title || `Chat with ${persona}`,
        message_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await this.db.collection('conversations').insertOne(conversation);
      return conversation;
    } catch (error) {
      console.error('[MongoDB] createConversation error:', error.message);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const conversation = await this.db.collection('conversations').findOne({ _id: conversationId });
      return conversation;
    } catch (error) {
      console.error('[MongoDB] getConversation error:', error.message);
      throw error;
    }
  }

  // Delete conversation
  async deleteConversation(conversationId) {
    try {
      // Delete all messages
      await this.db.collection('messages').deleteMany({ conversation_id: conversationId });
      
      // Delete conversation
      await this.db.collection('conversations').deleteOne({ _id: conversationId });
      
      return { success: true };
    } catch (error) {
      console.error('[MongoDB] deleteConversation error:', error.message);
      throw error;
    }
  }

  // Get statistics
  async getStats() {
    try {
      const userCount = await this.db.collection('users').countDocuments();
      const messageCount = await this.db.collection('messages').countDocuments();
      const conversationCount = await this.db.collection('conversations').countDocuments();
      
      return {
        users: userCount,
        messages: messageCount,
        conversations: conversationCount
      };
    } catch (error) {
      console.error('[MongoDB] getStats error:', error.message);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.db.admin().ping();
      return { status: 'healthy', connected: this.isConnected };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Close connection
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('[MongoDB] Connection closed');
    }
  }
}

// Singleton instance
const mongoClient = new MongoDBClient();

module.exports = mongoClient;
