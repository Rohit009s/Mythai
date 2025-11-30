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
    
    const conv = {
      _id: uuidv4(),
      userId: req.user?.userId || null,
      persona: persona || 'krishna',
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('conversations').insertOne(conv);
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
    const db = getDb();
    const id = req.params.id;
    const conv = await db.collection('conversations').findOne({ _id: id });
    
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
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
    
    // Return summary without full message history
    const summary = conversations.map(conv => ({
      _id: conv._id,
      persona: conv.persona,
      title: conv.title,
      messageCount: conv.messages?.length || 0,
      lastMessage: conv.messages?.[conv.messages.length - 1]?.text?.substring(0, 100) || '',
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));
    
    res.json({ conversations: summary });
  } catch (error) {
    console.error('[Conversations] List error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

/**
 * Update conversation title
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
