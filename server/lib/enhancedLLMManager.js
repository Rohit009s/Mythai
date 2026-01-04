/**
 * Enhanced LLM Manager with Multiple Providers
 * Primary: Sarvam AI (superior for Indian spiritual context)
 * Fallback: OpenRouter (reliable backup)
 */

const SarvamAIClient = require('./sarvamAIClient');
const openRouterClient = require('./openRouterClient');

class EnhancedLLMManager {
  constructor() {
    this.sarvamAI = new SarvamAIClient();
    this.openRouter = openRouterClient;
    this.providers = ['sarvamAI', 'openRouter'];
    this.currentProvider = 'sarvamAI';
    this.fallbackEnabled = true;
    this.retryAttempts = 2;
    this.stats = {
      sarvamAI: { requests: 0, successes: 0, failures: 0, totalTime: 0 },
      openRouter: { requests: 0, successes: 0, failures: 0, totalTime: 0 }
    };
  }

  /**
   * Generate spiritual response with automatic fallback
   */
  async generateSpiritualResponse(prompt, deity, options = {}) {
    const startTime = Date.now();
    let lastError = null;

    console.log(`[LLM] Generating response for ${deity}: "${prompt.substring(0, 100)}..."`);

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        console.log(`[LLM] Attempting with ${provider}...`);
        
        const result = await this.generateWithProvider(provider, prompt, deity, options);
        
        if (result.success) {
          const duration = Date.now() - startTime;
          console.log(`[LLM] ✅ Success with ${provider} (${duration}ms)`);
          
          // Update stats
          this.updateStats(provider, true, duration);
          
          return {
            success: true,
            response: result.response,
            provider,
            duration,
            model: result.model,
            usage: result.usage,
            culturalScore: this.calculateCulturalScore(result.response),
            metadata: {
              deity,
              prompt: prompt.substring(0, 100) + '...',
              timestamp: new Date().toISOString()
            }
          };
        }
        
        lastError = result.error;
        console.warn(`[LLM] ❌ ${provider} failed:`, result.error);
        this.updateStats(provider, false, Date.now() - startTime);
        
      } catch (error) {
        lastError = error.message;
        console.error(`[LLM] ❌ ${provider} threw error:`, error);
        this.updateStats(provider, false, Date.now() - startTime);
      }
    }

    // All providers failed
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: `All LLM providers failed. Last error: ${lastError}`,
      provider: 'none',
      duration,
      fallbackResponse: this.generateFallbackResponse(deity, prompt)
    };
  }

  /**
   * Generate response with specific provider
   */
  async generateWithProvider(provider, prompt, deity, options) {
    switch (provider) {
      case 'sarvamAI':
        return await this.generateWithSarvamAI(prompt, deity, options);
      
      case 'openRouter':
        return await this.generateWithOpenRouter(prompt, deity, options);
      
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }

  /**
   * Generate response with Sarvam AI (Primary) - 2-Level Implementation
   * Level 1: RAG Decision + Context Building
   * Level 2: Response Generation + Humanization
   */
  async generateWithSarvamAI(prompt, deity, options) {
    try {
      if (!this.sarvamAI.isAvailable()) {
        return {
          success: false,
          error: 'Sarvam AI not available',
        };
      }

      // LEVEL 1: Build context and determine approach (same as OpenRouter)
      const context = options.context || [];
      const memoryContext = options.memoryContext || [];
      const hasReferences = context.length > 0;
      const hasHistory = memoryContext.length > 0;

      // Build context snippets for RAG
      const contextSnippets = hasReferences 
        ? context.map(r => `---BEGIN SNIPPET---\n${r.text}\n---END SNIPPET---\n(Source: ${r.source || 'Sacred Text'})`).join('\n\n')
        : '(No retrieved context available)';

      // Determine response approach based on context availability
      let contextInstruction, userPrompt;
      
      if (hasReferences) {
        // Spiritual/emotional question with references
        contextInstruction = `Here are relevant teachings from sacred texts: ${contextSnippets}`;
        userPrompt = `"${prompt}"\n\nRespond as ${deity} using the provided teachings. Keep it natural and conversational.`;
      } else {
        // No references - use deity's inherent wisdom
        contextInstruction = `Respond from your divine wisdom as ${deity}.`;
        userPrompt = `"${prompt}"\n\nGive a caring, wise response from your divine perspective.`;
      }

      // Build messages array with conversation history (same as OpenRouter)
      const systemContent = `You are ${deity}, a revered deity with deep spiritual wisdom. Respond with compassion, authenticity, and cultural sensitivity. Use appropriate Sanskrit terms naturally. Speak as if you personally know the people, places, and events from sacred texts.

CRITICAL RULES:
1. Keep responses natural and conversational (1-3 paragraphs)
2. Use simple, everyday language mixed with authentic Sanskrit terms
3. Speak from personal experience, not as a historian or teacher
4. If referencing sacred texts, speak as if you lived those events
5. Be warm, empathetic, and encouraging
6. Answer the user's question directly first, then provide wisdom

${hasHistory ? 'IMPORTANT: This is an ongoing conversation. Reference previous topics naturally when relevant. Build upon what you\'ve discussed before.' : ''}

CONTEXT: ${contextInstruction}`;

      const messages = [
        { role: 'system', content: systemContent }
      ];

      // Add conversation history for continuity
      if (hasHistory) {
        console.log(`[Sarvam AI] Adding ${memoryContext.length} messages to conversation history`);
        memoryContext.forEach((msg, index) => {
          if (msg.role === 'user') {
            messages.push({ role: 'user', content: msg.text });
          } else if (msg.role === 'assistant') {
            messages.push({ role: 'assistant', content: msg.text });
          }
        });
      }

      // Add current user message
      messages.push({ role: 'user', content: userPrompt });

      // LEVEL 2: Generate response with Sarvam AI
      const result = await this.sarvamAI.generateChatCompletion(messages, {
        model: options.model || 'sarvam-m',
        temperature: options.temperature || 0.8,
        max_tokens: options.max_tokens || 800,
        ...options
      });

      if (!result.success) {
        return result;
      }

      // Apply the same humanization process as OpenRouter
      const { humanizeIfNeeded } = require('./responseHumanizer');
      const personaObj = { name: deity, description: `Divine wisdom of ${deity}` };
      const reference = hasReferences ? { source: context[0].source } : null;

      const humanized = await humanizeIfNeeded(
        result.response,
        prompt,
        personaObj,
        reference
      );

      return {
        success: true,
        response: humanized.text,
        model: result.model,
        usage: result.usage,
        provider: 'sarvam',
        source: humanized.source,
        culturalScore: this.calculateCulturalScore(humanized.text),
        metadata: {
          hasReferences,
          hasHistory,
          contextLength: context.length,
          memoryLength: memoryContext.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate response with OpenRouter (Fallback) - 2-Level Implementation
   * Level 1: RAG Decision + Context Building  
   * Level 2: Response Generation + Humanization
   */
  async generateWithOpenRouter(prompt, deity, options) {
    try {
      if (!process.env.OPEN_ROUTER_API_KEY) {
        return {
          success: false,
          error: 'OpenRouter not configured',
        };
      }

      // LEVEL 1: Build context and determine approach (same as Sarvam AI)
      const context = options.context || [];
      const memoryContext = options.memoryContext || [];
      const hasReferences = context.length > 0;
      const hasHistory = memoryContext.length > 0;

      // Build context snippets for RAG
      const contextSnippets = hasReferences 
        ? context.map(r => `---BEGIN SNIPPET---\n${r.text}\n---END SNIPPET---\n(Source: ${r.source || 'Sacred Text'})`).join('\n\n')
        : '(No retrieved context available)';

      // Determine response approach based on context availability
      let contextInstruction, userPrompt;
      
      if (hasReferences) {
        // Spiritual/emotional question with references
        contextInstruction = `Here are relevant teachings from sacred texts: ${contextSnippets}`;
        userPrompt = `"${prompt}"\n\nRespond as ${deity} using the provided teachings. Keep it natural and conversational.`;
      } else {
        // No references - use deity's inherent wisdom
        contextInstruction = `Respond from your divine wisdom as ${deity}.`;
        userPrompt = `"${prompt}"\n\nGive a caring, wise response from your divine perspective.`;
      }

      // Build messages array with conversation history
      const systemContent = `You are ${deity}, a revered deity with deep spiritual wisdom. Respond with compassion, authenticity, and cultural sensitivity. Use appropriate Sanskrit terms naturally. Speak as if you personally know the people, places, and events from sacred texts.

CRITICAL RULES:
1. Keep responses natural and conversational (1-3 paragraphs)
2. Use simple, everyday language mixed with authentic Sanskrit terms
3. Speak from personal experience, not as a historian or teacher
4. If referencing sacred texts, speak as if you lived those events
5. Be warm, empathetic, and encouraging
6. Answer the user's question directly first, then provide wisdom

${hasHistory ? 'IMPORTANT: This is an ongoing conversation. Reference previous topics naturally when relevant. Build upon what you\'ve discussed before.' : ''}

CONTEXT: ${contextInstruction}`;

      const messages = [
        { role: 'system', content: systemContent }
      ];

      // Add conversation history for continuity
      if (hasHistory) {
        console.log(`[OpenRouter] Adding ${memoryContext.length} messages to conversation history`);
        memoryContext.forEach((msg, index) => {
          if (msg.role === 'user') {
            messages.push({ role: 'user', content: msg.text });
          } else if (msg.role === 'assistant') {
            messages.push({ role: 'assistant', content: msg.text });
          }
        });
      }

      // Add current user message
      messages.push({ role: 'user', content: userPrompt });

      // LEVEL 2: Generate response with OpenRouter
      const result = await this.openRouter.chatCompletion(
        messages,
        options.model || 'meta-llama/llama-3.2-3b-instruct:free',
        options.temperature || 0.7,
        options.max_tokens || 800
      );

      const rawResponse = result.choices[0].message.content;

      // Apply the same humanization process as Sarvam AI
      const { humanizeIfNeeded } = require('./responseHumanizer');
      const personaObj = { name: deity, description: `Divine wisdom of ${deity}` };
      const reference = hasReferences ? { source: context[0].source } : null;

      const humanized = await humanizeIfNeeded(
        rawResponse,
        prompt,
        personaObj,
        reference
      );

      return {
        success: true,
        response: humanized.text,
        model: options.model || 'meta-llama/llama-3.2-3b-instruct:free',
        usage: result.usage,
        provider: 'openRouter',
        source: humanized.source,
        culturalScore: this.calculateCulturalScore(humanized.text),
        metadata: {
          hasReferences,
          hasHistory,
          contextLength: context.length,
          memoryLength: memoryContext.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate cultural authenticity score
   */
  calculateCulturalScore(response) {
    if (!response) return 0;
    
    const culturalKeywords = [
      'dharma', 'karma', 'moksha', 'bhakti', 'yoga', 'meditation',
      'spiritual', 'divine', 'sacred', 'wisdom', 'peace', 'love',
      'compassion', 'devotion', 'enlightenment', 'consciousness',
      'sanskrit', 'vedas', 'upanishads', 'gita', 'ramayana', 'mahabharata'
    ];
    
    const matches = culturalKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length;
    
    return Math.min((matches / culturalKeywords.length) * 100, 100);
  }

  /**
   * Generate fallback response when all providers fail
   */
  generateFallbackResponse(deity, prompt) {
    const fallbackResponses = {
      'Krishna': "My dear devotee, though the divine channels are momentarily unclear, know that I am always with you. Your question seeks wisdom, and wisdom comes from within. Meditate on dharma and let your heart guide you.",
      'Rama': "Noble soul, even when words fail us, the path of righteousness remains clear. Follow dharma, speak truth, and act with compassion. These eternal principles will guide you through any challenge.",
      'Hanuman': "Brave one, when obstacles seem insurmountable, remember that devotion and courage can overcome any challenge. Chant the holy names and let your faith be your strength.",
      'Shiva': "Child of the universe, in moments of silence, the greatest truths are revealed. Look within, for you carry the divine spark. Om Namah Shivaya.",
      'Vishnu': "Beloved seeker, the cosmic order continues even when individual voices are quiet. Trust in the eternal dharma and know that divine protection surrounds you always."
    };
    
    return fallbackResponses[deity] || "Divine blessings upon you, seeker. Though words may fail, the eternal wisdom of the cosmos flows through all existence. Seek within, and you shall find.";
  }

  /**
   * Update provider statistics
   */
  updateStats(provider, success, duration) {
    if (this.stats[provider]) {
      this.stats[provider].requests++;
      this.stats[provider].totalTime += duration;
      
      if (success) {
        this.stats[provider].successes++;
      } else {
        this.stats[provider].failures++;
      }
    }
  }

  /**
   * Get provider statistics
   */
  getStats() {
    const stats = {};
    
    Object.entries(this.stats).forEach(([provider, data]) => {
      const successRate = data.requests > 0 ? (data.successes / data.requests) * 100 : 0;
      const avgTime = data.requests > 0 ? data.totalTime / data.requests : 0;
      
      stats[provider] = {
        available: provider === 'sarvamAI' ? this.sarvamAI.isAvailable() : !!process.env.OPEN_ROUTER_API_KEY,
        requests: data.requests,
        successRate: Math.round(successRate),
        avgResponseTime: Math.round(avgTime),
        failures: data.failures
      };
    });
    
    return stats;
  }

  /**
   * Test all providers
   */
  async testProviders() {
    const testPrompt = "What is the meaning of dharma in daily life?";
    const testDeity = "Krishna";
    
    console.log('[LLM] Testing all providers...');
    
    const results = {};
    
    for (const provider of this.providers) {
      try {
        const startTime = Date.now();
        const result = await this.generateWithProvider(provider, testPrompt, testDeity, {});
        const duration = Date.now() - startTime;
        
        results[provider] = {
          available: result.success,
          duration,
          error: result.error || null,
          responseLength: result.response?.length || 0
        };
      } catch (error) {
        results[provider] = {
          available: false,
          duration: 0,
          error: error.message,
          responseLength: 0
        };
      }
    }
    
    return results;
  }

  /**
   * Set provider priority
   */
  setProviderPriority(providers) {
    this.providers = providers.filter(p => ['sarvamAI', 'openRouter'].includes(p));
  }

  /**
   * Enable/disable fallback
   */
  setFallbackEnabled(enabled) {
    this.fallbackEnabled = enabled;
    if (!enabled) {
      this.providers = [this.providers[0]]; // Use only primary provider
    } else {
      this.providers = ['sarvamAI', 'openRouter']; // Reset to all providers
    }
  }

  /**
   * Get provider status summary
   */
  getProviderStatus() {
    return {
      primary: 'sarvamAI',
      fallback: 'openRouter',
      sarvamAI: {
        available: this.sarvamAI.isAvailable(),
        configured: !!process.env.SARVAM_API_KEY,
        advantages: ['9x faster', 'Better cultural context', 'Authentic Sanskrit terms']
      },
      openRouter: {
        available: !!process.env.OPEN_ROUTER_API_KEY,
        configured: !!process.env.OPEN_ROUTER_API_KEY,
        advantages: ['Free tier available', 'Reliable fallback', 'Longer responses']
      }
    };
  }
}

module.exports = EnhancedLLMManager;