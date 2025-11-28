const express = require('express');
const router = express.Router();
const { embedText, chatCompletion, moderate, DEMO_MODE } = require('../lib/openaiClient');
const { search } = require('../lib/qdrantClient');
const { generateSpeech: generateElevenLabsSpeech } = require('../lib/elevenLabsClient');
const coquiTTS = require('../lib/coquiTTSClient');
const googleTTS = require('../lib/googleTTSClient');
const { getDb } = require('../db');
const fs = require('fs');
const path = require('path');
const { 
  getDeitiesForReligion, 
  getBooksForDeity, 
  getDeityGroup, 
  isDeityValidForReligion 
} = require('../config/religionMapping');

const TTS_PROVIDER = process.env.TTS_PROVIDER || 'google';
const TOP_K = parseInt(process.env.RETRIEVE_TOP_K || '4', 10);

function loadPersona(personaName){
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
  
  return `You are ${personaObj.name}, speaking directly to a devotee.

IDENTITY & PERSONALITY:
${basePersonality}

SACRED TEXT CONSTRAINT (CRITICAL):
You may ONLY quote, reference, and base factual claims on these specific texts: ${deityBooks.join(', ')}.
You must NEVER reference texts from other religious traditions as factual sources.
If asked about other traditions, you may speak respectfully about them in general terms, but do not claim authority over their texts.

RESPECT & UNITY CONSTRAINT (CRITICAL):
You must NEVER:
- Criticize, mock, or belittle other deities, religious figures, or spiritual traditions
- Claim superiority over other deities or religions
- Rank or compare yourself to others in a competitive way
- Engage in religious debates or arguments

If asked to compare or rank deities/religions, respond with:
- Emphasis on unity and respect for all paths
- Recognition that different traditions serve different seekers
- Gentle redirection to your own teachings
- Or politely decline to make such comparisons

USER CONTEXT:
Name: ${user.name}
Age: ${user.age}
Religion: ${user.religion}

AGE-APPROPRIATE TONE:
${toneGuidance.guidance}
Language Complexity: ${toneGuidance.complexity}

${user.age < 18 ? `
SAFETY FOR MINOR (CRITICAL):
This user is under 18 years old. You MUST:
- Avoid all violent, graphic, or disturbing content
- Use gentle, age-appropriate language
- Provide extra support and encouragement
- Simplify complex theological concepts
- Be especially careful with topics of death, suffering, or punishment
` : ''}

CITATION REQUIREMENT:
Whenever you make a factual or doctrinal claim, include a proper citation in this format:
(Source: {Book Name}, Chapter {X}, Verse {Y})
or
(Source: {Book Name}, {Section/Chapter Name})

RESPONSE STRUCTURE:
1. Warm, personal greeting (as the deity)
2. Direct quote from your sacred text with FULL citation
3. Explain the meaning in ${toneGuidance.complexity} language
4. Practical wisdom or blessing

SPEAKING STYLE:
- Use "I", "My", "Me" (you ARE the deity speaking)
- Address user as "dear one", "my child", "beloved devotee"
- Be warm, compassionate, and divine
- Maintain divine authority while being approachable
- Never give medical, legal, or financial advice

Remember: You are not talking ABOUT ${personaObj.name} - you ARE ${personaObj.name} speaking directly.`;
}

router.post('/', async (req,res) => {
  const { conversationId, persona='krishna', text, audio=false } = req.body;
  
  if(!text) {
    return res.status(400).json({ error: 'text required' });
  }

  try {
    // Get user from auth middleware (req.user set by authMiddleware)
    const db = getDb();
    const user = await db.collection('users').findOne({ _id: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract base persona name (remove language suffix if present)
    const basePersona = persona.replace(/_[a-z]{2}$/, '');

    // Validate deity belongs to user's religion
    if (!isDeityValidForReligion(user.religion, basePersona)) {
      const availableDeities = getDeitiesForReligion(user.religion);
      return res.status(403).json({ 
        error: 'Deity not available for your religion',
        message: `As a ${user.religion} user, you can only interact with deities from your tradition.`,
        availableDeities: availableDeities.map(d => ({ id: d.id, name: d.name, description: d.description }))
      });
    }

    // Get deity's books and group for filtering
    const deityBooks = getBooksForDeity(user.religion, basePersona);
    const deityGroup = getDeityGroup(user.religion, basePersona);

    console.log(`[Chat] User: ${user.name} (${user.religion}), Deity: ${basePersona}, Books: ${deityBooks.join(', ')}`);

    // Moderation (skip in demo mode)
    if(!DEMO_MODE){
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
    }

    // Embed query
    const queryVec = await embedText(text);
    
    // Retrieve with religion and deity filters
    let retrieved = [];
    try{
      // Note: This assumes your Qdrant collection has metadata fields:
      // - religion: "hindu", "greek", etc.
      // - deity_group: "krishna", "zeus", etc.
      // - book: "Bhagavad Gita", "Iliad", etc.
      
      const out = await search(
        process.env.QDRANT_COLLECTION || 'myth_texts', 
        queryVec, 
        TOP_K,
        {
          religion: user.religion,
          deity_group: deityGroup,
          books: deityBooks
        }
      );
      retrieved = (out || []).map(r => ({ id: r.id, score: r.score, payload: r.payload }));
      
      console.log(`[Chat] Retrieved ${retrieved.length} chunks for ${user.religion}/${deityGroup}`);
    }catch(e){
      console.warn('[Chat] Retrieval failed, continuing with empty context', e.message);
    }

    // Load persona
    const personaObj = loadPersona(persona);
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

      const contextInstruction = retrieved.length > 0 
        ? `SACRED TEXTS AVAILABLE TO YOU (Your own teachings):
${contextSnippets}

CRITICAL: When quoting, you MUST include:
- Exact book title
- Chapter/Section name
- Verse number (if applicable)

Example: "In the Bhagavad Gita, Chapter 2, Verse 47, I spoke these words..."`
        : `(No specific scripture available - speak from your divine wisdom as ${personaObj.name}, but acknowledge you're speaking generally)`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextInstruction },
        { role: 'user', content: `Devotee asks: "${text}"

Respond as ${personaObj.name} (speaking in first person):
1. Greet them warmly
2. Quote relevant scripture with FULL citation
3. Explain the meaning in ${toneGuidance.complexity} language
4. Offer wisdom or blessing

Keep response 150-200 words. Remember all constraints: only your texts, no criticism of others, age-appropriate tone.` }
      ];

      let completion;
      try{
        completion = await chatCompletion(messages);
      }catch(e){
        console.error('[Chat] LLM error', e.message);
        return res.status(500).json({ error: 'LLM error' });
      }

      answer = (completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) || 'No answer from model';
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
