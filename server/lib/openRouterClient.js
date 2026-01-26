/**
 * Open Router Client
 * Uses open-source models through Open Router API
 * Free tier + pay-as-you-go, no account setup required for some models
 * 
 * Models available:
 * - mistralai/mistral-7b-instruct
 * - meta-llama/llama-2-7b-chat
 * - NousResearch/Nous-Hermes-2-Mistral-7B-DPO
 * - openchat/openchat-3.5
 */

const https = require('https');
const { URL } = require('url');

const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const OPEN_ROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Make HTTP request to Open Router
 */
async function makeRequest(endpoint, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(OPEN_ROUTER_BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}`,
        'HTTP-Referer': 'https://mythai.app',
        'X-Title': 'MythAI',
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 sec timeout for Open Router
    };

    if (body) {
      const jsonBody = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(jsonBody);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, rawData: data });
        } catch (e) {
          // If JSON parse fails, return raw data for debugging
          resolve({ status: res.statusCode, data: {}, rawData: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Generate embeddings using Open Router
 * Note: Open Router doesn't have native embedding support in their main API
 * We'll use a local mock or Together AI for embeddings
 */
async function embedText(text, model = 'text-embedding-3-small') {
  if (!OPEN_ROUTER_API_KEY) {
    throw new Error('OPEN_ROUTER_API_KEY not set');
  }

  // Open Router doesn't support embeddings directly
  // Fall back to generating a hash-based deterministic embedding
  console.warn('[Open Router] Embeddings not supported, using deterministic hash-based fallback');
  
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(text).digest();
  const embedding = [];
  for (let i = 0; i < 1536; i++) {
    embedding.push((hash[i % hash.length] + hash[(i + 1) % hash.length]) / 512);
  }
  return embedding;
}

/**
 * Chat completion using Open Router
 * Uses free or cheap open-source models
 */
async function chatCompletion(
  messages,
  model = process.env.OPEN_ROUTER_CHAT_MODEL || 'meta-llama/llama-3.2-3b-instruct:free',
  temperature = 0.2,
  maxTokens = 800
) {
  if (!OPEN_ROUTER_API_KEY) {
    console.warn('[Open Router] API key not set, using fallback response');
    return generateFallbackResponse(messages);
  }

  // Try different models if the primary one fails
  const fallbackModels = [
    'openai/gpt-3.5-turbo', // Very cheap, reliable
    'anthropic/claude-3-haiku', // Fast and cheap
    'meta-llama/llama-3.1-8b-instruct', // Paid but very cheap
    'mistralai/mistral-7b-instruct', // Remove :free suffix
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-9b-it:free'
  ];

  for (const tryModel of fallbackModels) {
    const body = {
      model: tryModel,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 0.7,
      top_k: 50,
    };

    try {
      console.log(`[Open Router] Trying model: ${tryModel}`);
      const response = await makeRequest('/chat/completions', 'POST', body);

      if (response.status === 200 && response.data.choices && response.data.choices[0]) {
        console.log(`[Open Router] Success with model: ${tryModel}`);
        // Format response to match OpenAI structure
        return {
          choices: [
            {
              message: {
                content: response.data.choices[0].message.content,
              },
            },
          ],
        };
      } else {
        console.warn(`[Open Router] Model ${tryModel} failed with status ${response.status}`);
        continue;
      }
    } catch (error) {
      console.warn(`[Open Router] Model ${tryModel} error:`, error.message);
      continue;
    }
  }

  // If all models fail, use fallback
  console.warn('[Open Router] All models failed, using fallback response');
  return generateFallbackResponse(messages);
}

/**
 * Generate a fallback response when API is rate-limited or fails
 */
function generateFallbackResponse(messages) {
  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage.content.toLowerCase();
  
  // Extract deity context from system message if available
  const systemMessage = messages.find(msg => msg.role === 'system');
  let deity = 'Krishna'; // default
  if (systemMessage && systemMessage.content) {
    const content = systemMessage.content;
    if (content.includes('Shiva')) deity = 'Shiva';
    else if (content.includes('Ganesha')) deity = 'Ganesha';
    else if (content.includes('Rama')) deity = 'Rama';
    else if (content.includes('Hanuman')) deity = 'Hanuman';
    else if (content.includes('Vishnu')) deity = 'Vishnu';
    else if (content.includes('Lakshmi')) deity = 'Lakshmi';
    else if (content.includes('Saraswati')) deity = 'Saraswati';
    else if (content.includes('Durga')) deity = 'Durga';
    else if (content.includes('Parvati')) deity = 'Parvati';
  }
  
  // Check if user is asking about a specific deity
  if (userText.includes('who is') || userText.includes('tell me about')) {
    // Add other deity explanations as needed
  }
  
  // Deity-specific responses
  let response = "";
  
  if (deity === 'Krishna') {
    response = "My dear friend, I hear your call. ";
    if (userText.includes('guidance') || userText.includes('help')) {
      response += "Remember, as I taught Arjuna, perform your duty without attachment to results. Focus on the action, not the outcome.";
    } else if (userText.includes('stress') || userText.includes('worry')) {
      response += "Do not let your mind be disturbed by temporary challenges. Like the lotus that blooms in muddy water, rise above your circumstances.";
    } else {
      response += "Whatever you do, do it as an offering to the divine. This transforms ordinary actions into sacred service.";
    }
  } else if (deity === 'Shiva') {
    response = "Om Namah Shivaya. I am here, my child. ";
    if (userText.includes('change') || userText.includes('transformation')) {
      response += "Embrace change, for I am both the destroyer and creator. Through destruction comes renewal and growth.";
    } else {
      response += "Find stillness within the dance of life. In meditation and surrender, discover your true nature.";
    }
  } else if (deity === 'Ganesha') {
    response = "Gam Gam Ganapati! I remove obstacles from your path. ";
    if (userText.includes('problem') || userText.includes('difficulty')) {
      response += "Every obstacle is an opportunity for growth. Face challenges with wisdom and patience.";
    } else {
      response += "Begin your endeavors with devotion and right intention. Success follows those who act with pure heart.";
    }
  } else {
    response = `Blessings, dear soul. I am ${deity}, and I am with you. `;
    response += "Trust in the divine plan and walk your path with courage and compassion.";
  }
  
  return {
    choices: [
      {
        message: {
          content: response + "\n\n(Note: Using enhanced fallback response - API temporarily unavailable)"
        }
      }
    ]
  };
}

/**
 * Moderation (stub)
 */
async function moderate(text) {
  // Open Router doesn't have moderation
  return null;
}

module.exports = {
  embedText,
  chatCompletion,
  moderate,
  OPEN_ROUTER_API_KEY,
};
