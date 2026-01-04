const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

/**
 * Create new conversation
 */
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { persona, title } = req.body;
    
    console.log(`[Conversations] Creating new conversation - persona: ${persona}, title: ${title}, userId: ${req.user?.userId || 'guest'}`);
    
    const conv = {
      _id: uuidv4(),
      userId: req.user?.userId || null,
      persona: persona || 'krishna',
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('conversations').insertOne(conv);
    console.log(`[Conversations] Created conversation with ID: ${conv._id}, insertedId: ${result.insertedId}`);
    
    res.json({ conversationId: conv._id });
  } catch (error) {
    console.error('[Conversations] Create error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * Get single conversation
 */
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const conversationMemory = require('../lib/conversationMemory');
    const id = req.params.id;
    
    // Use the enhanced memory system to get full conversation
    const conv = await conversationMemory.getConversation(id);
    
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    console.log(`[Conversations] Retrieved conversation ${id} with ${conv.messages?.length || 0} messages`);
    res.json(conv);
  } catch (error) {
    console.error('[Conversations] Get error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

/**
 * Get all conversations for a user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.userId;
    
    const conversations = await db.collection('conversations')
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    
    // Helper function to calculate conversation duration
    const calculateDuration = (createdAt, updatedAt) => {
      const diffMs = new Date(updatedAt) - new Date(createdAt);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Less than a minute';
      if (diffMins < 60) return `${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    };

    // Helper function to get deity name from persona
    const getDeityName = (persona) => {
      const deityNames = {
        'krishna': 'Krishna',
        'shiva': 'Shiva',
        'vishnu': 'Vishnu',
        'ganesha': 'Ganesha',
        'hanuman': 'Hanuman',
        'rama': 'Rama',
        'lakshmi': 'Lakshmi',
        'zeus': 'Zeus',
        'athena': 'Athena',
        'apollo': 'Apollo',
        'poseidon': 'Poseidon',
        'hera': 'Hera',
        'odin': 'Odin',
        'thor': 'Thor',
        'loki': 'Loki',
        'freyja': 'Freyja',
        'ra': 'Ra',
        'isis': 'Isis',
        'anubis': 'Anubis',
        'jesus': 'Jesus Christ',
        'prophet_muhammad': 'Prophet Muhammad'
      };
      return deityNames[persona] || persona.charAt(0).toUpperCase() + persona.slice(1);
    };
    
    // Return enhanced summary using new memory system data
    const summary = conversations.map(conv => {
      // Use messageCount from conversation metadata (updated by memory system)
      const messageCount = conv.messageCount || 0;
      const lastMessageText = conv.lastMessageText || 'No messages yet';
      
      return {
        id: conv._id,
        deityId: conv.persona,
        deityName: getDeityName(conv.persona),
        title: conv.title || (lastMessageText !== 'No messages yet' ? lastMessageText.substring(0, 50) + '...' : 'New Conversation'),
        messageCount: messageCount,
        firstMessage: lastMessageText.substring(0, 120) + (lastMessageText.length > 120 ? '...' : ''),
        duration: calculateDuration(conv.createdAt, conv.updatedAt),
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json({ conversations: summary });
  } catch (error) {
    console.error('[Conversations] List error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

/**
 * Update conversation (title, etc.)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.userId;
    
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }
    
    const result = await db.collection('conversations').updateOne(
      { _id: id, userId },
      { $set: { title, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Conversations] Update error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * Update conversation title (legacy endpoint)
 */
router.patch('/:id/title', optionalAuthMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }
    
    await db.collection('conversations').updateOne(
      { _id: id },
      { $set: { title, updatedAt: new Date() } }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Conversations] Update title error:', error);
    res.status(500).json({ error: 'Failed to update title' });
  }
});

/**
 * Delete conversation
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await db.collection('conversations').deleteOne({
      _id: id,
      userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Conversations] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
