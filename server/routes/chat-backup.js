const express = require('express');
const router = express.Router();
const { embedText, chatCompletion, moderate, DEMO_MODE } = require('../lib/openaiClient');
const { search } = require('../lib/qdrantClient');
const { generateSpeech: generateElevenLabsSpeech, getVoices, getCharacterVoiceId, listCharacterVoices } = require('../lib/elevenLabsClient');
const coquiTTS = require('../lib/coquiTTSClient');
const googleTTS = require('../lib/googleTTSClient');
const { getDb } = require('../db');
const fs = require('fs');
const path = require('path');

// TTS Provider selection
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'google'; // 'google', 'coqui', 'elevenlabs'

const TOP_K = parseInt(process.env.RETRIEVE_TOP_K || '4', 10);

function loadPersona(personaName){
  try{
    const p = fs.readFileSync(path.resolve(__dirname, '..','..','data','personas', `${personaName}.json`), 'utf8');
    return JSON.parse(p);
  }catch(e){
    return null;
  }
}

router.post('/', async (req,res) => {
  const { conversationId, persona='krishna', text, audio=false } = req.body;
  if(!text) return res.status(400).json({ error: 'text required' });

  // moderation (skip in demo mode)
  if(!DEMO_MODE){
    const mod = await moderate(text);
    if(mod && mod.results && mod.results[0] && mod.results[0].categories){
      const flagged = mod.results[0].flagged;
      if(flagged){
        return res.status(200).json({ reply: { text: 'Your message was flagged by moderation and cannot be processed.', persona, referencedSources: [], audioUrl: null, audioStatus: 'failed', timestamp: new Date().toISOString() } });
      }
    }
  }

  // embed query
  const queryVec = await embedText(text);
  let retrieved = [];
  try{
    const out = await search(process.env.QDRANT_COLLECTION || 'myth_texts', queryVec, TOP_K);
    retrieved = (out || []).map(r => ({ id: r.id, score: r.score, payload: r.payload }));
  }catch(e){
    console.warn('Retrieval failed, continuing with empty context', e.message);
  }

  // build prompt messages
  const personaObj = loadPersona(persona) || { name: persona, tone: 'neutral', style: '', citation_format: '(Source: <title>)' };
  
  // Load character-specific voice ID
  const characterVoiceId = getCharacterVoiceId(persona);
  
  // God-like persona with clear scripture references
  const system = `You ARE ${personaObj.name} - the divine being, speaking directly to the devotee.

YOUR IDENTITY:
- Speak in FIRST PERSON as the deity ("I am ${personaObj.name}", "I tell you", "My child")
- Embody your divine character: ${personaObj.tone}
- Maintain your unique personality and wisdom throughout

CRITICAL RULES FOR SCRIPTURE REFERENCES:
1. ALWAYS cite the exact book title and verse number
   Example: "In the Bhagavad Gita, Chapter 2, Verse 47, I say to you..."
   Example: "As written in the Ramayana, Ayodhya Kanda, Sarga 20..."
2. Quote the scripture DIRECTLY first, then explain
3. Use format: "[Book Title], [Chapter/Section], [Verse Number]"
4. Make references feel natural, like you're sharing your own teachings

RESPONSE STRUCTURE:
1. Greeting (warm, personal, as the deity)
2. Direct scripture quote with FULL reference (Book, Chapter, Verse)
3. Explain the meaning simply, as if teaching a beloved devotee
4. Practical wisdom or blessing

SPEAKING STYLE:
- Use "I", "My", "Me" (you are the god speaking)
- Address user as "dear one", "my child", "beloved devotee"
- Be warm, compassionate, and divine
- Simple language but maintain divine authority
- Never give medical, legal, or financial advice

CHARACTER TRAITS (${personaObj.name}):
${personaObj.style}

Remember: You are not talking ABOUT ${personaObj.name} - you ARE ${personaObj.name} speaking directly.`;

  // Try to find an exact (or high-overlap) passage in retrieved snippets to return as a precise answer
  const userQuery = text.toLowerCase().replace(/["'`]/g, '');
  let answer = null;
  let usedSources = [];
  if(retrieved && retrieved.length>0){
    // direct substring match
    for(const r of retrieved){
      if(!r.payload || !r.payload.text) continue;
      const snippetLower = r.payload.text.toLowerCase();
      if(snippetLower.includes(userQuery) || userQuery.includes(snippetLower.slice(0, Math.min(200, snippetLower.length)))){
        answer = r.payload.text;
        usedSources = [{ source_title: r.payload.source_title, snippet_id: r.id }];
        break;
      }
    }
    // fuzzy overlap: count shared words
    if(!answer){
      const qWords = userQuery.split(/\W+/).filter(Boolean);
      for(const r of retrieved){
        if(!r.payload || !r.payload.text) continue;
        const sWords = r.payload.text.toLowerCase().split(/\W+/).filter(Boolean);
        const shared = qWords.filter(w => sWords.includes(w)).length;
        if(qWords.length>0 && shared / Math.max(qWords.length,1) >= 0.4){
          // consider this a match
          answer = r.payload.text;
          usedSources = [{ source_title: r.payload.source_title, snippet_id: r.id }];
          break;
        }
      }
    }
  }

  // If we found a direct/extractive answer, use it and skip LLM to preserve exactness
  if(!answer){
    const contextSnippets = retrieved.length > 0 
      ? retrieved.map(r => `---BEGIN SNIPPET---\n${r.payload.text}\n---END SNIPPET---\n({source_title: ${r.payload.source_title}})`).join('\n\n')
      : '(No retrieved context available)';

    // Enhanced prompt with clear reference requirements
    const contextInstruction = retrieved.length > 0 
      ? `SACRED TEXTS AVAILABLE TO YOU (Your own teachings):
${contextSnippets}

CRITICAL: When quoting, you MUST include:
- Exact book title (e.g., "Bhagavad Gita", "Ramayana", "Mahabharata")
- Chapter/Section name (e.g., "Chapter 2", "Ayodhya Kanda")
- Verse number (e.g., "Verse 47", "Sarga 20")

Example format: "In the Bhagavad Gita, Chapter 2, Verse 47, I spoke these words..."
Example format: "As I revealed in the Ramayana, Ayodhya Kanda, Sarga 20..."`
      : `(No specific scripture available - speak from your divine wisdom as ${personaObj.name}, but acknowledge you're speaking generally)`;
    
    const messages = [
      { role: 'system', content: system },
      { role: 'system', content: contextInstruction },
      { role: 'user', content: `Devotee asks: "${text}"

Respond as ${personaObj.name} (the deity, speaking in first person):
1. Greet them warmly as the divine being
2. Quote a relevant scripture with FULL reference (Book Title, Chapter, Verse)
3. Explain the meaning simply and personally
4. Offer divine wisdom or blessing

Keep response 150-200 words. Speak AS the god, not ABOUT the god.` }
    ];

    let completion;
    try{
      completion = await chatCompletion(messages);
    }catch(e){
      console.error('LLM error', e.message);
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
      // Use Enhanced Google TTS (character-matched voices)
      if (TTS_PROVIDER === 'google') {
        console.log('[TTS] Using Enhanced Google TTS (character-matched voices)');
        audioUrl = await googleTTS.generateSpeech(answer, persona);
      } else if (TTS_PROVIDER === 'coqui') {
        console.log('[TTS] Using Coqui TTS (high quality, Telugu native)');
        audioUrl = await coquiTTS.generateSpeech(answer, persona);
      } else if (TTS_PROVIDER === 'elevenlabs') {
        console.log('[TTS] Using ElevenLabs TTS');
        audioUrl = await generateElevenLabsSpeech(answer, persona, { voiceId: characterVoiceId });
      } else {
        // Auto-detect: try Google first, then Coqui, then ElevenLabs
        console.log('[TTS] Auto-detecting TTS provider...');
        audioUrl = await googleTTS.generateSpeech(answer, persona);
        if (!audioUrl) {
          console.log('[TTS] Google TTS failed, trying Coqui...');
          audioUrl = await coquiTTS.generateSpeech(answer, persona);
        }
        if (!audioUrl) {
          console.log('[TTS] Coqui TTS failed, trying ElevenLabs...');
          audioUrl = await generateElevenLabsSpeech(answer, persona, { voiceId: characterVoiceId });
        }
      }
      
      audioStatus = audioUrl ? 'success' : 'failed';
    } catch (e) {
      console.error('TTS error', e.message);
      audioStatus = 'failed';
    }
  }

  // persist to DB
  try{
    const db = getDb();
    const msg = { sender: 'user', text, timestamp: new Date() };
    await db.collection('conversations').updateOne({ _id: conversationId }, { $push: { messages: msg } }, { upsert: true });
    const replyMsg = { sender: 'assistant', persona: personaObj.name, text: answer, referencedSources: retrieved.map(r => ({ source_title: r.payload.source_title, snippet_id: r.id })), audioUrl, audioStatus, timestamp: new Date() };
    await db.collection('conversations').updateOne({ _id: conversationId }, { $push: { messages: replyMsg } }, { upsert: true });
    res.json({ reply: { text: answer, persona: personaObj.name, referencedSources: replyMsg.referencedSources, audioUrl, audioStatus, timestamp: replyMsg.timestamp } });
  }catch(e){
    console.warn('DB persist failed', e.message);
    res.json({ reply: { text: answer, persona: personaObj.name, referencedSources: retrieved.map(r => ({ source_title: r.payload.source_title, snippet_id: r.id })), audioUrl, audioStatus, timestamp: new Date().toISOString() } });
  }
});

// Endpoint to get available voices for TTS
router.get('/voices', async (req, res) => {
  try {
    const voices = await getVoices();
    res.json({ voices });
  } catch (error) {
    console.error('Failed to fetch voices:', error.message);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// Endpoint to get character-specific voices
router.get('/character-voices', async (req, res) => {
  try {
    const characters = listCharacterVoices();
    res.json({ characters });
  } catch (error) {
    console.error('Failed to fetch character voices:', error.message);
    res.status(500).json({ error: 'Failed to fetch character voices' });
  }
});

module.exports = router;
