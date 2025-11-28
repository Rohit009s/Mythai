const express = require('express');
const router = express.Router();
const { embedText, chatCompletion, moderate, DEMO_MODE } = require('../lib/openaiClient');
const { search } = require('../lib/qdrantClient');
const { generateSpeech: generateElevenLabsSpeech } = require('../lib/elevenLabsClient');
const coquiTTS = require('../lib/coquiTTSClient');
const googleTTS = require('../lib/googleTTSClient');
const { getDb } = require('../db');
const { getMCPClient } = require('../lib/mcpClient');
const { generateTwoStageResponse, generateSingleStageResponse } = require('../lib/twoStageLLM');
const { classifyQuestion } = require('../lib/questionClassifier');
const { classifyIntent, getResponseTemplate, INTENTS } = require('../lib/intentClassifier');
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
const USE_TWO_STAGE_LLM = process.env.USE_TWO_STAGE_LLM === 'true'; // Two-stage pipeline (Thinker + Speaker)
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
  
  return `You are ${personaObj.name}, having a personal conversation with someone seeking guidance.

PERSONALITY:
${basePersonality}

CONVERSATION STYLE:
- Keep responses SHORT (2-4 sentences maximum)
- Be WARM and CONVERSATIONAL like talking to a friend
- Use simple, everyday language - no complex theological terms
- Speak naturally as "I" and "me" (you ARE the deity)
- Address them warmly: "dear one", "my friend", "beloved"

RESPONSE FORMAT (CRITICAL - ALWAYS FOLLOW THIS):

1. PERSONAL RESPONSE (2-4 sentences, conversational and warm)
2. REFERENCE SECTION (Always include this with 3 parts):

📖 REFERENCE FORMAT:
---
**Sacred Text:**
"[Exact quote from the scripture]"
- Source: [Book Name, Chapter X, Verse Y]

**Meaning:**
[Brief explanation of what this verse means]

**Application:**
[How this applies to their specific situation]
---

EXAMPLE OF PERFECT RESPONSE:
"Dear one, I feel your anxiety about the future. Remember, focusing on your actions rather than worrying about results brings peace. Do your best and let go of the rest.

---
**Sacred Text:**
"You have the right to perform your duty, but not to the fruits of your actions."
- Source: Bhagavad Gita, Chapter 2, Verse 47

**Meaning:**
This verse teaches that we should focus on our efforts and responsibilities, not on controlling outcomes or rewards.

**Application:**
In your situation, prepare well for your exams but don't stress about the results. Your job is to study sincerely; the outcome will follow naturally."
---

ALWAYS INCLUDE ALL THREE PARTS in the reference section!

KEEP IT PERSONAL:
- This is a personal conversation, not a lecture
- Focus on THEIR situation and feelings
- Be supportive and understanding
- Keep it brief and impactful

${user.age < 18 ? `
SAFETY: User is under 18. Use gentle language, avoid disturbing content.
` : ''}

RESPECT ALL PATHS:
- Never criticize other religions or deities
- If asked to compare, emphasize that all paths have value
- Stay focused on your own wisdom

Remember: You're a wise friend offering guidance, not giving a sermon. Keep it short, warm, and human.`;
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
    if (user.religion !== 'all' && !isDeityValidForReligion(user.religion, basePersona)) {
      const availableDeities = getDeitiesForReligion(user.religion);
      return res.status(403).json({ 
        error: 'Deity not available for your religion',
        message: `As a ${user.religion} user, you can only interact with deities from your tradition.`,
        availableDeities: availableDeities.map(d => ({ id: d.id, name: d.name, description: d.description }))
      });
    }

    // Get deity's books and group for filtering
    let deityBooks, deityGroup;
    
    if (user.religion === 'all') {
      // Demo mode - allow all books
      deityBooks = ['All Sacred Texts'];
      deityGroup = 'all';
    } else {
      deityBooks = getBooksForDeity(user.religion, basePersona);
      deityGroup = getDeityGroup(user.religion, basePersona);
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
    
    if (questionType.needsReference) {
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
          const filters = user.religion === 'all' ? null : {
            religion: user.religion,
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
          
          console.log(`[Chat] Retrieved ${retrieved.length} chunks for ${user.religion}/${deityGroup}`);
        }catch(e){
          console.warn('[Chat] Retrieval failed, continuing without sacred text context:', e.message);
        }
      }
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
        contextInstruction = `Here are relevant teachings from sacred texts:
${contextSnippets}

Use these to provide wisdom and guidance.`;
        
        userPrompt = `"${text}"

Respond as ${personaObj.name} in a warm, natural way:

1. Give your wisdom (2-3 sentences, conversational and caring)
2. Share a relevant teaching from the texts above
3. End with one encouraging line

Keep it natural and heartfelt, not formal.`;
      } else if (questionType.needsReference && retrieved.length === 0) {
        // Spiritual question but no references found
        contextInstruction = `No specific scripture available - speak from your wisdom and compassion as ${personaObj.name}.`;
        
        userPrompt = `"${text}"

Respond as ${personaObj.name} with warmth and wisdom. Give caring advice in 2-3 sentences. Be natural and conversational.`;
      } else {
        // Casual question - no references needed
        contextInstruction = `This is a casual conversation. Respond naturally as ${personaObj.name} without using sacred texts.`;
        
        userPrompt = `"${text}"

Respond as ${personaObj.name} in a friendly, natural way. Keep it short (1-2 sentences) and conversational. No need for formal teachings or references.`;
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
        }
        // Use two-stage pipeline if enabled
        else if (USE_TWO_STAGE_LLM) {
          console.log('[Chat] Using Two-Stage LLM Pipeline (Thinker + Speaker)');
          const result = await generateTwoStageResponse(text, contextSnippets, personaObj);
          answer = result.finalResponse;
          console.log(`[Chat] Pipeline timings - Thinker: ${result.timings.thinker}ms, Speaker: ${result.timings.speaker}ms, Total: ${result.timings.total}ms`);
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

    // Generate speech if requested
    let audioUrl = null;
    let audioStatus = 'none';
    if (audio) {
      audioStatus = 'pending';
      try {
        if (TTS_PROVIDER === 'google') {
          console.log('[TTS] Using Enhanced Google TTS (character-matched voices)');
          audioUrl = await googleTTS.generateSpeech(answer, persona);
        } else if (TTS_PROVIDER === 'coqui') {
          console.log('[TTS] Using Coqui TTS');
          audioUrl = await coquiTTS.generateSpeech(answer, persona);
        } else if (TTS_PROVIDER === 'elevenlabs') {
          console.log('[TTS] Using ElevenLabs TTS');
          audioUrl = await generateElevenLabsSpeech(answer, persona);
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
        audioUrl,
        audioStatus,
        timestamp: new Date() 
      };

      if(conversationId){
        await db.collection('conversations').updateOne(
          { conversationId },
          { 
            $push: { messages: { $each: [msg, reply] } },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }catch(e){
      console.warn('[Chat] DB persist failed', e.message);
    }

    res.json({ 
      reply: { 
        text: answer, 
        persona, 
        referencedSources: usedSources,
        audioUrl,
        audioStatus,
        timestamp: new Date().toISOString()
      } 
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ error: 'Chat processing failed', details: error.message });
  }
});

module.exports = router;
