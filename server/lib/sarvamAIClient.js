/**
 * Sarvam AI Client
 * Indian AI provider with strong multilingual support
 * Specializes in Indian languages and cultural context
 */

const axios = require('axios');

class SarvamAIClient {
  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY;
    this.baseURL = 'https://api.sarvam.ai/v1';
    
    if (!this.apiKey) {
      console.warn('[Sarvam AI] API key not found. Sarvam AI will not be available.');
      return;
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
    
    console.log('[Sarvam AI] Client initialized successfully');
  }

  /**
   * Generate chat completion using Sarvam AI (Standard Format)
   */
  async generateChatCompletion(messages, options = {}) {
    if (!this.client) {
      throw new Error('Sarvam AI client not initialized');
    }

    try {
      const requestData = {
        model: options.model || 'sarvam-m', // Use correct Sarvam AI model
        messages: messages,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
        stream: false,
        ...options
      };

      console.log('[Sarvam AI] Generating chat completion with model:', requestData.model);
      
      const startTime = Date.now();
      const response = await this.client.post('/chat/completions', requestData);
      const duration = Date.now() - startTime;
      
      console.log(`[Sarvam AI] Chat completion generated in ${duration}ms`);
      
      return {
        success: true,
        response: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        duration,
        provider: 'sarvam'
      };
      
    } catch (error) {
      console.error('[Sarvam AI] Error generating chat completion:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Generate text completion (for simpler use cases)
   */
  async generateCompletion(prompt, options = {}) {
    const messages = [
      { role: 'user', content: prompt }
    ];
    
    return await this.generateChatCompletion(messages, options);
  }

  /**
   * Generate response with Indian cultural context
   */
  async generateIndianContextResponse(prompt, deity, language = 'en', options = {}) {
    try {
      // Enhanced prompt for Indian cultural context
      const culturalPrompt = `You are ${deity}, a revered deity in Hindu tradition. Respond with deep spiritual wisdom, cultural sensitivity, and authentic Indian philosophical insights. 

Language: ${language}
Context: Spiritual guidance and wisdom
Tone: Compassionate, wise, and culturally authentic

User's question: ${prompt}

Please provide a response that:
1. Reflects authentic Indian spiritual wisdom
2. Uses appropriate cultural references
3. Maintains the deity's traditional characteristics
4. Offers practical spiritual guidance
5. Is respectful and inspiring

Response:`;

      const messages = [
        {
          role: 'system',
          content: `You are ${deity}, speaking with the wisdom and compassion of Hindu tradition. Your responses should be authentic, culturally appropriate, and spiritually enriching.`
        },
        {
          role: 'user',
          content: culturalPrompt
        }
      ];

      return await this.generateChatCompletion(messages, {
        model: 'sarvam-m', // Use correct Sarvam AI model name
        temperature: 0.8,
        max_tokens: 800,
        ...options
      });
      
    } catch (error) {
      console.error('[Sarvam AI] Error in Indian context response:', error);
      return {
        success: false,
        error: error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Get available models
   */
  async getModels() {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      const response = await this.client.get('/models');
      return {
        success: true,
        models: response.data.data,
        provider: 'sarvam'
      };
    } catch (error) {
      console.error('[Sarvam AI] Error fetching models:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    try {
      const testPrompt = "Hello, please respond with a simple greeting.";
      const result = await this.generateCompletion(testPrompt, {
        max_tokens: 50,
        temperature: 0.5
      });
      
      return {
        success: result.success,
        message: result.success ? 'Sarvam AI connection successful' : 'Connection failed',
        response: result.response,
        error: result.error,
        provider: 'sarvam'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sarvam AI connection test failed',
        error: error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Check if Sarvam AI is available
   */
  isAvailable() {
    return !!this.apiKey && !!this.client;
  }

  /**
   * Generate Text-to-Speech using Sarvam AI
   */
  async generateTTS(text, options = {}) {
    if (!this.client) {
      throw new Error('Sarvam AI client not initialized');
    }

    try {
      const requestData = {
        inputs: [text],
        target_language_code: options.language || 'hi-IN', // Hindi by default
        speaker: options.speaker || 'meera', // Default speaker
        pitch: options.pitch || 0,
        pace: options.pace || 1.0,
        loudness: options.loudness || 1.0,
        speech_sample_rate: options.sampleRate || 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1'
      };

      console.log('[Sarvam AI] Generating TTS for text:', text.substring(0, 50) + '...');
      
      const startTime = Date.now();
      const response = await this.client.post('/text-to-speech', requestData);
      const duration = Date.now() - startTime;
      
      console.log(`[Sarvam AI] TTS generated in ${duration}ms`);
      
      return {
        success: true,
        audioData: response.data.audios[0], // Base64 encoded audio
        duration,
        provider: 'sarvam',
        language: options.language || 'hi-IN',
        speaker: options.speaker || 'meera'
      };
      
    } catch (error) {
      console.error('[Sarvam AI] Error generating TTS:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Generate Speech-to-Text using Sarvam AI
   */
  async generateSTT(audioData, options = {}) {
    if (!this.client) {
      throw new Error('Sarvam AI client not initialized');
    }

    try {
      const requestData = {
        file: audioData, // Base64 encoded audio or file
        model: 'saaras:v1',
        language_code: options.language || 'hi-IN',
        with_timestamps: options.withTimestamps || false,
        enable_preprocessing: true
      };

      console.log('[Sarvam AI] Processing STT for audio data');
      
      const startTime = Date.now();
      const response = await this.client.post('/speech-to-text', requestData);
      const duration = Date.now() - startTime;
      
      console.log(`[Sarvam AI] STT processed in ${duration}ms`);
      
      return {
        success: true,
        transcript: response.data.transcript,
        confidence: response.data.confidence || 1.0,
        timestamps: response.data.timestamps || null,
        duration,
        provider: 'sarvam',
        language: options.language || 'hi-IN'
      };
      
    } catch (error) {
      console.error('[Sarvam AI] Error processing STT:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Translate text using Sarvam AI
   */
  async translateText(text, sourceLanguage, targetLanguage) {
    if (!this.client) {
      throw new Error('Sarvam AI client not initialized');
    }

    try {
      const requestData = {
        input: text,
        source_language_code: sourceLanguage,
        target_language_code: targetLanguage,
        speaker_gender: 'Female',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true
      };

      console.log(`[Sarvam AI] Translating from ${sourceLanguage} to ${targetLanguage}`);
      
      const startTime = Date.now();
      const response = await this.client.post('/translate', requestData);
      const duration = Date.now() - startTime;
      
      console.log(`[Sarvam AI] Translation completed in ${duration}ms`);
      
      return {
        success: true,
        translatedText: response.data.translated_text,
        sourceLanguage,
        targetLanguage,
        duration,
        provider: 'sarvam'
      };
      
    } catch (error) {
      console.error('[Sarvam AI] Error translating text:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        provider: 'sarvam'
      };
    }
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      provider: 'sarvam',
      available: this.isAvailable(),
      baseURL: this.baseURL,
      features: [
        'Chat completions',
        'Text-to-Speech (TTS)',
        'Speech-to-Text (STT)', 
        'Translation',
        'Indian cultural context',
        'Multilingual support',
        'Hindu deity personas',
        'Spiritual guidance'
      ]
    };
  }
}

module.exports = SarvamAIClient;