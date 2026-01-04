const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Conversation Memory System with MongoDB Storage
 * Implements layered memory architecture with efficient ID-based retrieval
 */
class ConversationMemory {
  constructor() {
    this.SHORT_TERM_LIMIT = 8; // Last N messages to keep in active memory
    this.SUMMARY_INTERVAL = 6; // Generate summary every N messages
    this.MAX_CONTEXT_TOKENS = 2000; // Rough token limit for context
  }

  /**
   * 1️⃣ SHORT-TERM MEMORY: Store messages in dedicated collection
   */
  async addMessage(conversationId, role, text, metadata = {}) {
    try {
      const db = getDb();
      const messageId = uuidv4();
      
      console.log(`[ConversationMemory] Adding message - conversationId: ${conversationId}, role: ${role}, text: "${text.substring(0, 50)}..."`);
      
      const message = {
        _id: messageId,
        conversationId,
        role, // 'user' or 'assistant'
        text,
        timestamp: new Date(),
        emotion: metadata.emotion || null,
        topic: metadata.topic || null,
        audioUrl: metadata.audioUrl || null,
        audioStatus: metadata.audioStatus || null,
        referencedSources: metadata.referencedSources || [],
        ...metadata
      };

      // Store message in dedicated messages collection for efficient retrieval
      await db.collection('conversation_messages').insertOne(message);
      console.log(`[ConversationMemory] Message stored with ID: ${messageId}`);

      // Update conversation metadata
      await db.collection('conversations').updateOne(
        { _id: conversationId },
        { 
          $inc: { messageCount: 1 },
          $set: { 
            updatedAt: new Date(),
            lastMessageId: messageId,
            lastMessageText: text.substring(0, 100),
            lastMessageRole: role
          }
        },
        { upsert: true }
      );

      console.log(`[ConversationMemory] Updated conversation metadata for ${conversationId}`);

      // Check if we need to generate a summary
      const conversation = await this.getConversationMetadata(conversationId);
      if (conversation && conversation.messageCount % this.SUMMARY_INTERVAL === 0) {
        console.log(`[ConversationMemory] Triggering summary generation for ${conversationId} (${conversation.messageCount} messages)`);
        await this.generateConversationSummary(conversationId);
      }

      return message;
    } catch (error) {
      console.error('[ConversationMemory] Add message error:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for context (short-term memory) - ID-based retrieval
   */
  async getRecentMessages(conversationId, limit = null) {
    try {
      const db = getDb();
      const recentLimit = limit || this.SHORT_TERM_LIMIT;
      
      console.log(`[ConversationMemory] Getting recent messages for conversation: ${conversationId}, limit: ${recentLimit}`);
      
      // Efficient query: get recent messages by conversationId, sorted by timestamp
      const messages = await db.collection('conversation_messages')
        .find({ conversationId })
        .sort({ timestamp: -1 })
        .limit(recentLimit)
        .toArray();
      
      console.log(`[ConversationMemory] Found ${messages.length} messages for conversation ${conversationId}`);
      
      // Return in chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('[ConversationMemory] Get recent messages error:', error);
      return [];
    }
  }

  /**
   * Get conversation metadata efficiently
   */
  async getConversationMetadata(conversationId) {
    try {
      const db = getDb();
      return await db.collection('conversations').findOne(
        { _id: conversationId },
        { projection: { messageCount: 1, persona: 1, userId: 1, createdAt: 1, updatedAt: 1, latestSummary: 1 } }
      );
    } catch (error) {
      console.error('[ConversationMemory] Get conversation metadata error:', error);
      return null;
    }
  }

  /**
   * 2️⃣ CONVERSATION SUMMARY MEMORY: Generate and store summaries efficiently
   */
  async generateConversationSummary(conversationId) {
    try {
      const db = getDb();
      const conversation = await this.getConversationMetadata(conversationId);
      
      if (!conversation || conversation.messageCount < 4) {
        return null;
      }

      // Get recent messages for summary generation
      const recentMessages = await db.collection('conversation_messages')
        .find({ conversationId })
        .sort({ timestamp: -1 })
        .limit(this.SUMMARY_INTERVAL * 2)
        .toArray();
      
      if (recentMessages.length === 0) return null;

      // Create intelligent summary focused on story continuity
      const userMessages = recentMessages.filter(m => m.role === 'user');
      const assistantMessages = recentMessages.filter(m => m.role === 'assistant');
      const lastUserMessage = userMessages[0]; // Most recent user message
      
      if (!lastUserMessage) return null;

      // Extract key themes and emotions
      const themes = this.extractThemes(recentMessages);
      const emotions = this.extractEmotions(recentMessages);
      const persona = conversation.persona || 'krishna';

      // Build a narrative summary for better story continuity
      const narrativeSummary = this.buildNarrativeSummary(recentMessages, persona, themes, emotions);

      const summaryId = uuidv4();
      const summary = {
        _id: summaryId,
        conversationId,
        summary: narrativeSummary,
        themes,
        emotions,
        messageCount: conversation.messageCount,
        generatedAt: new Date(),
        lastMessageText: lastUserMessage.text.substring(0, 100),
        isActive: true
      };

      // Store summary in dedicated collection
      await db.collection('conversation_summaries').insertOne(summary);
      
      // Mark previous summaries as inactive
      await db.collection('conversation_summaries').updateMany(
        { conversationId, _id: { $ne: summaryId } },
        { $set: { isActive: false } }
      );
      
      // Update conversation with latest summary reference
      await db.collection('conversations').updateOne(
        { _id: conversationId },
        { 
          $set: { 
            latestSummary: summary.summary,
            latestSummaryId: summaryId,
            summaryUpdatedAt: new Date() 
          } 
        }
      );

      console.log(`[ConversationMemory] Generated narrative summary for ${conversationId}: ${summary.summary}`);
      return summary;
    } catch (error) {
      console.error('[ConversationMemory] Generate summary error:', error);
      return null;
    }
  }

  /**
   * Get conversation summary efficiently by ID
   */
  async getConversationSummary(conversationId) {
    try {
      const db = getDb();
      
      // First try to get from conversation metadata (cached)
      const conversation = await db.collection('conversations').findOne(
        { _id: conversationId },
        { projection: { latestSummary: 1, latestSummaryId: 1 } }
      );
      
      if (conversation?.latestSummary) {
        return conversation.latestSummary;
      }
      
      // Fallback: get from summaries collection
      const summary = await db.collection('conversation_summaries').findOne(
        { conversationId, isActive: true },
        { projection: { summary: 1 } }
      );
      
      return summary?.summary || null;
    } catch (error) {
      console.error('[ConversationMemory] Get summary error:', error);
      return null;
    }
  }

  /**
   * 3️⃣ PERSONA LOCK: Get consistent persona context
   */
  getPersonaContext(persona) {
    const personaPrompts = {
      krishna: "You are Krishna, the divine teacher and guide. Speak with calm wisdom, joy, and deep compassion. Base your guidance on Bhagavad Gita principles and Vedic philosophy. Never break character.",
      
      shiva: "You are Shiva, the transformer and destroyer of ignorance. Speak with profound wisdom and cosmic perspective. Guide through meditation, detachment, and spiritual transformation. Never break character.",
      
      vishnu: "You are Vishnu, the preserver and protector. Speak with gentle authority, infinite compassion, and dharmic wisdom. Guide towards righteousness and cosmic harmony. Never break character.",
      
      ganesha: "You are Ganesha, the remover of obstacles and lord of beginnings. Speak with playful wisdom, practical guidance, and encouraging energy. Help overcome challenges with intelligence and devotion. Never break character.",
      
      hanuman: "You are Hanuman, the devoted servant of Lord Rama. Speak with warmth, strength, and natural devotion. Always start with 'Jai Shri Ram!' Be genuine and caring, adapting your response length to what the person needs - brief for simple questions, detailed for guidance. Never break character.",
      
      rama: "You are Rama, the ideal king and embodiment of dharma. Speak with noble dignity, perfect righteousness, and compassionate leadership. Guide through duty, honor, and moral excellence. Never break character.",
      
      lakshmi: "You are Lakshmi, the goddess of prosperity and abundance. Speak with graceful wisdom, nurturing energy, and practical guidance about wealth, relationships, and spiritual prosperity. Never break character.",
      
      zeus: "You are Zeus, king of the gods and ruler of Olympus. Speak with divine authority, strategic wisdom, and powerful presence. Guide through leadership, justice, and cosmic order. Never break character.",
      
      athena: "You are Athena, goddess of wisdom and strategic warfare. Speak with sharp intelligence, practical wisdom, and strategic thinking. Guide through knowledge, courage, and wise counsel. Never break character.",
      
      odin: "You are Odin, the All-Father and seeker of wisdom. Speak with ancient knowledge, mystical insight, and warrior's courage. Guide through sacrifice, wisdom-seeking, and understanding of fate. Never break character.",
      
      thor: "You are Thor, god of thunder and protector of humanity. Speak with straightforward honesty, protective strength, and noble courage. Guide through action, loyalty, and standing up for what's right. Never break character.",
      
      jesus: "You are Jesus Christ, the teacher of love and compassion. Speak with infinite love, gentle wisdom, and transformative grace. Guide through forgiveness, service to others, and spiritual awakening. Never break character.",
      
      prophet_muhammad: "You are Prophet Muhammad (peace be upon him), the final messenger. Speak with humble wisdom, compassionate guidance, and devotion to Allah. Guide through Islamic principles, community service, and spiritual purification. Never break character."
    };

    return personaPrompts[persona] || personaPrompts.krishna;
  }

  /**
   * 4️⃣ MEMORY TYPES: Store and retrieve important user context with ID-based access
   */
  async storeUserMemory(userId, conversationId, memoryType, content) {
    try {
      const db = getDb();
      const memoryId = uuidv4();
      
      const memory = {
        _id: memoryId,
        userId,
        conversationId,
        type: memoryType, // 'preference', 'emotional_pattern', 'belief', 'goal'
        content,
        importance: this.calculateImportance(memoryType, content),
        createdAt: new Date(),
        lastAccessed: new Date(),
        isActive: true
      };

      await db.collection('user_memories').insertOne(memory);
      
      // Create index for efficient retrieval
      await db.collection('user_memories').createIndex({ userId: 1, importance: -1, lastAccessed: -1 });
      
      return memory;
    } catch (error) {
      console.error('[ConversationMemory] Store user memory error:', error);
      return null;
    }
  }

  async getUserMemories(userId, limit = 10) {
    try {
      const db = getDb();
      
      // Update last accessed time for retrieved memories
      const memories = await db.collection('user_memories')
        .find({ userId, isActive: true })
        .sort({ importance: -1, lastAccessed: -1 })
        .limit(limit)
        .toArray();
      
      // Update lastAccessed for these memories (fire and forget)
      if (memories.length > 0) {
        const memoryIds = memories.map(m => m._id);
        db.collection('user_memories').updateMany(
          { _id: { $in: memoryIds } },
          { $set: { lastAccessed: new Date() } }
        ).catch(err => console.warn('[ConversationMemory] Failed to update lastAccessed:', err));
      }
      
      return memories;
    } catch (error) {
      console.error('[ConversationMemory] Get user memories error:', error);
      return [];
    }
  }

  /**
   * 5️⃣ SMART CONTEXT BUILDER: Combine all memory layers efficiently
   */
  async buildContext(conversationId, userId = null) {
    try {
      // Parallel retrieval for efficiency
      const [recentMessages, summary, userMemories, conversation] = await Promise.all([
        this.getRecentMessages(conversationId),
        this.getConversationSummary(conversationId),
        userId ? this.getUserMemories(userId, 5) : [],
        this.getConversationMetadata(conversationId)
      ]);

      const persona = conversation?.persona || 'krishna';
      const personaContext = this.getPersonaContext(persona);

      return {
        personaContext,
        conversationSummary: summary,
        recentMessages,
        userMemories,
        messageCount: conversation?.messageCount || 0
      };
    } catch (error) {
      console.error('[ConversationMemory] Build context error:', error);
      return {
        personaContext: this.getPersonaContext('krishna'),
        conversationSummary: null,
        recentMessages: [],
        userMemories: [],
        messageCount: 0
      };
    }
  }

  /**
   * Get full conversation for legacy compatibility
   */
  async getConversation(conversationId) {
    try {
      const db = getDb();
      
      // Get conversation metadata
      const conversation = await db.collection('conversations').findOne({ _id: conversationId });
      if (!conversation) return null;
      
      // Get all messages for this conversation
      const messages = await db.collection('conversation_messages')
        .find({ conversationId })
        .sort({ timestamp: 1 })
        .toArray();
      
      // Add messages to conversation object for compatibility
      conversation.messages = messages.map(msg => ({
        id: msg._id,
        sender: msg.role === 'user' ? 'user' : 'assistant',
        text: msg.text,
        timestamp: msg.timestamp,
        audioUrl: msg.audioUrl,
        audioStatus: msg.audioStatus,
        referencedSources: msg.referencedSources || []
      }));
      
      return conversation;
    } catch (error) {
      console.error('[ConversationMemory] Get conversation error:', error);
      return null;
    }
  }

  /**
   * Initialize database indexes for optimal performance
   */
  async initializeIndexes() {
    try {
      const db = getDb();
      
      // Conversation messages indexes
      await db.collection('conversation_messages').createIndex({ conversationId: 1, timestamp: -1 });
      await db.collection('conversation_messages').createIndex({ conversationId: 1, role: 1 });
      
      // Conversation summaries indexes
      await db.collection('conversation_summaries').createIndex({ conversationId: 1, isActive: 1 });
      await db.collection('conversation_summaries').createIndex({ conversationId: 1, generatedAt: -1 });
      
      // User memories indexes
      await db.collection('user_memories').createIndex({ userId: 1, importance: -1, lastAccessed: -1 });
      await db.collection('user_memories').createIndex({ userId: 1, type: 1, isActive: 1 });
      
      // Conversations indexes
      await db.collection('conversations').createIndex({ userId: 1, updatedAt: -1 });
      await db.collection('conversations').createIndex({ _id: 1, messageCount: 1 });
      
      console.log('[ConversationMemory] Database indexes initialized');
    } catch (error) {
      console.warn('[ConversationMemory] Failed to initialize indexes:', error);
    }
  }

  /**
   * Helper methods
   */
  buildNarrativeSummary(messages, persona, themes, emotions) {
    // Sort messages chronologically for narrative flow
    const chronologicalMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get the conversation flow
    const userMessages = chronologicalMessages.filter(m => m.role === 'user');
    const assistantMessages = chronologicalMessages.filter(m => m.role === 'assistant');
    
    if (userMessages.length === 0) return `Conversation with ${persona} about general topics.`;
    
    // Build narrative based on conversation progression
    const firstTopic = this.extractMainTopic(userMessages[0].text);
    const latestTopic = userMessages.length > 1 ? this.extractMainTopic(userMessages[userMessages.length - 1].text) : firstTopic;
    
    let narrative = `In this ongoing conversation with ${persona}, `;
    
    if (firstTopic === latestTopic) {
      narrative += `the user has been exploring ${firstTopic}. `;
    } else {
      narrative += `the user started by discussing ${firstTopic} and has moved on to ${latestTopic}. `;
    }
    
    // Add emotional context
    if (emotions.includes('confused') || emotions.includes('seeking')) {
      narrative += `They are seeking clarity and guidance. `;
    } else if (emotions.includes('grateful')) {
      narrative += `They have expressed gratitude for the guidance received. `;
    } else if (emotions.includes('anxious') || emotions.includes('sad')) {
      narrative += `They are working through some emotional challenges. `;
    }
    
    // Add recent context
    const recentUserMessage = userMessages[userMessages.length - 1];
    if (recentUserMessage) {
      const recentContext = recentUserMessage.text.substring(0, 80);
      narrative += `Most recently, they mentioned: "${recentContext}..."`;
    }
    
    return narrative;
  }

  extractMainTopic(text) {
    const topicKeywords = {
      'career and work': ['job', 'work', 'career', 'profession', 'employment', 'boss', 'colleague'],
      'relationships and love': ['love', 'relationship', 'family', 'friend', 'marriage', 'partner', 'dating'],
      'spiritual growth': ['god', 'prayer', 'meditation', 'spiritual', 'soul', 'enlightenment', 'dharma'],
      'health and wellness': ['health', 'sick', 'pain', 'healing', 'wellness', 'body', 'mind'],
      'life purpose': ['purpose', 'meaning', 'direction', 'goal', 'path', 'destiny', 'calling'],
      'emotional challenges': ['worry', 'anxious', 'stress', 'fear', 'nervous', 'sad', 'depressed'],
      'personal growth': ['improve', 'better', 'change', 'grow', 'develop', 'learn', 'wisdom']
    };

    const lowerText = text.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return topic;
      }
    }
    
    return 'life guidance';
  }

  extractThemes(messages) {
    const themes = [];
    const text = messages.map(m => m.text).join(' ').toLowerCase();
    
    // Simple keyword-based theme extraction
    const themeKeywords = {
      'career': ['job', 'work', 'career', 'profession', 'employment'],
      'relationships': ['love', 'relationship', 'family', 'friend', 'marriage'],
      'spirituality': ['god', 'prayer', 'meditation', 'spiritual', 'soul'],
      'health': ['health', 'sick', 'pain', 'healing', 'wellness'],
      'purpose': ['purpose', 'meaning', 'direction', 'goal', 'path'],
      'anxiety': ['worry', 'anxious', 'stress', 'fear', 'nervous'],
      'guidance': ['help', 'advice', 'guidance', 'what should', 'how to']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['general guidance'];
  }

  extractEmotions(messages) {
    const emotions = [];
    const text = messages.map(m => m.text).join(' ').toLowerCase();
    
    const emotionKeywords = {
      'confused': ['confused', 'lost', 'unclear', 'don\'t know'],
      'anxious': ['worried', 'anxious', 'stressed', 'nervous'],
      'sad': ['sad', 'depressed', 'down', 'unhappy'],
      'hopeful': ['hope', 'optimistic', 'positive', 'better'],
      'grateful': ['thank', 'grateful', 'appreciate', 'blessed'],
      'seeking': ['seeking', 'searching', 'looking for', 'need']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        emotions.push(emotion);
      }
    }

    return emotions.length > 0 ? emotions : ['neutral'];
  }

  calculateImportance(type, content) {
    const typeWeights = {
      'preference': 3,
      'emotional_pattern': 4,
      'belief': 5,
      'goal': 4
    };
    
    const baseWeight = typeWeights[type] || 3;
    const lengthBonus = Math.min(content.length / 100, 2); // Longer content gets slight bonus
    
    return Math.min(baseWeight + lengthBonus, 10);
  }
}

module.exports = new ConversationMemory();