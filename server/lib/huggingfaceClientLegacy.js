/**
 * Hugging Face Legacy Inference API Client
 * Uses the old api-inference.huggingface.co endpoint
 * Works with basic tokens (no special permissions needed)
 */

const https = require('https');

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

/**
 * Call Hugging Face Legacy Inference API
 */
async function callHuggingFaceLegacy(prompt, model = HF_MODEL, maxTokens = 500, retries = 2) {
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
        'Authorization': `Bearer ${HF_API_TOKEN}`
      },
      timeout: 90000,
    };

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
            console.log(`[HuggingFace Legacy] Model loading, estimated time: ${estimatedTime}s`);
            
            if (retries > 0) {
              console.log(`[HuggingFace Legacy] Retrying in ${estimatedTime}s... (${retries} retries left)`);
              setTimeout(() => {
                callHuggingFaceLegacy(prompt, model, maxTokens, retries - 1)
                  .then(resolve)
                  .catch(reject);
              }, estimatedTime * 1000);
              return;
            }
          }
          
          // Handle different response formats
          if (Array.isArray(parsed) && parsed[0]?.generated_text) {
            resolve(parsed[0].generated_text);
          } else if (parsed.generated_text) {
            resolve(parsed.generated_text);
          } else if (parsed.error) {
            const errorMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
            reject(new Error(`HuggingFace API Error: ${errorMsg}`));
          } else {
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
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Chat completion using legacy format
 */
async function chatCompletion(messages, model = HF_MODEL, temperature = 0.7, maxTokens = 500) {
  // Convert messages to prompt format
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
    const response = await callHuggingFaceLegacy(prompt, model, maxTokens);
    
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
    console.error('[HuggingFace Legacy] Error:', error.message);
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
};
