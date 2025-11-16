const express = require('express');
const router = express.Router();
const { embedText, chatCompletion, moderate, DEMO_MODE } = require('../lib/openaiClient');
const { search } = require('../lib/qdrantClient');
const { generateSpeech, getVoices } = require('../lib/elevenLabsClient');
const { getDb } = require('../db');
const fs = require('fs');
const path = require('path');

const TOP_K = parseInt(process.env.RETRIEVE_TOP_K || '4', 10);

function loadPersona(personaName){
  try{
    const p = fs.readFileSync(path.resolve(__dirname, '..','..','data','personas', `${personaName}.json`), 'utf8');
    return JSON.parse(p);
  }catch(e){
    return null;
  }
}

router.post('/chat', async (req,res) => {
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
  const system = `You are ${personaObj.name} as represented by classical Sanskrit texts. Speak in the persona's voice (tone: ${personaObj.tone}). Be respectful, thoughtful, and cite sources. Never give medical, legal, or financial advice. If the user expresses emotion, begin with one empathetic sentence.`;

  const contextSnippets = retrieved.length > 0 
    ? retrieved.map(r => `---BEGIN SNIPPET---\n${r.payload.text}\n---END SNIPPET---\n({source_title: ${r.payload.source_title}})`).join('\n\n')
    : '(No retrieved context available)';

  const messages = [
    { role: 'system', content: system },
    { role: 'system', content: `CONTEXT:\n${contextSnippets}` },
    { role: 'user', content: `Answer the following in ≤ 220 words and cite sources when making factual claims. User question: ${text}` }
  ];

  let completion;
  try{
    completion = await chatCompletion(messages);
  }catch(e){
    console.error('LLM error', e.message);
    return res.status(500).json({ error: 'LLM error' });
  }

  const answer = (completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) || 'No answer from model';

  // Generate speech if requested
  let audioUrl = null;
  let audioStatus = 'none';
  if (audio) {
    audioStatus = 'pending';
    try {
      audioUrl = await generateSpeech(answer);
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

module.exports = router;
