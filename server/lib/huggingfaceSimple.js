/**
 * Simple Hugging Face Client using @huggingface/inference
 * This is the official recommended way to use HF Inference API
 */

let HfInference;
try {
  const hf = require('@huggingface/inference');
  HfInference = hf.HfInference;
} catch (e) {
  console.warn('[HF] @huggingface/inference not installed. Run: npm install @huggingface/inference');
  HfInference = null;
}

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

let client = null;

function getClient() {
  if (!HfInference) return null;
  if (!HF_API_TOKEN) return null;
  if (!client) {
    client = new HfInference(HF_API_TOKEN);
  }
  return client;
}

/**
 * Chat completion using official HF SDK
 */
async function chatCompletion(messages, model = HF_MODEL, temperature = 0.7, maxTokens = 500) {
  const hf = getClient();
  if (!hf) {
    throw new Error('Hugging Face client not available. Install: npm install @huggingface/inference');
  }

  try {
    console.log(`[HF SDK] Generating with model: ${model}`);
    
    // Use chatCompletion for conversational models (OpenAI-compatible format)
    const response = await hf.chatCompletion({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    });

    const content = response.choices[0].message.content;

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
    console.error('[HF SDK] Error:', error.message);
    throw error;
  }
}

function isAvailable() {
  return !!HfInference && !!HF_API_TOKEN;
}

module.exports = {
  chatCompletion,
  isAvailable,
  HF_MODEL
};
