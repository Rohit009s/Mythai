// Quick test script to verify API endpoints work
const http = require('http');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('=== MythAI API Test ===\n');

  try {
    // Test 1: Create conversation
    console.log('1. Creating conversation...');
    const convRes = await request('POST', '/api/conversations', {});
    console.log(`   Status: ${convRes.status}`);
    const conversationId = convRes.body.conversationId;
    console.log(`   Conversation ID: ${conversationId}\n`);

    // Test 2: Send chat message
    console.log('2. Sending chat message...');
    const chatRes = await request('POST', '/api/chat', {
      conversationId,
      persona: 'krishna',
      text: 'I lied to help a friend. What should I do?',
      audio: false
    });
    console.log(`   Status: ${chatRes.status}`);
    console.log(`   Reply text (first 200 chars): ${chatRes.body.reply.text.substring(0, 200)}...`);
    console.log(`   Referenced sources: ${JSON.stringify(chatRes.body.reply.referencedSources)}\n`);

    // Test 3: Fetch conversation
    console.log('3. Fetching conversation...');
    const getRes = await request('GET', `/api/conversations/${conversationId}`);
    console.log(`   Status: ${getRes.status}`);
    console.log(`   Messages in conversation: ${getRes.body.messages.length}\n`);

    console.log('✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error(err);
  }
}

test();
