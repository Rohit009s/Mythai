/**
 * Hugging Face Inference API Client
 * FREE tier available - no credit card required
 * Works with public models without API key
 */

const https = require('https');

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_THINKER_MODEL = process.env.HUGGINGFACE_THINKER_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_SPEAKER_MODEL = process.env.HUGGINGFACE_SPEAKER_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
const HF_MODEL = process.env.HUGGINGFACE_MODEL || HF_THINKER_MODEL;
const HF_API_BASE = 'https://router.huggingface.co'; // New Router API endpoint (updated Nov 2024)

/**
 * Call Hugging Face Inference API with retry logic
 * Updated for new router.huggingface.co endpoint (Nov 2024)
 */
async function callHuggingFace(prompt, model = HF_MODEL, maxTokens = 500, retries = 2) {
  return new Promise((resolve, reject) => {
    // New API format for router endpoint
    const data = JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    });

    const options = {
      hostname: 'router.huggingface.co',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
      timeout: 90000, // 90 seconds for model loading
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
          
          // Handle model loading state
          if (parsed.error && typeof parsed.error === 'string' && parsed.error.includes('loading')) {
            const estimatedTime = parsed.estimated_time || 20;
            console.log(`[HuggingFace] Model loading, estimated time: ${estimatedTime}s`);
            
            if (retries > 0) {
              console.log(`[HuggingFace] Retrying in ${estimatedTime}s... (${retries} retries left)`);
              setTimeout(() => {
                callHuggingFace(prompt, model, maxTokens, retries - 1)
                  .then(resolve)
                  .catch(reject);
              }, estimatedTime * 1000);
              return;
            } else {
              reject(new Error('Model loading timeout - please try again'));
              return;
            }
          }
          
          // Handle OpenAI-compatible response format
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            resolve(parsed.choices[0].message.content);
          } else if (parsed.error) {
            const errorMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
            reject(new Error(`HuggingFace API Error: ${errorMsg}`));
          } else {
            // Try to extract text from response
            const text = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
            resolve(text);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout - model may be loading'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Chat completion using Hugging Face (OpenAI-compatible format)
 */
async function chatCompletion(messages, model = HF_MODEL, temperature = 0.7, maxTokens = 500) {
  return new Promise((resolve, reject) => {
    // Use OpenAI-compatible format directly
    const data = JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 0.9,
      stream: false
    });

    const options = {
      hostname: 'router.huggingface.co',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${HF_API_TOKEN}`
      },
      timeout: 90000
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          
          // Handle errors
          if (parsed.error) {
            const errorMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
            reject(new Error(`HuggingFace API Error: ${errorMsg}`));
            return;
          }
          
          // Return OpenAI-compatible format
          if (parsed.choices && parsed.choices[0]) {
            resolve(parsed);
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData.substring(0, 200)}`));
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
