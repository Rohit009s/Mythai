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
    throw new Error('OPEN_ROUTER_API_KEY not set');
  }

  const body = {
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens,
    top_p: 0.7,
    top_k: 50,
  };

  const response = await makeRequest('/chat/completions', 'POST', body);

  if (response.status !== 200) {
    const errorMsg = response.rawData || JSON.stringify(response.data);
    throw new Error(`Open Router chat failed: ${response.status} - ${errorMsg}`);
  }

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
