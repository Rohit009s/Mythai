const express = require('express');
const router = express.Router();
const { embedText, chatCompletion, moderate, DEMO_MODE } = require('../lib/openaiClient');
const { search } = require('../lib/qdrantClient');
const { generateSpeech: generateElevenLabsSpeech } = require('../lib/elevenLabsClient');
const googleTTS = require('../lib/googleTTSClient');
const { getDb } = require('../db');
const { getMCPClient } = require('../lib/mcpClient');
const { classifyQuestion } = require('../lib/questionClassifier');
const { classifyIntent } = require('../lib/intentClassifier');
const { generateIntentBasedResponse } = require('../lib/intentBasedResponse');
const { detectLanguage, getPersonaSuffix, getLanguageInstruction } = require('../lib/languageDetector');
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

router.post('/', async (req,res) => {
  const { conversationId, persona='krishna', text, audio=false } = req.body;
  
  if(!text) {
    return res.status(400).json({ error: 'text required' });
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
        const mod = await moderate(text);
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
      intentClassification = await classifyIntent(text);
      console.log(`[Intent] ${intentClassification.intent} (RAG: ${intentClassification.useScriptureRAG}, confidence: ${intentClassification.confidence})`);
      
      // Convert to questionType format for compatibility
      questionType = {
        needsReference: intentClassification.useScriptureRAG,
        category: intentClassification.intent.toLowerCase()
      };
    } else {
      // Fallback to keyword-based classification
      questionType = classifyQuestion(text);
      console.log(`[Chat] Question classified as: ${questionType.category} (needsReference: ${questionType.needsReference})`);
    }
    
    // Embed query and retrieve (only if question needs references)
    let retrieved = [];
    
    // Check if deity has texts available in the database
    const deityReligion = getDeityReligion(basePersona);
    const hasTextsInDatabase = ['hinduism', 'christianity', 'islam'].includes(deityReligion);
    
    if (questionType.needsReference && hasTextsInDatabase) {
      // Try MCP search first if enabled
      if (USE_MCP) {
        try {
          const mcpClient = await getMCPClient();
          if (mcpClient.isAvailable()) {
            const mcpResults = await mcpClient.searchSacredTexts(text, user.religion, 'en');
            if (mcpResults && mcpResults.length > 0) {
              retrieved = mcpResults.map(r => ({
                id: `mcp-${r.line}`,
                score: 0.9,
                payload: {
                  text: r.text,
                  source_title: r.file,
                  context: r.context
                }
              }));
              console.log(`[MCP] Retrieved ${retrieved.length} chunks via MCP`);
            }
          }
        } catch (mcpError) {
          console.warn('[MCP] Search failed, falling back to Qdrant:', mcpError.message);
        }
      }
      
      // Fallback to Qdrant if MCP didn't return results
      if (retrieved.length === 0) {
        try{
          const queryVec = await embedText(text);
          
          // For guest users (religion: 'all'), don't apply filters - search all embeddings
          // UPDATED: Use deity's religion for filtering, not user's religion
          const filters = (user.religion === 'all' || !deityReligion) ? null : {
            religion: deityReligion,
            deity_group: deityGroup,
            books: deityBooks
          };
          
          const out = await search(
            process.env.QDRANT_COLLECTION || 'myth_texts', 
            queryVec, 
            TOP_K,
            filters
          );
          retrieved = (out || []).map(r => ({ id: r.id, score: r.score, payload: r.payload }));
          
          console.log(`[Chat] Retrieved ${retrieved.length} chunks for ${deityReligion}/${deityGroup}`);
        }catch(e){
          console.warn('[Chat] Retrieval failed, continuing without sacred text context:', e.message);
        }
      }
    } else if (questionType.needsReference && !hasTextsInDatabase) {
      console.log(`[Chat] Skipping retrieval for ${deityReligion} deity - texts not in database, using character knowledge only`);
    } else {
      console.log(`[Chat] Skipping retrieval for ${questionType.category} question`);
    }

    // Load persona (now async with MCP support)
    const personaObj = await loadPersona(persona);
    if(!personaObj){
      return res.status(404).json({ error: `Persona ${persona} not found` });
    }

    // Get age-appropriate tone
    const toneGuidance = getAgeAppropriateTone(user.age);

    // Build personalized system prompt
    const systemPrompt = buildPersonalizedPrompt(
      basePersona,
      personaObj,
      user,
      deityBooks,
      toneGuidance
    );

    // Build context from retrieved chunks
    let answer = null;
    let usedSources = [];
    
    if(retrieved && retrieved.length > 0){
      // Try to find direct match
      const userQuery = text.toLowerCase().replace(/["'`]/g, '');
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
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextInstruction },
        { role: 'user', content: userPrompt }
      ];

      let completion;
      try{
        // Use Intent-Based Response if enabled
        if (USE_INTENT_LAYER && intentClassification) {
          console.log('[Intent] Generating intent-based response');
          
          // Prepare retrieved texts in simple format
          const retrievedTexts = retrieved.map(r => ({
            text: r.payload.text,
            source: r.payload.source_title || 'Sacred Text'
          }));
          
          answer = await generateIntentBasedResponse(
            text,
            intentClassification.intent,
            personaObj,
            retrievedTexts
          );
          
          console.log(`[Intent] Response generated for ${intentClassification.intent}`);
        } else {
          // Standard single-stage approach
          completion = await chatCompletion(messages);
          answer = (completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) || 'No answer from model';
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
    const humanized = await humanizeIfNeeded(
      answer,
      text,
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
          console.log('[TTS] Using Enhanced Google TTS (character-matched voices)');
          audioUrl = await googleTTS.generateSpeech(answer, persona);
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

    // Persist to DB
    try{
      const db = getDb();
      const msg = { sender: 'user', text, timestamp: new Date() };
      const reply = { 
        sender: 'assistant', 
        text: answer, 
        persona, 
        referencedSources: usedSources,
        reference: simpleCitation ? { source: simpleCitation } : null,
        audioUrl,
        audioStatus,
        timestamp: new Date() 
      };

      if(conversationId){
        console.log(`[Chat] Persisting messages to conversation: ${conversationId}`);
        
        // Check if this is the first message to set title
        const conv = await db.collection('conversations').findOne({ _id: conversationId });
        const isFirstMessage = !conv || !conv.messages || conv.messages.length === 0;
        
        console.log(`[Chat] Conversation exists: ${!!conv}, Is first message: ${isFirstMessage}`);
        
        const updateOps = {
          $push: { messages: { $each: [msg, reply] } },
          $set: { 
            updatedAt: new Date(),
            persona: basePersona
          }
        };
        
        // Auto-generate title from first user message and set userId
        if (isFirstMessage) {
          const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
          updateOps.$set.title = title;
          
          // Set userId properly - use req.user.userId for authenticated users
          if (req.user && req.user.userId) {
            updateOps.$set.userId = req.user.userId;
          } else {
            updateOps.$set.userId = null; // Guest user
          }
          
          console.log(`[Chat] Setting conversation title: "${title}" and userId: ${updateOps.$set.userId}`);
        }
        
        const result = await db.collection('conversations').updateOne(
          { _id: conversationId },
          updateOps,
          { upsert: true } // Create conversation if it doesn't exist
        );
        
        console.log(`[Chat] Database update result: matched=${result.matchedCount}, modified=${result.modifiedCount}, upserted=${result.upsertedCount}`);
        
        if (result.matchedCount === 0 && result.upsertedCount === 0) {
          console.warn(`[Chat] Failed to update conversation ${conversationId} - conversation may not exist`);
        } else {
          console.log(`[Chat] Successfully persisted ${msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}`);
        }
      } else {
        console.warn('[Chat] No conversationId provided - messages not persisted');
      }
    }catch(e){
      console.error('[Chat] DB persist failed:', e.message);
      console.error('[Chat] Full error:', e);
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
