#!/usr/bin/env node
/**
 * Test ElevenLabs TTS Integration
 * Run with: node test-tts.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTTS() {
  console.log('🎤 Testing ElevenLabs TTS Integration\n');

  try {
    // 1. Create conversation
    console.log('1️⃣  Creating conversation...');
    const convRes = await axios.post(`${BASE_URL}/conversations`, {});
    const conversationId = convRes.data.conversationId;
    console.log(`   ✅ Conversation: ${conversationId}\n`);

    // 2. Get available voices
    console.log('2️⃣  Fetching available voices...');
    const voicesRes = await axios.get(`${BASE_URL}/voices`);
    console.log(`   ✅ Available voices: ${voicesRes.data.voices.length}`);
    voicesRes.data.voices.slice(0, 3).forEach(v => {
      console.log(`      • ${v.name} (${v.voice_id})`);
    });
    console.log();

    // 3. Send message WITHOUT audio
    console.log('3️⃣  Sending message WITHOUT audio...');
    const noAudioRes = await axios.post(`${BASE_URL}/chat`, {
      conversationId,
      persona: 'krishna',
      text: 'What is dharma?',
      audio: false,
    });
    console.log(`   ✅ Reply: "${noAudioRes.data.reply.text.substring(0, 60)}..."`);
    console.log(`   Audio status: ${noAudioRes.data.reply.audioStatus}`);
    console.log(`   Audio URL: ${noAudioRes.data.reply.audioUrl ? 'Generated' : 'None'}\n`);

    // 4. Send message WITH audio
    console.log('4️⃣  Sending message WITH audio...');
    const audioRes = await axios.post(`${BASE_URL}/chat`, {
      conversationId,
      persona: 'shiva',
      text: 'Tell me about meditation.',
      audio: true,
    });
    console.log(`   ✅ Reply: "${audioRes.data.reply.text.substring(0, 60)}..."`);
    console.log(`   Audio status: ${audioRes.data.reply.audioStatus}`);
    console.log(`   Audio URL: ${audioRes.data.reply.audioUrl ? 'Generated (' + audioRes.data.reply.audioUrl.substring(0, 40) + '...)' : 'None'}\n`);

    // 5. Fetch conversation history to verify persistence
    console.log('5️⃣  Fetching conversation history...');
    const historyRes = await axios.get(`${BASE_URL}/conversations/${conversationId}`);
    console.log(`   ✅ Total messages: ${historyRes.data.messages.length}`);
    historyRes.data.messages.forEach((msg, idx) => {
      console.log(`      ${idx + 1}. [${msg.sender}] ${msg.text?.substring(0, 50)}${msg.text?.length > 50 ? '...' : ''}`);
      if (msg.audioStatus) {
        console.log(`         Audio: ${msg.audioStatus}`);
      }
    });
    console.log();

    console.log('✨ All TTS tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testTTS();
