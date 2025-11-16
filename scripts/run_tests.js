const axios = require('axios');

async function run(){
  console.log('Simple API test: create conversation');
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const convRes = await axios.post(`${base}/api/conversations`, {});
  const conversationId = convRes.data.conversationId;
  console.log('conversationId:', conversationId);

  const queries = [
    'I lied to help a friend. What should I do?',
    'What does the Gita say about duty?',
    'Tell me the story of how Krishna lifted Govardhan.',
    'How can I invest my savings?',
    'I feel guilty and anxious — any guidance?'
  ];

  for(const q of queries){
    console.log('Query:', q);
    try{
      const res = await axios.post(`${base}/api/chat`, { conversationId, persona: 'krishna', text: q, audio: false });
      console.log('Reply:', (res.data && res.data.reply && res.data.reply.text) ? res.data.reply.text.substring(0,300) : JSON.stringify(res.data));
      console.log('Sources:', res.data.reply.referencedSources);
    }catch(e){
      console.error('Chat error', e.response ? e.response.data : e.message);
    }
    console.log('---');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
