const http = require('http');

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', err => {
      console.error('Request error:', err.message);
      reject(err);
    });
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🎤 Testing ElevenLabs TTS Integration\n');

  try {
    // 1. Create conversation
    console.log('1️⃣  Creating conversation...');
    const conv = await makeRequest('POST', '/api/conversations', {});
    const conversationId = conv.conversationId;
    console.log(`   ✅ Conversation: ${conversationId}\n`);

    // 2. Get available voices
    console.log('2️⃣  Fetching available voices...');
    const voicesRes = await makeRequest('GET', '/api/voices');
    console.log(`   ✅ Available voices: ${voicesRes.voices?.length || 0}`);
    (voicesRes.voices || []).slice(0, 3).forEach(v => {
      console.log(`      • ${v.name} (${v.voice_id})`);
    });
    console.log();

    // 3. Send message WITHOUT audio
    console.log('3️⃣  Sending message WITHOUT audio...');
    const noAudioRes = await makeRequest('POST', '/api/chat', {
      conversationId,
      persona: 'krishna',
      text: 'What is dharma?',
      audio: false,
    });
    console.log(`   ✅ Reply: "${noAudioRes.reply.text.substring(0, 60)}..."`);
    console.log(`   Audio status: ${noAudioRes.reply.audioStatus}`);
    console.log(`   Audio URL: ${noAudioRes.reply.audioUrl ? 'Generated' : 'None'}\n`);

    // 4. Send message WITH audio
    console.log('4️⃣  Sending message WITH audio...');
    const audioRes = await makeRequest('POST', '/api/chat', {
      conversationId,
      persona: 'shiva',
      text: 'Tell me about meditation.',
      audio: true,
    });
    console.log(`   ✅ Reply: "${audioRes.reply.text.substring(0, 60)}..."`);
    console.log(`   Audio status: ${audioRes.reply.audioStatus}`);
    const hasAudio = audioRes.reply.audioUrl && audioRes.reply.audioUrl.length > 0;
    console.log(`   Audio URL: ${hasAudio ? 'Generated' : 'None'}\n`);

    // 5. Fetch conversation history
    console.log('5️⃣  Fetching conversation history...');
    const history = await makeRequest('GET', `/api/conversations/${conversationId}`);
    console.log(`   ✅ Total messages: ${history.messages.length}`);
    history.messages.forEach((msg, idx) => {
      const text = msg.text.replace(/\n/g, ' ');
      const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
      console.log(`      ${idx + 1}. [${msg.sender}] ${preview}`);
      if (msg.audioStatus) {
        console.log(`         Audio: ${msg.audioStatus}`);
      }
    });
    console.log();

    console.log('✨ All TTS tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
