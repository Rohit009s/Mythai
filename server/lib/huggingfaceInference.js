/**
 * Hugging Face Inference API Client (2024 Updated)
 * Uses Hugging Face's free Inference API
 * Works with basic "Read" tokens
 */

const https = require('https');

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

// List of free models that work well
const FREE_MODELS = {
  'mistral': 'mistralai/Mistral-7B-Instruct-v0.2',
  'llama': 'meta-llama/Llama-2-7b-chat-hf',
  'falcon': 'tiiuae/falcon-7b-instruct',
  'zephyr': 'HuggingFaceH4/zephyr-7b-beta'
};

/**
 * Make request to Hugging Face Inference API
 */
async function makeHFRequest(endpoint, body, retries = 3) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);

    const options = {
      hostname: 'huggingface.co',
      port: 443,
      path: `/api/inference/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 120000,
    };

    console.log(`[HF Inference] Calling: ${endpoint}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`[HF Inference] Status: ${res.statusCode}`);
        
        if (res.statusCode === 503 && retries > 0) {
          // Model is loading
          console.log(`[HF Inference] Model loading, retrying in 20s... (${retries} retries left)`);
          setTimeout(() => {
            makeHFRequest(endpoint, body, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 20000);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HF API returned ${res.statusCode}: ${responseData.substring(0, 200)}`));
          return;
        }

        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          // Some responses might be plain text
          resolve({ text: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Chat completion using Hugging Face Inference API
 */
async function chatCompletion(messages, model = HF_MODEL, temperature = 0.7, maxTokens = 500) {
  // Convert messages to prompt
  let prompt = '';
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      prompt += `${msg.content}\n\n`;
    } else if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }
  
  prompt += 'Assistant:';

  try {
    const response = await makeHFRequest('text-generation', {
      model: model,
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature: temperature,
        top_p: 0.9,
        return_full_text: false
      }
    });

    let content = '';
    if (Array.isArray(response) && response[0]?.generated_text) {
      content = response[0].generated_text;
    } else if (response.generated_text) {
      content = response.generated_text;
    } else if (response.text) {
      content = response.text;
    } else {
      throw new Error('Unexpected response format');
    }

    return {
      choices: [
        {
          message: {
            content: content.trim(),
          },
        },
      ],
    };
  } catch (error) {
    console.error('[HF Inference] Error:', error.message);
    throw error;
  }
}

function isAvailable() {
  return !!HF_API_TOKEN;
}

module.exports = {
  chatCompletion,
  isAvailable,
  HF_MODEL,
  FREE_MODELS
};
