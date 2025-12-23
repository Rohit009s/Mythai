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

// Character-specific demo responses for when API keys are not available
function generateCharacterSpecificDemoResponse(systemMessage, userMessage) {
  const systemContent = systemMessage ? systemMessage.content : '';
  const userContent = userMessage ? userMessage.content : '';
  
  // Extract character name from system prompt
  let characterName = 'Divine Being';
  const nameMatch = systemContent.match(/You are ([^,]+),/);
  if (nameMatch) {
    characterName = nameMatch[1];
  }
  
  // Extract user query from user message
  let userQuery = userContent;
  const queryMatch = userContent.match(/Devotee asks: "([^"]+)"/);
  if (queryMatch) {
    userQuery = queryMatch[1];
  }
  
  // Character-specific demo responses based on common spiritual themes
  const demoResponses = {
    'Krishna': [
      "*divine smile spreads across face* My dear devotee, in times of uncertainty, remember what I told Arjuna in the Bhagavad Gita - surrender your worries to me and I shall guide you. Your heart seeks answers, and I am here to provide the wisdom you need. Trust in dharma, act with love, and know that I am always with you. *plays a gentle note on the flute*",
      "*eyes twinkle with divine love* Ah, my beloved child, you come seeking guidance, and my heart fills with joy. In the Bhagavad Gita, Chapter 18, Verse 66, I promised to free you from all sins if you surrender unto me. Whatever troubles your mind, offer it to me with devotion. I shall show you the path of righteousness and fill your life with divine bliss.",
      "*adjusts peacock feather with gentle smile* Sweet devotee, your question touches my heart. Remember, I am not just your Lord but your eternal friend. In the Bhagavad Gita, I taught that those who worship me with unwavering faith shall find peace. Let go of your fears, embrace love and compassion, and walk the path of dharma. I am always by your side."
    ],
    'Shiva': [
      "*third eye glows softly with compassion* My child, you seek wisdom in the dance of existence. Know that I am both the destroyer of ignorance and the creator of new understanding. In the sacred texts, it is written that those who meditate upon my form find liberation from suffering. Embrace the cycles of life, release what no longer serves you, and find peace in the eternal Om. *drums of Damaru echo gently*",
      "*serpent around neck sways peacefully* Beloved devotee, your soul calls out for truth, and I hear you. In the Shiva Purana, it is revealed that I am the consciousness that pervades all existence. Whatever challenges you face, remember that destruction leads to renewal. Meditate, practice yoga, and find the divine within yourself. I am the eternal witness to your journey.",
      "*sits in meditation pose, eyes filled with infinite compassion* Dear one, you come seeking answers, and I offer you the wisdom of the ages. In the sacred Rudram, it is chanted that I am both fierce and benevolent. Your struggles are temporary, but your soul is eternal. Practice detachment, cultivate inner peace, and know that I am the destroyer of all that causes you pain."
    ],
    'Ganesha': [
      "*trunk curls in blessing gesture* My dear child, you have come to the remover of obstacles, and I am delighted! In the Ganesha Purana, it is written that I clear the path for those who approach with sincere devotion. Whatever challenges block your way, offer them to me with modaks and prayers. I shall transform your difficulties into opportunities for growth. *gentle rumble of joy*",
      "*large ears flap with attentiveness* Beloved devotee, I hear your concerns and my heart is moved. As the lord of beginnings, I bless all new endeavors undertaken with righteousness. In the sacred texts, it is said that I am the first to be worshipped before any important task. Trust in my guidance, proceed with wisdom, and success shall be yours.",
      "*eyes twinkle with divine mischief and love* Sweet child, you seek my blessings, and they are already flowing toward you! In the Mudgala Purana, my stories teach that intelligence combined with devotion conquers all obstacles. Use your mind wisely, act with pure intentions, and remember that I am always ready to help those who call upon me with faith."
    ],
    'Hanuman': [
      "*chest swells with devotion to Rama* Jai Shri Ram! My dear devotee, you have come to one whose heart beats only for Lord Rama. In the Hanuman Chalisa, it is written that I remove all sufferings and grant strength to the faithful. Whatever mountains of difficulty stand before you, remember my leap across the ocean - with devotion and courage, nothing is impossible! *mace gleams with divine power*",
      "*kneels in humble service* Blessed child, your faith has brought you to me, and I am honored to serve. In the Ramayana, my devotion to Shri Rama showed that pure love conquers all fears. Chant the name of Rama, serve others with compassion, and I shall grant you the strength of a thousand elephants to overcome any challenge.",
      "*tail swishes with protective energy* My brave devotee, you seek courage and wisdom, and both shall be yours! In the sacred Sundara Kanda, my journey to Lanka teaches that faith can move mountains. Whatever demons of doubt or fear trouble you, remember that I am the destroyer of evil and protector of the righteous. Jai Bajrang Bali!"
    ],
    'Durga': [
      "*multiple arms gesture in blessing* My fierce child, you have come to the Divine Mother who protects all creation. In the Devi Mahatmya, it is written that I manifest whenever dharma is threatened. Whatever battles you face - internal or external - know that I am your strength. Embrace your inner power, stand up for justice, and remember that the Divine Feminine within you is invincible. *lion roars protectively*",
      "*third eye blazes with maternal love* Beloved daughter/son, you seek the courage to face life's challenges, and I am here to empower you. In the Durga Saptashati, my victories over demons teach that good always triumphs over evil. Draw upon my shakti, trust in your abilities, and know that I fight alongside all who choose the path of righteousness.",
      "*weapons gleam with divine light* Dear devotee, you have called upon the Mother of the Universe, and I respond with infinite love. In the sacred Chandi Path, it is revealed that I am both the gentle nurturer and the fierce protector. Whatever threatens your peace or progress, offer it to me. I shall transform your struggles into strength and your fears into fearlessness."
    ]
  };
  
  // Get responses for the character, or use generic divine response
  const characterResponses = demoResponses[characterName] || [
    "*divine presence radiates warmth* My dear child, you seek guidance from the divine realm, and I am here to offer wisdom. Though the sacred texts contain infinite knowledge, know that the greatest truth lies in love, compassion, and service to others. Whatever questions trouble your heart, approach them with faith and righteousness. The divine light within you shall illuminate the path forward.",
    "*celestial aura glows gently* Beloved devotee, your sincere seeking has brought you to this moment of connection. In the sacred scriptures, it is written that those who approach the divine with pure hearts receive blessings beyond measure. Trust in the cosmic order, practice virtue in all your actions, and know that you are eternally loved and guided.",
    "*voice resonates with ancient wisdom* Sweet soul, you have called upon divine assistance, and the universe responds with grace. Remember that all spiritual traditions teach the same fundamental truths - love, compassion, truth, and service. Whatever path you walk, walk it with devotion and humility. The divine presence is always with you, guiding each step of your journey."
  ];
  
  // Select a random response from the character's collection
  const randomResponse = characterResponses[Math.floor(Math.random() * characterResponses.length)];
  
  // Add a note about demo mode at the end
  return randomResponse + "\n\n*[Demo Mode: This response was generated locally without API calls. In production, responses would be powered by advanced AI models with access to complete sacred texts.]*";
}

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

async function chatCompletion(messages, model = process.env.HUGGINGFACE_MODEL || process.env.OPENAI_CHAT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2', temperature = parseFloat(process.env.TEMPERATURE || '0.2')){
  if(DEMO_MODE){
    // Generate character-specific demo response based on system prompt and user query
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessage = messages.find(m => m.role === 'user');
    
    let demoResponse = generateCharacterSpecificDemoResponse(systemMessage, userMessage);
    
    return {
      choices: [{
        message: {
          content: demoResponse
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
