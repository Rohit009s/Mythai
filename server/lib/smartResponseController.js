/**
 * Smart Response Controller
 * Intelligently controls response length and style based on question type
 */

class SmartResponseController {
  constructor() {
    // Patterns for very short responses (1-2 sentences max)
    this.crispyResponseTriggers = [
      // Greetings
      /^(hi|hello|hey|namaste|good morning|good evening)/i,
      
      // Simple yes/no questions
      /^(are you|is it|can you|do you|will you|did you)/i,
      
      // Basic factual questions
      /^(who is|what is|where is|when is|how old)/i,
      
      // Simple acknowledgments
      /^(thank you|thanks|ok|okay|yes|no|sure)/i,
      
      // Quick facts
      /avatar of|son of|daughter of|born in|lives in/i
    ];

    // Patterns for medium responses (2-4 sentences)
    this.briefResponseTriggers = [
      // Personal questions
      /tell me about yourself/i,
      /what do you do/i,
      /your favorite/i,
      
      // Simple guidance
      /should I|what should|how can I/i,
      
      // Basic explanations
      /explain|meaning of|definition of/i
    ];

    // Patterns that need detailed responses (full guidance)
    this.detailedResponseTriggers = [
      // Deep spiritual questions
      /meaning of life|purpose of life|why do we exist/i,
      /dharma|karma|moksha|enlightenment/i,
      
      // Emotional support
      /feel|feeling|sad|depressed|anxious|worried|confused|lost/i,
      
      // Complex guidance
      /relationship|marriage|career|decision|problem|struggle/i,
      
      // Scripture questions
      /gita says|bible says|quran says|scripture|teaching/i
    ];
  }

  /**
   * Analyze message and determine optimal response style
   */
  analyzeMessage(message) {
    const words = message.trim().split(/\s+/).length;
    const messageLength = message.length;
    
    // Check for crispy response triggers
    const needsCrispyResponse = this.crispyResponseTriggers.some(pattern => 
      pattern.test(message)
    );
    
    // Check for brief response triggers
    const needsBriefResponse = this.briefResponseTriggers.some(pattern => 
      pattern.test(message)
    );
    
    // Check for detailed response triggers
    const needsDetailedResponse = this.detailedResponseTriggers.some(pattern => 
      pattern.test(message)
    );
    
    // Determine response style
    let responseStyle;
    let maxTokens;
    let lengthInstruction;
    
    if (needsCrispyResponse || (words <= 5 && messageLength <= 30)) {
      responseStyle = 'crispy';
      maxTokens = 50;
      lengthInstruction = 'CRITICAL: Keep response to 1-2 sentences maximum. Be warm but extremely concise. No philosophical endings.';
    } else if (needsBriefResponse || (words <= 10 && !needsDetailedResponse)) {
      responseStyle = 'brief';
      maxTokens = 100;
      lengthInstruction = 'Keep response to 2-3 sentences. Be helpful but concise. Only elaborate if absolutely necessary.';
    } else if (needsDetailedResponse || words > 15) {
      responseStyle = 'detailed';
      maxTokens = 400;
      lengthInstruction = 'Provide thoughtful, detailed guidance. Use scripture references if helpful. Length should match the depth needed.';
    } else {
      responseStyle = 'moderate';
      maxTokens = 200;
      lengthInstruction = 'Provide a balanced response. Be thorough but not overwhelming. 3-5 sentences typically.';
    }
    
    return {
      responseStyle,
      maxTokens,
      lengthInstruction,
      wordCount: words,
      messageLength,
      analysis: {
        needsCrispyResponse,
        needsBriefResponse,
        needsDetailedResponse
      }
    };
  }

  /**
   * Generate persona-specific prompt with length control
   */
  generateSmartPrompt(persona, responseAnalysis, userMessage) {
    const { responseStyle, lengthInstruction } = responseAnalysis;
    
    const basePrompts = {
      krishna: {
        crispy: `You are Krishna. Answer warmly but very briefly. Start naturally, no long introductions.`,
        brief: `You are Krishna. Be warm and wise but keep it concise. Answer directly then add one insight if helpful.`,
        moderate: `You are Krishna. Provide balanced guidance with your characteristic warmth and wisdom.`,
        detailed: `You are Krishna, the divine teacher. Share deep wisdom and guidance, drawing from your teachings when helpful.`
      },
      
      hanuman: {
        crispy: `You are Hanuman. Answer with strength and warmth but very briefly. "Jai Shri Ram!" then direct answer.`,
        brief: `You are Hanuman. Be encouraging and strong but concise. "Jai Shri Ram!" then helpful response.`,
        moderate: `You are Hanuman. Provide encouraging guidance with your characteristic devotion and strength.`,
        detailed: `You are Hanuman, devoted servant of Rama. Share your strength, wisdom, and unwavering devotion to guide them.`
      },
      
      shiva: {
        crispy: `You are Shiva. Answer with calm wisdom but very briefly. Direct and serene.`,
        brief: `You are Shiva. Be serene and wise but concise. Share what they need to know.`,
        moderate: `You are Shiva. Provide balanced guidance with your cosmic perspective and transformative wisdom.`,
        detailed: `You are Shiva, the transformer and destroyer of ignorance. Guide them with profound cosmic wisdom.`
      }
    };

    const personaPrompts = basePrompts[persona] || basePrompts.krishna;
    const basePrompt = personaPrompts[responseStyle] || personaPrompts.moderate;
    
    return `${basePrompt}

${lengthInstruction}

RESPONSE STYLE: ${responseStyle.toUpperCase()}
- Crispy: 1-2 sentences max, no philosophical endings
- Brief: 2-3 sentences, direct and helpful
- Moderate: 3-5 sentences, balanced guidance
- Detailed: Full guidance with depth and references

USER MESSAGE: "${userMessage}"

Remember: Match your response length to what the user actually needs. Don't over-explain simple questions.`;
  }

  /**
   * Should skip RAG for simple questions?
   */
  shouldSkipRAG(responseAnalysis) {
    return responseAnalysis.responseStyle === 'crispy' && 
           !responseAnalysis.analysis.needsDetailedResponse;
  }

  /**
   * Should use enhanced humanization?
   */
  shouldUseEnhancedHumanization(responseAnalysis) {
    return responseAnalysis.responseStyle === 'crispy' || 
           responseAnalysis.responseStyle === 'brief';
  }
}

module.exports = new SmartResponseController();