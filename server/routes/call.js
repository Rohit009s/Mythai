/**
 * Call Routes - Voice Call Management API
 * Handles voice call sessions, real-time communication, and call-related features
 * 
 * Base Route: /api/call
 * 
 * Available Endpoints:
 * - GET    /api/call/health             - Health check for call service
 * - GET    /api/call/stats              - Get call statistics
 * - GET    /api/call/active             - Get active calls
 * - POST   /api/call/start              - Start new call session
 * - POST   /api/call/:callId/message    - Send message during call
 * - POST   /api/call/:callId/end        - End call session
 * - GET    /api/call/:callId/status     - Get call status
 * - POST   /api/call/:callId/audio      - Process audio input (STT)
 * - GET    /api/call/:callId/history    - Get call message history
 * - POST   /api/call/:callId/mute       - Mute/unmute call
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { getMCPClient } = require('../lib/mcpClient');
const EnhancedLLMManager = require('../lib/enhancedLLMManager');
const { generateSpeech: generateElevenLabsSpeech } = require('../lib/elevenLabsClient');
const { enhanceRAGResponse } = require('../lib/responseStyler');
const { humanizeIfNeeded } = require('../lib/responseHumanizer');
const conversationMemory = require('../lib/conversationMemory');
const qdrantUtilizationManager = require('../lib/qdrantUtilizationManager');

// Initialize Enhanced LLM Manager for call responses
const enhancedLLM = new EnhancedLLMManager();

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map();

// Middleware for call ID validation
const validateCallId = (req, res, next) => {
  const { callId } = req.params;
  if (!callId || !callId.startsWith('call_')) {
    return res.status(400).json({ 
      error: 'Invalid call ID format',
      expected: 'call_[timestamp]_[random]'
    });
  }
  next();
};

// Middleware for request logging
const logCallRequest = (req, res, next) => {
  console.log(`[Call API] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
};

// Simple rate limiting middleware
const rateLimit = (maxRequests = 60, windowMs = 60000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, []);
    }
    
    const requests = rateLimitStore.get(clientId).filter(time => time > windowStart);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requests.push(now);
    rateLimitStore.set(clientId, requests);
    next();
  };
};

// Apply middleware to all routes
router.use(logCallRequest);
router.use(rateLimit(100, 60000)); // 100 requests per minute

/**
 * GET /api/call/health
 * Health check for call service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'call-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: 10
  });
});

/**
 * GET /api/call/stats
 * Get call statistics and metrics
 */
router.get('/stats', async (req, res) => {
  try {
    let stats = {
      totalCalls: 0,
      activeCalls: 0,
      averageCallDuration: 0,
      popularPersonas: [],
      callsToday: 0
    };

    try {
      const db = getDb();
      
      // Get total calls
      stats.totalCalls = await db.collection('callSessions').countDocuments();
      
      // Get active calls
      stats.activeCalls = await db.collection('callSessions').countDocuments({ status: 'active' });
      
      // Get calls today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      stats.callsToday = await db.collection('callSessions').countDocuments({
        startTime: { $gte: today }
      });
      
      // Get popular personas
      const personaStats = await db.collection('callSessions').aggregate([
        { $group: { _id: '$persona', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();
      
      stats.popularPersonas = personaStats.map(p => ({
        persona: p._id,
        callCount: p.count
      }));

    } catch (error) {
      console.warn('[Call] Database unavailable for stats:', error.message);
    }

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Call] Error getting call stats:', error);
    res.status(500).json({ error: 'Failed to get call statistics' });
  }
});

/**
 * GET /api/call/active
 * Get all active call sessions for the current user
 */
router.get('/active', async (req, res) => {
  try {
    const userId = req.user?.userId;

    let activeCalls = [];
    try {
      const db = getDb();
      const query = userId ? { userId, status: 'active' } : { status: 'active' };
      activeCalls = await db.collection('callSessions')
        .find(query)
        .sort({ startTime: -1 })
        .limit(10)
        .toArray();
    } catch (error) {
      console.warn('[Call] Database unavailable for active calls lookup');
    }

    res.json({
      success: true,
      activeCalls: activeCalls.map(call => ({
        id: call._id,
        persona: call.persona,
        conversationId: call.conversationId,
        startTime: call.startTime,
        messageCount: call.messageCount || 0,
        participants: call.participants
      }))
    });

  } catch (error) {
    console.error('[Call] Error getting active calls:', error);
    res.status(500).json({ error: 'Failed to get active calls' });
  }
});

/**
 * POST /api/call/start
 * Start a new voice call session
 */
router.post('/start', async (req, res) => {
  try {
    const { persona, conversationId, callType = 'voice' } = req.body;
    
    // Validate required fields
    if (!persona) {
      return res.status(400).json({ 
        error: 'Persona is required',
        example: { persona: 'krishna', callType: 'voice' }
      });
    }

    // Validate persona format
    if (typeof persona !== 'string' || persona.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid persona format',
        expected: 'String with at least 2 characters'
      });
    }

    // Validate call type
    const validCallTypes = ['voice', 'video', 'audio'];
    if (!validCallTypes.includes(callType)) {
      return res.status(400).json({ 
        error: 'Invalid call type',
        validTypes: validCallTypes
      });
    }

    // Get user from auth middleware or use demo user
    let user;
    if (req.user && req.user.userId) {
      const db = getDb();
      user = await db.collection('users').findOne({ _id: req.user.userId });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      // Demo mode
      user = {
        name: 'Guest',
        age: 25,
        religion: 'all',
        email: 'demo@example.com'
      };
    }

    // Create call session
    const callSession = {
      _id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user?.userId || null,
      persona,
      conversationId: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callType,
      status: 'active',
      startTime: new Date(),
      participants: [
        { type: 'user', name: user.name },
        { type: 'deity', name: persona }
      ],
      metadata: {
        userAge: user.age,
        userReligion: user.religion,
        language: user.language || 'en'
      }
    };

    // Store call session in database
    try {
      const db = getDb();
      await db.collection('callSessions').insertOne(callSession);
      console.log(`[Call] Started new call session: ${callSession._id}`);
    } catch (error) {
      console.warn('[Call] Failed to store call session:', error.message);
    }

    res.json({
      success: true,
      callSession: {
        id: callSession._id,
        persona: callSession.persona,
        conversationId: callSession.conversationId,
        status: callSession.status,
        startTime: callSession.startTime
      }
    });

  } catch (error) {
    console.error('[Call] Error starting call:', error);
    res.status(500).json({ error: 'Failed to start call session' });
  }
});/*
*
 * POST /api/call/:callId/message
 * Send a message during an active call
 */
router.post('/:callId/message', validateCallId, async (req, res) => {
  try {
    const { callId } = req.params;
    const { text, audio = true } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Get call session
    let callSession;
    try {
      const db = getDb();
      callSession = await db.collection('callSessions').findOne({ _id: callId });
    } catch (error) {
      console.warn('[Call] Database unavailable, using fallback session');
      callSession = {
        _id: callId,
        persona: 'krishna', // Default fallback
        conversationId: `conv_${Date.now()}`,
        status: 'active'
      };
    }

    if (!callSession) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    if (callSession.status !== 'active') {
      return res.status(400).json({ error: 'Call session is not active' });
    }

    // Get user info
    let user;
    if (req.user && req.user.userId) {
      try {
        const db = getDb();
        user = await db.collection('users').findOne({ _id: req.user.userId });
      } catch (error) {
        console.warn('[Call] Database unavailable for user lookup');
      }
    }
    
    if (!user) {
      user = {
        name: 'Guest',
        age: 25,
        religion: 'all',
        language: 'en'
      };
    }

    // Load persona
    const personaObj = await loadPersona(callSession.persona);
    if (!personaObj) {
      return res.status(404).json({ error: `Persona ${callSession.persona} not found` });
    }

    // Build memory context for call continuity
    const memoryContext = await conversationMemory.buildContext(
      callSession.conversationId,
      req.user?.userId || null
    );

    // Use Qdrant vector search for enhanced context
    let vectorContext = [];
    try {
      const vectorResults = await qdrantUtilizationManager.searchForUserQuery(
        text,
        {
          persona: callSession.persona,
          religion: user.religion === 'all' ? null : user.religion,
          language: user.language || 'en',
          topK: 3,
          scoreThreshold: 0.6
        }
      );
      
      if (vectorResults.length > 0) {
        vectorContext = vectorResults.map(result => result.text);
        console.log(`[Call] 🔍 Found ${vectorResults.length} relevant passages from vector search`);
      }
    } catch (error) {
      console.warn('[Call] Vector search failed:', error.message);
    }

    // Generate response using Enhanced LLM Manager
    console.log(`[Call] Generating response for ${callSession.persona} in call ${callId}`);
    
    const llmResult = await enhancedLLM.generateSpiritualResponse(text, callSession.persona, {
      language: user.language || 'en',
      context: vectorContext, // Use vector search results as context
      memoryContext: memoryContext.recentMessages || [],
      temperature: 0.8,
      max_tokens: 400 // Shorter responses for calls
    });

    let answer;
    if (llmResult.success) {
      answer = llmResult.response;
      console.log(`[Call] ✅ Response generated with ${llmResult.provider} (${llmResult.duration}ms)`);
    } else {
      console.error(`[Call] ❌ LLM failed:`, llmResult.error);
      answer = llmResult.fallbackResponse || 'I apologize, but I am having trouble responding right now. Please try again.';
    }

    // Humanize response for natural conversation
    const humanized = await humanizeIfNeeded(
      answer,
      text,
      personaObj,
      null // No citations for real-time calls
    );

    answer = humanized.text;

    // Generate audio if requested
    let audioUrl = null;
    let audioStatus = 'none';
    
    if (audio) {
      audioStatus = 'pending';
      try {
        console.log('[Call] Generating TTS for call response');
        audioUrl = await generateElevenLabsSpeech(answer, callSession.persona, {
          tone: 'conversational',
          narration: 'natural'
        });
        audioStatus = audioUrl ? 'success' : 'failed';
      } catch (error) {
        console.error('[Call] TTS error:', error.message);
        audioStatus = 'failed';
      }
    }

    // Store messages in conversation memory
    try {
      if (callSession.conversationId) {
        await conversationMemory.addMessage(
          callSession.conversationId, 
          'user', 
          text, 
          { callId, messageType: 'voice_call' }
        );
        
        await conversationMemory.addMessage(
          callSession.conversationId, 
          'assistant', 
          answer, 
          { 
            callId, 
            messageType: 'voice_call',
            persona: callSession.persona,
            audioUrl,
            audioStatus
          }
        );
      }
    } catch (error) {
      console.warn('[Call] Failed to store call messages:', error.message);
    }

    // Update call session activity
    try {
      const db = getDb();
      await db.collection('callSessions').updateOne(
        { _id: callId },
        { 
          $set: { lastActivity: new Date() },
          $inc: { messageCount: 1 }
        }
      );
    } catch (error) {
      console.warn('[Call] Failed to update call session:', error.message);
    }

    res.json({
      success: true,
      response: {
        text: answer,
        audioUrl,
        audioStatus,
        persona: callSession.persona,
        timestamp: new Date().toISOString(),
        callId,
        provider: llmResult.provider || 'fallback'
      }
    });

  } catch (error) {
    console.error('[Call] Error processing call message:', error);
    res.status(500).json({ error: 'Failed to process call message' });
  }
});

/**
 * POST /api/call/:callId/end
 * End an active call session
 */
router.post('/:callId/end', validateCallId, async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason = 'user_ended' } = req.body;

    // Update call session status
    try {
      const db = getDb();
      const result = await db.collection('callSessions').updateOne(
        { _id: callId },
        { 
          $set: { 
            status: 'ended',
            endTime: new Date(),
            endReason: reason
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Call session not found' });
      }

      console.log(`[Call] Ended call session: ${callId} (reason: ${reason})`);
    } catch (error) {
      console.warn('[Call] Failed to update call session:', error.message);
    }

    res.json({
      success: true,
      message: 'Call session ended successfully',
      callId,
      endTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Call] Error ending call:', error);
    res.status(500).json({ error: 'Failed to end call session' });
  }
});

/**
 * GET /api/call/:callId/status
 * Get call session status and information
 */
router.get('/:callId/status', validateCallId, async (req, res) => {
  try {
    const { callId } = req.params;

    let callSession;
    try {
      const db = getDb();
      callSession = await db.collection('callSessions').findOne({ _id: callId });
    } catch (error) {
      console.warn('[Call] Database unavailable for status check');
      return res.status(503).json({ error: 'Database unavailable' });
    }

    if (!callSession) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    // Calculate call duration
    const startTime = new Date(callSession.startTime);
    const endTime = callSession.endTime ? new Date(callSession.endTime) : new Date();
    const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds

    res.json({
      success: true,
      callSession: {
        id: callSession._id,
        persona: callSession.persona,
        conversationId: callSession.conversationId,
        status: callSession.status,
        startTime: callSession.startTime,
        endTime: callSession.endTime,
        duration,
        messageCount: callSession.messageCount || 0,
        participants: callSession.participants
      }
    });

  } catch (error) {
    console.error('[Call] Error getting call status:', error);
    res.status(500).json({ error: 'Failed to get call status' });
  }
});

/**
 * POST /api/call/:callId/audio
 * Process audio input during a call (Speech-to-Text)
 */
router.post('/:callId/audio', validateCallId, async (req, res) => {
  try {
    const { callId } = req.params;
    const { audioData, format = 'webm' } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Get call session
    let callSession;
    try {
      const db = getDb();
      callSession = await db.collection('callSessions').findOne({ _id: callId });
    } catch (error) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    if (!callSession || callSession.status !== 'active') {
      return res.status(404).json({ error: 'Active call session not found' });
    }

    // TODO: Implement Speech-to-Text processing
    // For now, return a placeholder response
    console.log(`[Call] Received audio data for call ${callId} (${audioData.length} bytes)`);

    res.json({
      success: true,
      message: 'Audio received and processed',
      callId,
      transcript: 'Audio processing not yet implemented',
      confidence: 0.0
    });

  } catch (error) {
    console.error('[Call] Error processing audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

/**
 * GET /api/call/:callId/history
 * Get call message history
 */
router.get('/:callId/history', validateCallId, async (req, res) => {
  try {
    const { callId } = req.params;
    const { limit = 50 } = req.query;

    // Get call session
    let callSession;
    try {
      const db = getDb();
      callSession = await db.collection('callSessions').findOne({ _id: callId });
    } catch (error) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    if (!callSession) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    // Get conversation messages
    let messages = [];
    try {
      const memoryContext = await conversationMemory.buildContext(
        callSession.conversationId,
        req.user?.userId || null
      );
      
      messages = memoryContext.recentMessages || [];
    } catch (error) {
      console.warn('[Call] Failed to load call history:', error.message);
    }

    res.json({
      success: true,
      callId,
      conversationId: callSession.conversationId,
      messages: messages.slice(-parseInt(limit)),
      totalMessages: messages.length
    });

  } catch (error) {
    console.error('[Call] Error getting call history:', error);
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

/**
 * POST /api/call/:callId/mute
 * Mute/unmute call session
 */
router.post('/:callId/mute', validateCallId, async (req, res) => {
  try {
    const { callId } = req.params;
    const { muted = true } = req.body;

    // Update call session
    try {
      const db = getDb();
      const result = await db.collection('callSessions').updateOne(
        { _id: callId },
        { 
          $set: { 
            muted,
            lastActivity: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Call session not found' });
      }

      console.log(`[Call] ${muted ? 'Muted' : 'Unmuted'} call session: ${callId}`);
    } catch (error) {
      console.warn('[Call] Failed to update mute status:', error.message);
    }

    res.json({
      success: true,
      callId,
      muted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Call] Error updating mute status:', error);
    res.status(500).json({ error: 'Failed to update mute status' });
  }
});

/**
 * Helper function to load persona
 */
async function loadPersona(personaName) {
  // Try MCP first if enabled
  if (process.env.USE_MCP !== 'false') {
    try {
      const mcpClient = await getMCPClient();
      if (mcpClient.isAvailable()) {
        const persona = await mcpClient.getDeityPersona(personaName);
        if (persona) {
          console.log(`[Call] Loaded persona via MCP: ${personaName}`);
          return persona;
        }
      }
    } catch (error) {
      console.warn(`[Call] MCP persona load failed: ${error.message}`);
    }
  }

  // Fallback to file system
  try {
    const fs = require('fs');
    const path = require('path');
    const personaPath = path.resolve(__dirname, '..', '..', 'data', 'personas', `${personaName}.json`);
    const personaData = fs.readFileSync(personaPath, 'utf8');
    return JSON.parse(personaData);
  } catch (error) {
    console.error(`[Call] Failed to load persona ${personaName}:`, error.message);
    return null;
  }
}

// Global error handler for call routes
router.use((error, req, res, next) => {
  console.error(`[Call API Error] ${req.method} ${req.originalUrl}:`, error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: error.message
    });
  }
  
  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for unmatched call routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Call endpoint not found',
    availableEndpoints: [
      'GET /api/call/health',
      'GET /api/call/stats',
      'GET /api/call/active',
      'POST /api/call/start',
      'POST /api/call/:callId/message',
      'POST /api/call/:callId/end',
      'GET /api/call/:callId/status',
      'POST /api/call/:callId/audio',
      'GET /api/call/:callId/history',
      'POST /api/call/:callId/mute'
    ]
  });
});

module.exports = router;