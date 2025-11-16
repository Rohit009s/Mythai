const OpenAI = require('openai');

// Check if running in demo mode
const DEMO_MODE = !process.env.OPENAI_API_KEY;

let client = null;
function getClient(){
  if(DEMO_MODE) return null;
  if(client) return client;
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

async function embedText(text, model = process.env.OPENAI_EMBED_MODEL){
  if(DEMO_MODE){
    // Return random mock embedding for demo
    return new Array(parseInt(process.env.VECTOR_DIM || '1536', 10)).fill(0).map(() => Math.random());
  }
  const c = getClient();
  const m = model || 'text-embedding-3-small';
  const res = await c.embeddings.create({ model: m, input: text });
  return res.data[0].embedding;
}

async function moderate(text){
  if(DEMO_MODE) return null;
  try{
    const c = getClient();
    const res = await c.moderations.create({ model: 'omni-moderation-latest', input: text });
    return res;
  }catch(e){
    console.warn('Moderation failed', e.message);
    return null;
  }
}

async function chatCompletion(messages, model = process.env.OPENAI_CHAT_MODEL, temperature = parseFloat(process.env.TEMPERATURE || '0.2')){
  if(DEMO_MODE){
    // Return mock response for demo
    return {
      choices: [{
        message: {
          content: 'This is a demo response. In production, this would call the OpenAI API. The retrieved sources should appear above. (Source: Demo Data)'
        }
      }]
    };
  }
  const c = getClient();
  const res = await c.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages,
    temperature,
    max_tokens: parseInt(process.env.MAX_TOKENS || '800', 10)
  });
  return res;
}

module.exports = { embedText, chatCompletion, moderate, DEMO_MODE };
