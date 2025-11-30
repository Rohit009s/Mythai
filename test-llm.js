/**
 * Quick test script to verify LLM configuration
 */

require('dotenv').config();
const { chatCompletion } = require('./server/lib/openaiClient');

async function testLLM() {
  console.log('Testing LLM configuration...\n');
  
  console.log('Environment variables:');
  console.log('- HUGGINGFACE_API_TOKEN:', process.env.HUGGINGFACE_API_TOKEN ? 'Set ✓' : 'Not set ✗');
  console.log('- OPEN_ROUTER_API_KEY:', process.env.OPEN_ROUTER_API_KEY ? 'Set ✓' : 'Not set ✗');
  console.log('- OPEN_ROUTER_CHAT_MODEL:', process.env.OPEN_ROUTER_CHAT_MODEL || 'Not set');
  console.log('');
  
  try {
    console.log('Sending test message to LLM...');
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "Hello, I am working!" in one sentence.' }
    ];
    
    // Use the correct model from env (Hugging Face model, not OpenAI)
    const model = process.env.HUGGINGFACE_MODEL || null;
    const response = await chatCompletion(messages, model);
    
    console.log('\n✓ SUCCESS! LLM is working.');
    console.log('Response:', response.choices[0].message.content);
    console.log('\nYour backend LLM is configured correctly!');
    
  } catch (error) {
    console.error('\n✗ FAILED! LLM error:');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if your Hugging Face token is valid');
    console.error('2. Try a different model in .env');
    console.error('3. Check your internet connection');
    console.error('4. The model might be loading - try again in 30 seconds');
  }
}

testLLM();
