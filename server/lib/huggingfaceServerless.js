/**
 * Hugging Face Serverless Inference API Client
 * Uses the new serverless inference endpoint (free tier)
 * Requires token with "Make calls to the serverless Inference API" permission
 */

const https = require('https');

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

/**
 * Call Hugging Face Serverless Inference API
 * Using text-generation endpoint
 */
async function callHuggingFaceServerless(prompt, model = HF_MODEL, maxTokens = 500, retries = 3) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false,
        do_sample: true
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    });

    const options = {
      hostname: 'api-inference.huggingface.co',
      port: 443,
      path: `/models/${model}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 120000, // 2 minutes for cold start
    };

    console.log(`[HF Serverless] Calling model: ${model}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`[HF Serverless] Response status: ${res.statusCode}`);
        
        try {
          const parsed = JSON.parse(responseData);
          
          // Handle model loading state
          if (parsed.error && typeof parsed.error === 'string') {
            if (parsed.error.includes('loading') || parsed.error.includes('currently loading')) {
              const estimatedTime = parsed.estimated_time || 20;
              console.log(`[HF Serverless] Model loading, estimated time: ${estimatedTime}s`);
              
              if (retries > 0) {
                console.log(`[HF Serverless] Retrying in ${estimatedTime}s... (${retries} retries left)`);
                setTimeout(() => {
                  callHuggingFaceServerless(prompt, model, maxTokens, retries - 1)
                    .then(resolve)
                    .catch(reject);
                }, estimatedTime * 1000);
                return;
              } else {
                reject(new Error('Model loading timeout - please try again'));
                return;
              }
            }
            
            // Handle other errors
            reject(new Error(`HF API Error: ${parsed.error}`));
            return;
          }
          
          // Handle successful response
          if (Array.isArray(parsed) && parsed[0]?.generated_text) {
            resolve(parsed[0].generated_text);
          } else if (parsed.generated_text) {
            resolve(parsed.generated_text);
          } else if (parsed[0]?.error) {
            reject(new Error(`HF API Error: ${parsed[0].error}`));
          } else {
            console.log('[HF Serverless] Unexpected response format:', JSON.stringify(parsed).substring(0, 200));
            reject(new Error('Unexpected response format'));
          }
        } catch (error) {
          console.error('[HF Serverless] Parse error:', error.message);
          console.error('[HF Serverless] Raw response:', responseData.substring(0, 500));
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[HF Serverless] Request error:', error.message);
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
 * Chat completion using Hugging Face Serverless
 */
async function chatCompletion(messages, model = HF_MODEL, temperature = 0.7, maxTokens = 500) {
  // Convert messages to prompt format for text-generation models
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
    console.log('[HF Serverless] Generating response...');
    const response = await callHuggingFaceServerless(prompt, model, maxTokens);
    
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
    console.error('[HF Serverless] Error:', error.message);
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
