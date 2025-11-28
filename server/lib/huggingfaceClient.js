/**
 * Hugging Face Inference API Client
 * FREE tier available - no credit card required
 * Works with public models without API key
 */

const https = require('https');

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_THINKER_MODEL = process.env.HUGGINGFACE_thinker_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_SPEAKER_MODEL = process.env.HUGGINGFACE_SPEAKER_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
const HF_MODEL = process.env.HUGGINGFACE_MODEL || HF_THINKER_MODEL;
const HF_API_BASE = 'https://api-inference.huggingface.co'; // Inference API endpoint

/**
 * Call Hugging Face Inference API
 */
async function callHuggingFace(prompt, model = HF_MODEL, maxTokens = 500) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false,
      },
    });

    const options = {
      hostname: 'api-inference.huggingface.co',
      port: 443,
      path: `/models/${model}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
      timeout: 60000, // 60 seconds for model loading
    };

    // Add authorization if token is provided (REQUIRED for new endpoint)
    if (HF_API_TOKEN) {
      options.headers['Authorization'] = `Bearer ${HF_API_TOKEN}`;
    } else {
      console.warn('[HuggingFace] No API token provided - requests may fail');
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          
          // Handle different response formats
          if (Array.isArray(parsed) && parsed[0]?.generated_text) {
            resolve(parsed[0].generated_text);
          } else if (parsed.generated_text) {
            resolve(parsed.generated_text);
          } else if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve(responseData);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
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

    req.write(data);
    req.end();
  });
}

/**
 * Chat completion using Hugging Face
 */
async function chatCompletion(messages, model = HF_MODEL, temperature = 0.7, maxTokens = 500) {
  // Convert messages to prompt format
  let prompt = '';
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      prompt += `System: ${msg.content}\n\n`;
    } else if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }
  
  prompt += 'Assistant:';

  try {
    const response = await callHuggingFace(prompt, maxTokens);
    
    // Format response to match OpenAI structure
    return {
      choices: [
        {
          message: {
            content: response.trim(),
          },
        },
      ],
    };
  } catch (error) {
    console.error('[HuggingFace] Error:', error.message);
    throw error;
  }
}

/**
 * Check if Hugging Face is available
 */
function isAvailable() {
  return true; // Always available, works without API key
}

module.exports = {
  chatCompletion,
  isAvailable,
  HF_MODEL,
};
