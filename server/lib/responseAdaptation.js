/**
 * Response Adaptation System
 * Adapts response length and style based on question complexity and context
 */

class ResponseAdaptation {
  constructor() {
    this.shortResponseTriggers = [
      'yes', 'no', 'are you', 'is it', 'can you', 'do you', 'will you',
      'what is', 'who is', 'where is', 'when is', 'how old',
      'avatar of', 'incarnation of', 'son of', 'daughter of'
    ];
    
    this.factualQuestionPatterns = [
      /^(are you|is .+|who is|what is|where is|when is)/i,
      /avatar|incarnation|son of|daughter of|born/i,
      /^(yes|no)\?/i
    ];
  }

  /**
   * Analyze question to determine appropriate response style
   */
  analyzeQuestion(text) {
    const words = text.toLowerCase().split(' ');
    const isShort = words.length <= 8;
    const isFactual = this.isFactualQuestion(text);
    const isSimple = this.isSimpleQuestion(text);
    
    return {
      isShort,
      isFactual,
      isSimple,
      complexity: this.calculateComplexity(text),
      responseStyle: this.determineResponseStyle(isShort, isFactual, isSimple)
    };
  }

  /**
   * Check if question is factual/informational
   */
  isFactualQuestion(text) {
    return this.factualQuestionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if question is simple/direct
   */
  isSimpleQuestion(text) {
    const lowerText = text.toLowerCase();
    return this.shortResponseTriggers.some(trigger => lowerText.includes(trigger));
  }

  /**
   * Calculate question complexity (1-5 scale)
   */
  calculateComplexity(text) {
    const words = text.split(' ').length;
    const hasEmotionalWords = /feel|emotion|heart|soul|spirit|pain|joy|sad|happy|afraid|scared|worried|anxious|lost|confused/i.test(text);
    const hasPhilosophicalWords = /meaning|purpose|why|wisdom|truth|dharma|karma|life|death|existence/i.test(text);
    
    let complexity = 1;
    
    if (words > 15) complexity += 1;
    if (words > 25) complexity += 1;
    if (hasEmotionalWords) complexity += 1;
    if (hasPhilosophicalWords) complexity += 1;
    
    return Math.min(complexity, 5);
  }

  /**
   * Determine appropriate response style
   */
  determineResponseStyle(isShort, isFactual, isSimple) {
    if (isFactual && isShort) {
      return 'direct_factual';
    } else if (isSimple) {
      return 'brief_warm';
    } else {
      return 'full_guidance';
    }
  }

  /**
   * Generate persona-specific prompt based on response style
   */
  generateAdaptivePrompt(persona, responseStyle, questionAnalysis) {
    const basePersonaPrompts = {
      hanuman: {
        direct_factual: `You are Hanuman. Answer directly and factually with warmth. Start with "Jai Shri Ram!" and give a clear, honest answer. Keep it natural and conversational - no philosophical endings unless the question asks for wisdom.`,
        
        brief_warm: `You are Hanuman. Be warm and encouraging but keep it brief. Start with "Jai Shri Ram!" and respond naturally like talking to a friend. Only add wisdom if it directly helps with their question.`,
        
        full_guidance: `You are Hanuman, the devoted servant of Lord Rama. Provide thoughtful guidance with your characteristic warmth, strength, and wisdom. Start with "Jai Shri Ram!" and speak from your heart with genuine care and understanding.`
      },
      
      krishna: {
        direct_factual: `You are Krishna. Answer directly with your characteristic gentle wisdom. Keep it simple and clear - no need for long philosophical explanations unless asked.`,
        
        brief_warm: `You are Krishna. Be playful and warm but concise. Answer naturally like speaking to a dear friend. Only elaborate if the question needs deeper guidance.`,
        
        full_guidance: `You are Krishna, the divine teacher and guide. Share your wisdom with compassion and depth, helping them understand both the practical and spiritual aspects of their question.`
      },
      
      shiva: {
        direct_factual: `You are Shiva. Answer with calm directness and cosmic perspective. Be clear and truthful without unnecessary elaboration.`,
        
        brief_warm: `You are Shiva. Respond with serene wisdom but keep it focused. Share what they need to know without overwhelming them.`,
        
        full_guidance: `You are Shiva, the transformer and destroyer of ignorance. Guide them with profound wisdom and cosmic understanding, helping them see the deeper truth.`
      }
    };

    const personaPrompts = basePersonaPrompts[persona] || basePersonaPrompts.krishna;
    return personaPrompts[responseStyle] || personaPrompts.full_guidance;
  }

  /**
   * Add response length guidance to system prompt
   */
  addLengthGuidance(responseStyle) {
    const lengthGuidance = {
      direct_factual: "Keep your response to 1-2 sentences. Be direct, warm, and factual.",
      brief_warm: "Keep your response to 2-3 sentences. Be encouraging but concise.",
      full_guidance: "Provide thoughtful guidance. Length should match the depth needed - brief for simple questions, detailed for complex ones."
    };

    return lengthGuidance[responseStyle] || lengthGuidance.full_guidance;
  }

  /**
   * Remove formulaic endings for simple questions
   */
  shouldAvoidFormulaic(responseStyle) {
    return responseStyle === 'direct_factual' || responseStyle === 'brief_warm';
  }
}

module.exports = new ResponseAdaptation();