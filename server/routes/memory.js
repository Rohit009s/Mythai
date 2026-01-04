const express = require('express');
const router = express.Router();
const conversationMemory = require('../lib/conversationMemory');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

/**
 * Get conversation context with memory layers
 */
router.get('/context/:conversationId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.userId || null;
    
    const context = await conversationMemory.buildContext(conversationId, userId);
    
    res.json({
      success: true,
      context: {
        summary: context.conversationSummary,
        recentMessages: context.recentMessages,
        messageCount: context.messageCount,
        hasMemories: context.userMemories.length > 0
      }
    });
  } catch (error) {
    console.error('[Memory] Get context error:', error);
    res.status(500).json({ error: 'Failed to get conversation context' });
  }
});

/**
 * Get user memories
 */
router.get('/user-memories', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const memories = await conversationMemory.getUserMemories(userId, 20);
    
    res.json({
      success: true,
      memories: memories.map(m => ({
        id: m._id, // Updated for MongoDB _id
        type: m.type,
        content: m.content,
        importance: m.importance,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('[Memory] Get user memories error:', error);
    res.status(500).json({ error: 'Failed to get user memories' });
  }
});

/**
 * Generate conversation summary manually
 */
router.post('/summarize/:conversationId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const summary = await conversationMemory.generateConversationSummary(conversationId);
    
    if (summary) {
      res.json({
        success: true,
        summary: summary.summary,
        themes: summary.themes,
        emotions: summary.emotions
      });
    } else {
      res.json({
        success: false,
        message: 'Not enough messages to generate summary'
      });
    }
  } catch (error) {
    console.error('[Memory] Generate summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

/**
 * Get conversation statistics
 */
router.get('/stats/:conversationId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await conversationMemory.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const messages = conversation.messages || [];
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // Calculate conversation duration
    const startTime = conversation.createdAt;
    const endTime = conversation.updatedAt;
    const durationMs = new Date(endTime) - new Date(startTime);
    const durationMinutes = Math.floor(durationMs / 60000);
    
    res.json({
      success: true,
      stats: {
        totalMessages: messages.length,
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        durationMinutes,
        persona: conversation.persona,
        hasAudio: messages.some(m => m.audioUrl),
        themes: conversation.latestSummary ? 'Available' : 'Not generated',
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error('[Memory] Get stats error:', error);
    res.status(500).json({ error: 'Failed to get conversation stats' });
  }
});

module.exports = router;