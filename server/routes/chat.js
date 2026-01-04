const express = require('express');
const router = express.Router();
const { embedText, chatCompletion, moderate, DEMO_MODE } = require('../lib/openRouterClient');
const { search } = require('../lib/qdrantClient');
const { generateSpeech: generateElevenLabsSpeech } = require('../lib/elevenLabsClient');
// const googleTTS = require('../lib/googleTTSClient');
const { getDb } = require('../db');
const { getMCPClient } = require('../lib/mcpClient');
const { classifyQuestion } = require('../lib/questionClassifier');
const { classifyIntent } = require('../lib/intentClassifier');
const { generateIntentBasedResponse } = require('../lib/intentBasedResponse');
// const { detectLanguage, getPersonaSuffix, getLanguageInstruction } = require('../lib/languageDetector');
const responseAdaptation = require('../lib/responseAdaptation');
const smartResponseController = require('../lib/smartResponseController');
const conversationMemory = require('../lib/conversationMemory');
const EnhancedLLMManager = require('../lib/enhancedLLMManager'); // NEW: Enhanced LLM with Sarvam AI
const fs = require('fs');
const path = require('path');
const { 
  getDeitiesForReligion, 
  getBooksForDeity, 
  getDeityGroup, 
  isDeityValidForReligion,
  canUserAccessDeity,
  getDeityReligion
} = require('../config/religionMapping');

const TTS_PROVIDER = process.env.TTS_PROVIDER || 'google';
const TOP_K = parseInt(process.env.RETRIEVE_TOP_K || '4', 10);
const USE_MCP = process.env.USE_MCP !== 'false'; // Enable MCP by default
const USE_INTENT_LAYER = process.env.USE_INTENT_LAYER !== 'false'; // Intent-based classification (default: enabled)

// Initialize Enhanced LLM Manager with Sarvam AI primary + OpenRouter fallback
const enhancedLLM = new EnhancedLLMManager();
console.log('[Chat] Enhanced LLM Manager initialized with Sarvam AI primary provider');

async function loadPersona(personaName){
  // Try MCP first if enabled
  if (USE_MCP) {
    try {
      const mcpClient = await getMCPClient();
      if (mcpClient.isAvailable()) {
        const persona = await mcpClient.getDeityPersona(personaName);
        if (persona) {
          console.log(`[MCP] Loaded persona: ${personaName}`);
          return persona;
        }
      }
    } catch (error) {
      console.warn(`[MCP] Failed to load persona via MCP: ${error.message}`);
    }
  }

  // Fallback to file system
  try{
    const p = fs.readFileSync(path.resolve(__dirname, '..','..','data','personas', `${personaName}.json`), 'utf8');
    return JSON.parse(p);
  }catch(e){
    return null;
  }
}

/**
 * Get age-appropriate tone guidance
 */
function getAgeAppropriateTone(age) {
  if (age < 16) {
    return {
      guidance: "Use simple, clear language. Avoid complex metaphors or heavy philosophical concepts. Be extra gentle, supportive, and encouraging. Avoid any violent, explicit, or disturbing content.",
      complexity: "simple",
      safety: "high"
    };
  } else if (age < 30) {
    return {
      guidance: "Use modern, relatable language. Direct communication is appreciated. You can use contemporary examples and metaphors.",
      complexity: "moderate",
      safety: "moderate"
    };
  } else {
    return {
      guidance: "Use formal, reflective language. Deeper philosophical and theological concepts are appropriate. You can explore complex spiritual ideas.",
      complexity: "advanced",
      safety: "standard"
    };
  }
}

/**
 * Build personalized system prompt with all constraints
 */
function buildPersonalizedPrompt(persona, personaObj, user, deityBooks, toneGuidance) {
  const basePersonality = personaObj.style || '';
  
  return `You are ${personaObj.name}. You're having a friendly conversation.

${basePersonality}

CRITICAL RULES:
1. Keep responses VERY SHORT (1-2 sentences maximum)
2. Be warm and friendly, not formal or preachy
3. Use simple, everyday language
4. Speak naturally as "I" - you ARE the deity
5. Be helpful and supportive

${user.age < 18 ? 'User is under 18 - use gentle, age-appropriate language.' : ''}

Remember: Short, warm, natural responses only. Like texting a wise friend.`;
}

/**
 * 🧠 ENHANCED: Build system prompt with memory context and adaptive responses
 */
function buildEnhancedPersonalizedPrompt(persona, personaObj, user, deityBooks, toneGuidance, memoryContext, questionAnalysis) {
  const basePersonality = personaObj.style || '';
  
  // Get adaptive prompt based on question complexity
  const adaptivePrompt = responseAdaptation.generateAdaptivePrompt(
    persona, 
    questionAnalysis.responseStyle, 
    questionAnalysis
  );
  
  // Build conversation context - ALWAYS include for continuity
  let conversationContext = '';
  if (memoryContext.conversationSummary) {
    conversationContext = `\nCONVERSATION BACKGROUND: ${memoryContext.conversationSummary}`;
  }
  
  // Build user memory context - Include for guidance questions
  let userMemoryContext = '';
  if (questionAnalysis.responseStyle === 'full_guidance' && memoryContext.userMemories && memoryContext.userMemories.length > 0) {
    const importantMemories = memoryContext.userMemories
      .slice(0, 2) // Top 2 most important memories
      .map(m => `- ${m.content}`)
      .join('\n');
    
    userMemoryContext = `\nUSER BACKGROUND:\n${importantMemories}`;
  }
  
  // Add length guidance
  const lengthGuidance = responseAdaptation.addLengthGuidance(questionAnalysis.responseStyle);
  
  // Avoid formulaic endings for simple questions
  const avoidFormulaic = responseAdaptation.shouldAvoidFormulaic(questionAnalysis.responseStyle);
  const formularicWarning = avoidFormulaic ? 
    '\nIMPORTANT: Do NOT add philosophical endings or formulaic phrases unless the question specifically asks for wisdom or guidance. Keep it natural and conversational.' : '';
  
  // Add continuity instruction - this is key for story-like conversations
  const continuityInstruction = `
CRITICAL: This is an ongoing conversation. The conversation history will be provided in the messages above. 
- Reference previous topics naturally when relevant
- Build upon what you've discussed before
- Maintain emotional continuity from previous exchanges
- Create a flowing, story-like dialogue
- Remember what the user has shared and acknowledge it appropriately`;
  
  return `${adaptivePrompt}

${user.age < 18 ? 'User is under 18 - use gentle, age-appropriate language.' : ''}

RESPONSE STYLE: ${lengthGuidance}
${formularicWarning}
${continuityInstruction}
${conversationContext}
${userMemoryContext}

Remember: You have access to the full conversation history above. Use it to maintain natural continuity and create meaningful, connected responses.`;
}

router.post('/', async (req,res) => {
  const { conversationId, persona='krishna', text, message, audio=false } = req.body;
  const userMessage = text || message; // Support both 'text' and 'message' fields
  
  console.log(`[Chat] New request - conversationId: ${conversationId}, persona: ${persona}, text: "${userMessage ? userMessage.substring(0, 50) : 'undefined'}..."`);
  
  if(!userMessage) {
    return res.status(400).json({ error: 'text or message required' });
  }

  try {
    // Get user from auth middleware or use demo user
    let user;
    
    if (req.user && req.user.userId) {
      // Authenticated user
      const db = getDb();
      user = await db.collection('users').findOne({ _id: req.user.userId });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      // Demo mode - create a temporary user object
      user = {
        name: 'Guest',
        age: 25,
        religion: 'all', // Allow access to all deities in demo mode
        email: 'demo@example.com'
      };
    }

    // Extract base persona name (remove language suffix if present)
    const basePersona = persona.replace(/_[a-z]{2}$/, '');

    // Validate deity belongs to user's religion (skip for demo mode with 'all' religion)
    // TEMPORARILY DISABLED: Allow access to all deities for testing
    /*
    if (user.religion !== 'all' && !isDeityValidForReligion(user.religion, basePersona)) {
      const availableDeities = getDeitiesForReligion(user.religion);
      return res.status(403).json({ 
        error: 'Deity not available for your religion',
        message: `As a ${user.religion} user, you can only interact with deities from your tradition.`,
        availableDeities: availableDeities.map(d => ({ id: d.id, name: d.name, description: d.description }))
      });
    }
    */

    // Get deity's books and group for filtering
    let deityBooks, deityGroup;
    
    if (user.religion === 'all') {
      // Demo mode - allow all books
      deityBooks = ['All Sacred Texts'];
      deityGroup = 'all';
    } else {
      // UPDATED: Get books for the deity's actual religion, not user's religion
      const deityReligion = getDeityReligion(basePersona);
      if (deityReligion) {
        deityBooks = getBooksForDeity(deityReligion, basePersona);
        deityGroup = getDeityGroup(deityReligion, basePersona);
      } else {
        // Fallback if deity religion not found
        deityBooks = ['All Sacred Texts'];
        deityGroup = 'all';
      }
    }

    console.log(`[Chat] User: ${user.name} (${user.religion}), Deity: ${basePersona}, Books: ${deityBooks.join(', ')}`);

    // Moderation (skip in demo mode or if it fails)
    if(!DEMO_MODE){
      try {
        const mod = await moderate(userMessage);
        if(mod && mod.results && mod.results[0] && mod.results[0].categories){
          const flagged = mod.results[0].flagged;
          if(flagged){
            return res.status(200).json({ 
              reply: { 
                text: 'Your message was flagged by moderation and cannot be processed.', 
                persona, 
                referencedSources: [], 
                audioUrl: null, 
                audioStatus: 'failed', 
                timestamp: new Date().toISOString() 
              } 
            });
          }
        }
      } catch (modError) {
        console.warn('[Chat] Moderation failed, continuing without moderation:', modError.message);
      }
    }

    // Use Intent Layer for intelligent classification
    let intentClassification, questionType;
    
    if (USE_INTENT_LAYER) {
      // LLM-based intent classification
      intentClassification = await classifyIntent(userMessage);
      console.log(`[Intent] ${intentClassification.intent} (RAG: ${intentClassification.useScriptureRAG}, confidence: ${intentClassification.confidence})`);
      
      // Convert to questionType format for compatibility
      questionType = {
        needsReference: intentClassification.useScriptureRAG,
        category: intentClassification.intent.toLowerCase()
      };
    } else {
      // Fallback to keyword-based classification
      questionType = classifyQuestion(userMessage);
      console.log(`[Chat] Question classified as: ${questionType.category} (needsReference: ${questionType.needsReference})`);
    }

    // Load persona (now async with MCP support)
    const personaObj = await loadPersona(persona);
    if(!personaObj){
      return res.status(404).json({ error: `Persona ${persona} not found` });
    }

    // 🧠 BUILD ENHANCED CONTEXT using layered memory system
    console.log(`[Memory] Building context for conversationId: ${conversationId}, userId: ${req.user?.userId || 'null'}`);
    
    const memoryContext = await conversationMemory.buildContext(
      conversationId, 
      req.user?.userId || null
    );

    console.log(`[Memory] Context built - Summary: ${memoryContext.conversationSummary ? 'Yes' : 'No'}, Recent messages: ${memoryContext.recentMessages?.length || 0}, User memories: ${memoryContext.userMemories?.length || 0}`);
    
    // Debug: Log recent messages if any
    if (memoryContext.recentMessages && memoryContext.recentMessages.length > 0) {
      console.log(`[Memory] Recent messages found:`);
      memoryContext.recentMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.role}: "${msg.text.substring(0, 50)}..."`);
      });
    } else {
      console.log(`[Memory] No recent messages found for conversation ${conversationId}`);
    }

    // 🎯 ANALYZE QUESTION for adaptive responses
    const questionAnalysis = responseAdaptation.analyzeQuestion(userMessage);
    console.log(`[Adaptive] Question analysis: ${questionAnalysis.responseStyle} (complexity: ${questionAnalysis.complexity})`);

    // 🧠 SMART RESPONSE ANALYSIS for length and style control
    const smartAnalysis = smartResponseController.analyzeMessage(userMessage);
    console.log(`[Smart] Response style: ${smartAnalysis.responseStyle} (${smartAnalysis.wordCount} words, max tokens: ${smartAnalysis.maxTokens})`);

    // Get age-appropriate tone
    const toneGuidance = getAgeAppropriateTone(user.age);

    // Build enhanced system prompt with memory context and adaptive responses
    const systemPrompt = buildEnhancedPersonalizedPrompt(
      basePersona,
      personaObj,
      user,
      deityBooks,
      toneGuidance,
      memoryContext,
      questionAnalysis
    );

    console.log(`[Memory] System prompt includes: ${memoryContext.conversationSummary ? 'conversation summary, ' : ''}${memoryContext.recentMessages?.length > 0 ? 'recent messages, ' : ''}${memoryContext.userMemories?.length > 0 ? 'user memories' : 'no additional context'}`);

    // Initialize retrieved array for RAG results
    let retrieved = [];

    // Build context from retrieved chunks
    let answer = null;
    let usedSources = [];
    
    if(retrieved && retrieved.length > 0){
      // Try to find direct match
      const userQuery = userMessage.toLowerCase().replace(/["'`]/g, '');
      for(const r of retrieved){
        if(!r.payload || !r.payload.text) continue;
        const snippetLower = r.payload.text.toLowerCase();
        if(snippetLower.includes(userQuery) || userQuery.includes(snippetLower.slice(0, Math.min(200, snippetLower.length)))){
          answer = r.payload.text;
          usedSources = [{ source_title: r.payload.source_title, snippet_id: r.id }];
          break;
        }
      }
    }

    // If no direct match, use LLM
    if(!answer){
      const contextSnippets = retrieved.length > 0 
        ? retrieved.map(r => `---BEGIN SNIPPET---\n${r.payload.text}\n---END SNIPPET---\n(Source: ${r.payload.source_title || 'Unknown'})`).join('\n\n')
        : '(No retrieved context available)';

      let contextInstruction, userPrompt;
      
      // Different prompts based on question type
      if (questionType.needsReference && retrieved.length > 0) {
        // Spiritual/emotional question with references
        contextInstruction = `Here are relevant teachings: ${contextSnippets}`;
        userPrompt = `"${text}"\n\nRespond as ${personaObj.name}. Keep it short (1-2 sentences) and natural.`;
      } else if (questionType.needsReference && retrieved.length === 0) {
        // Spiritual question but no references found
        contextInstruction = `Respond from your wisdom as ${personaObj.name}.`;
        userPrompt = `"${text}"\n\nGive a short, caring response (1-2 sentences).`;
      } else {
        // Casual question - no references needed
        contextInstruction = `This is casual conversation.`;
        userPrompt = `"${text}"\n\nRespond naturally as ${personaObj.name}. Keep it brief and friendly.`;
      }
      
      // 🧠 BUILD CONVERSATION HISTORY for LLM context
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextInstruction }
      ];

      // Add recent conversation history to maintain continuity
      if (memoryContext.recentMessages && memoryContext.recentMessages.length > 0) {
        console.log(`[Memory] Adding ${memoryContext.recentMessages.length} recent messages to LLM context`);
        
        // Add recent messages as conversation history
        memoryContext.recentMessages.forEach((msg, index) => {
          if (msg.role === 'user') {
            messages.push({ role: 'user', content: msg.text });
            console.log(`[Memory] Added user message ${index + 1}: "${msg.text.substring(0, 50)}..."`);
          } else if (msg.role === 'assistant') {
            messages.push({ role: 'assistant', content: msg.text });
            console.log(`[Memory] Added assistant message ${index + 1}: "${msg.text.substring(0, 50)}..."`);
          }
        });
      }

      // Add current user message
      messages.push({ role: 'user', content: userPrompt });
      
      console.log(`[Memory] Final message array has ${messages.length} messages total`);

      let completion;
      try{
        // Use Intent-Based Response if enabled
        if (USE_INTENT_LAYER && intentClassification) {
          console.log('[Intent] Generating intent-based response with conversation history');
          
          // Prepare retrieved texts in simple format
          const retrievedTexts = retrieved.map(r => ({
            text: r.payload.text,
            source: r.payload.source_title || 'Sacred Text'
          }));
          
          // Pass conversation history to intent-based response
          answer = await generateIntentBasedResponse(
            userMessage,
            intentClassification.intent,
            personaObj,
            retrievedTexts,
            memoryContext.recentMessages || [] // Add conversation history
          );
          
          console.log(`[Intent] Response generated for ${intentClassification.intent} with ${memoryContext.recentMessages?.length || 0} previous messages`);
        } else {
          // Enhanced LLM approach with Sarvam AI primary + OpenRouter fallback
          console.log(`[Chat] Using Enhanced LLM Manager (Sarvam AI primary) for ${persona}`);
          
          // Prepare retrieved texts in simple format
          const retrievedTexts = retrieved.map(r => ({
            text: r.payload.text,
            source: r.payload.source_title || 'Sacred Text'
          }));
          
          const llmResult = await enhancedLLM.generateSpiritualResponse(userMessage, persona, {
            language: user.language || 'en',
            context: retrievedTexts,
            memoryContext: memoryContext.recentMessages || [],
            temperature: smartAnalysis.responseStyle === 'crispy' ? 0.7 : 0.8,
            max_tokens: smartAnalysis.maxTokens,
            systemPrompt: smartResponseController.generateSmartPrompt(persona, smartAnalysis, userMessage)
          });
          
          if (llmResult.success) {
            answer = llmResult.response;
            console.log(`[Chat] ✅ Response generated with ${llmResult.provider} (${llmResult.duration}ms, Cultural Score: ${Math.round(llmResult.culturalScore)}%)`);
          } else {
            console.error(`[Chat] ❌ Enhanced LLM failed:`, llmResult.error);
            // Use fallback response
            answer = llmResult.fallbackResponse || 'I apologize, but I am unable to respond at this moment. Please try again.';
          }
        }
      }catch(e){
        console.error('[Chat] LLM error', e.message);
        return res.status(500).json({ error: 'LLM error' });
      }
    }

    // Humanize the response to make it natural and conversational
    const { humanizeIfNeeded, extractSimpleCitation } = require('../lib/responseHumanizer');
    const { enhanceRAGResponse } = require('../lib/responseStyler');
    const { addEmotionalNarrationStructured } = require('../lib/emotionalNarratorStructured');
    let simpleCitation = null;
    
    if (retrieved.length > 0) {
      const firstRef = retrieved[0];
      const payload = firstRef.payload || {};
      
      // Build simple source citation
      let sourceTitle = payload.source_title || payload.file || payload.book;
      
      if (sourceTitle && payload.chapter && payload.verse) {
        simpleCitation = `${sourceTitle} ${payload.chapter}:${payload.verse}`;
      } else if (sourceTitle && payload.chapter) {
        simpleCitation = `${sourceTitle}, Chapter ${payload.chapter}`;
      } else if (sourceTitle) {
        simpleCitation = sourceTitle;
      }
      
      console.log(`[Chat] Simple citation: ${simpleCitation}`);
    }
    
    // Humanize the response to make it natural and conversational
    const shouldUseEnhancedHumanization = smartResponseController.shouldUseEnhancedHumanization(smartAnalysis);
    console.log(`[Humanizer] Using ${shouldUseEnhancedHumanization ? 'enhanced' : 'standard'} humanization for ${smartAnalysis.responseStyle} response`);
    
    const humanized = await humanizeIfNeeded(
      answer,
      userMessage,
      personaObj,
      simpleCitation ? { source: simpleCitation } : null
    );
    
    // Update answer with humanized version
    answer = humanized.text;
    simpleCitation = humanized.source;
    
    // Skip complex styling for more natural responses
    console.log('[Styler] Using natural response without heavy styling');
    
    // Skip complex length control for more natural responses
    console.log('[Length] Using natural response length');
    
    // Skip complex emotional narration for more natural responses
    let emotionalResponse = {
      tone: 'natural',
      narration: 'conversational',
      emotion_reason: 'simplified_response',
      spoken_text: answer,
      tts_text: answer,
      citations: []
    };
    
    console.log('[Emotion] Using simplified natural response format');

    // Generate speech if requested
    let audioUrl = null;
    let audioStatus = 'none';
    if (audio) {
      audioStatus = 'pending';
      try {
        if (TTS_PROVIDER === 'google') {
          console.log('[TTS] Google TTS temporarily disabled');
          // audioUrl = await googleTTS.generateSpeech(answer, persona);
        } else if (TTS_PROVIDER === 'elevenlabs') {
          console.log('[TTS] Using ElevenLabs TTS with emotional parameters');
          // Use TTS-optimized text and emotional parameters
          const ttsText = emotionalResponse.tts_text || answer;
          const emotionalParams = {
            tone: emotionalResponse.tone,
            narration: emotionalResponse.narration
          };
          audioUrl = await generateElevenLabsSpeech(ttsText, persona, emotionalParams);
        }
        
        audioStatus = audioUrl ? 'success' : 'failed';
      } catch (e) {
        console.error('[TTS] Error', e.message);
        audioStatus = 'failed';
      }
    }

    // 🧠 ENHANCED MEMORY SYSTEM: Use layered conversation memory
    try {
      if (conversationId) {
        console.log(`[Memory] Storing messages with enhanced memory system: ${conversationId}`);
        
        // Extract metadata for memory system
        const userMetadata = {
          emotion: intentClassification?.emotion || null,
          topic: intentClassification?.intent || questionType?.category || null,
          needsReference: questionType?.needsReference || false
        };

        const assistantMetadata = {
          persona: basePersona,
          referencedSources: usedSources,
          reference: simpleCitation ? { source: simpleCitation } : null,
          audioUrl,
          audioStatus,
          hasAudio: !!audioUrl
        };

        // Store messages using memory system
        await conversationMemory.addMessage(conversationId, 'user', userMessage, userMetadata);
        await conversationMemory.addMessage(conversationId, 'assistant', answer, assistantMetadata);

        // Store important user memories if this is a meaningful conversation
        if (req.user?.userId && (questionType?.needsReference || intentClassification?.confidence > 0.7)) {
          // Store user preferences or patterns
          if (intentClassification?.intent === 'spiritual_guidance') {
            await conversationMemory.storeUserMemory(
              req.user.userId, 
              conversationId, 
              'spiritual_pattern', 
              `Seeks ${basePersona} guidance about ${intentClassification.topic || 'spiritual matters'}`
            );
          }
        }

        // Legacy: Also update conversation for backward compatibility
        const db = getDb();
        const conv = await db.collection('conversations').findOne({ _id: conversationId });
        const isFirstMessage = !conv || !conv.messages || conv.messages.length === 0;
        
        const updateOps = {
          $set: { 
            updatedAt: new Date(),
            persona: basePersona
          }
        };
        
        // Auto-generate title from first user message and set userId
        if (isFirstMessage) {
          const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
          updateOps.$set.title = title;
          
          if (req.user && req.user.userId) {
            updateOps.$set.userId = req.user.userId;
          } else {
            updateOps.$set.userId = null;
          }
          
          console.log(`[Memory] Setting conversation title: "${title}"`);
        }
        
        await db.collection('conversations').updateOne(
          { _id: conversationId },
          updateOps,
          { upsert: true }
        );
        
        console.log(`[Memory] Successfully stored conversation with enhanced memory system`);
      } else {
        console.warn('[Memory] No conversationId provided - messages not persisted');
      }
    } catch (e) {
      console.error('[Memory] Enhanced memory storage failed:', e.message);
      console.error('[Memory] Full error:', e);
    }

    res.json({ 
      reply: { 
        text: answer, 
        persona, 
        referencedSources: usedSources,
        reference: simpleCitation ? { source: simpleCitation } : null,
        audioUrl,
        audioStatus,
        timestamp: new Date().toISOString(),
        // Enhanced emotional data for UI and TTS
        emotion: emotionalResponse ? {
          tone: emotionalResponse.tone,
          narration: emotionalResponse.narration,
          reason: emotionalResponse.emotion_reason,
          tts_text: emotionalResponse.tts_text,
          citations: emotionalResponse.citations
        } : null
      } 
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ error: 'Chat processing failed', details: error.message });
  }
});

module.exports = router;
/**
 * GET /api/chat/llm-stats
 * Get LLM provider statistics and performance metrics
 */
router.get('/llm-stats', async (req, res) => {
  try {
    const stats = enhancedLLM.getStats();
    const providerStatus = enhancedLLM.getProviderStatus();
    
    res.json({
      success: true,
      stats,
      providerStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Chat] Error getting LLM stats:', error);
    res.status(500).json({ error: 'Failed to get LLM statistics' });
  }
});

/**
 * POST /api/chat/test-providers
 * Test all LLM providers
 */
router.post('/test-providers', async (req, res) => {
  try {
    console.log('[Chat] Testing all LLM providers...');
    const testResults = await enhancedLLM.testProviders();
    
    res.json({
      success: true,
      testResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Chat] Error testing providers:', error);
    res.status(500).json({ error: 'Failed to test LLM providers' });
  }
});