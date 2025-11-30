const OpenAI = require('openai');

// Check which provider to use, in order of preference:
// 1. MiniLM (free, local, semantic embeddings)
// 2. Hugging Face (FREE, no API key required)
// 3. Open Router (open-source models, free tier)
// 4. Together AI (free alternative)
// 5. OpenAI (requires billing)
// 6. Mock mode (demo/testing)

const USE_MINILM = process.env.USE_MINILM !== 'false'; // Default to true
const USE_HUGGINGFACE = process.env.HUGGINGFACE_API_TOKEN ? true : false; // Use HF if token available
const USE_OPEN_ROUTER = !!process.env.OPEN_ROUTER_API_KEY && !USE_HUGGINGFACE;
const USE_TOGETHER = !!process.env.TOGETHER_API_KEY && !USE_OPEN_ROUTER && !USE_HUGGINGFACE;
const USE_OPENAI = !!process.env.OPENAI_API_KEY && !USE_OPEN_ROUTER && !USE_TOGETHER && !USE_HUGGINGFACE;
const DEMO_MODE = !USE_HUGGINGFACE && !USE_OPEN_ROUTER && !USE_TOGETHER && !USE_OPENAI || process.env.MOCK_OPENAI === 'true';

console.log('[LLM Provider] Using:', USE_HUGGINGFACE ? 'Hugging Face' : USE_OPEN_ROUTER ? 'OpenRouter' : USE_TOGETHER ? 'Together AI' : USE_OPENAI ? 'OpenAI' : 'Demo Mode');

let client = null;
let togetherClient = null;
let openRouterClient = null;
let huggingfaceClient = null;

function getClient(){
  if(DEMO_MODE) return null;
  if(USE_HUGGINGFACE) {
    if(!huggingfaceClient) huggingfaceClient = require('./huggingfaceClient');
    return huggingfaceClient;
  }
  if(USE_OPEN_ROUTER) {
    if(!openRouterClient) openRouterClient = require('./openRouterClient');
    return openRouterClient;
  }
  if(USE_TOGETHER) {
    if(!togetherClient) togetherClient = require('./togetherAIClient');
    return togetherClient;
  }
  if(USE_OPENAI) {
    if(client) return client;
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return client;
  }
  return null;
}

async function embedText(text, model = process.env.OPENAI_EMBED_MODEL){
  // Try MiniLM first (free, semantic, local)
  if(USE_MINILM){
    try{
      const miniLM = require('./miniLMClient');
      if(miniLM.isAvailable()){
        return await miniLM.embedText(text);
      }
    }catch(e){
      console.warn('[Embeddings] MiniLM not available, falling back:', e.message);
    }
  }
  
  if(DEMO_MODE){
    // Return random mock embedding for demo
    return new Array(parseInt(process.env.VECTOR_DIM || '384', 10)).fill(0).map(() => Math.random());
  }
  
  if(USE_OPEN_ROUTER){
    const openRouter = getClient();
    return await openRouter.embedText(text, model);
  }
  
  if(USE_TOGETHER){
    const together = getClient();
    return await together.embedText(text, model || 'togethercomputer/m2-bert-80M-32k-retrieval');
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
          content: 'This is a demo response. In production, this would call the LLM API. The retrieved sources should appear above. (Source: Demo Data)'
        }
      }]
    };
  }
  
  // Try Hugging Face first
  if(USE_HUGGINGFACE){
    try {
      // Use official Hugging Face SDK
      console.log('[LLM] Using Hugging Face Inference API (FREE)');
      const hfSimple = require('./huggingfaceSimple');
      if (hfSimple.isAvailable()) {
        return await hfSimple.chatCompletion(messages, model, temperature, parseInt(process.env.MAX_TOKENS || '500', 10));
      } else {
        throw new Error('Hugging Face SDK not available or token not set');
      }
    } catch (hfError) {
      console.error('[LLM] Hugging Face failed:', hfError.message);
      throw new Error(`Hugging Face error: ${hfError.message}`);
    }
  }
  
  if(USE_OPEN_ROUTER){
    const openRouter = getClient();
    return await openRouter.chatCompletion(messages, model || 'mistralai/mistral-7b-instruct:free', temperature, parseInt(process.env.MAX_TOKENS || '800', 10));
  }
  
  if(USE_TOGETHER){
    const together = getClient();
    return await together.chatCompletion(messages, model || 'mistralai/Mistral-7B-Instruct-v0.1', temperature, parseInt(process.env.MAX_TOKENS || '800', 10));
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
