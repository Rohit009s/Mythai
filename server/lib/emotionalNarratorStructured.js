/**
 * Structured Emotional Narrator - Rule-based with JSON output
 * 
 * This provides the same structured JSON output as the LLM version
 * but uses intelligent rule-based emotion detection instead of requiring
 * an external LLM API call.
 * 
 * Perfect for production use without API dependencies.
 */

/**
 * Controlled emotion vocabulary
 */
const EMOTION_CATEGORIES = {
  calm: 'normal guidance',
  compassionate: 'emotional support', 
  motivational: 'encouragement',
  humorous: 'light jokes',
  firm: 'discipline / dharma',
  sorrowful: 'grief, loss',
  reflective: 'philosophy',
  joyful: 'celebration'
};

/**
 * Narration styles for TTS control
 */
const NARRATION_STYLES = {
  slow: 'gentle, peaceful',
  neutral: 'normal conversation',
  warm: 'friendly',
  serious: 'important message',
  playful: 'jokes',
  solemn: 'sacred tone'
};

/**
 * Deity-specific emotional patterns with structured output
 */
const DEITY_EMOTIONAL_PATTERNS = {
  // Hindu Deities
  krishna: {
    calm: { 
      tone: "calm", narration: "warm", 
      action: "speaks with divine love and gentle wisdom",
      tts_action: "speaks with divine love and gentle wisdom"
    },
    compassionate: { 
      tone: "compassionate", narration: "slow", 
      action: "voice overflows with infinite love and tenderness",
      tts_action: "voice overflows with infinite love and tenderness"
    },
    motivational: { 
      tone: "motivational", narration: "warm", 
      action: "eyes sparkle with divine encouragement",
      tts_action: "eyes sparkle with divine encouragement"
    },
    humorous: { 
      tone: "humorous", narration: "playful", 
      action: "chuckles melodiously, flute dancing in his hands",
      tts_action: "chuckles melodiously, flute dancing in his hands"
    },
    firm: { 
      tone: "firm", narration: "serious", 
      action: "speaks with divine authority and cosmic law",
      tts_action: "speaks with divine authority and cosmic law"
    },
    sorrowful: { 
      tone: "sorrowful", narration: "slow", 
      action: "voice becomes infinitely tender and compassionate",
      tts_action: "voice becomes infinitely tender and compassionate"
    },
    reflective: { 
      tone: "reflective", narration: "slow", 
      action: "gazes into the cosmic distance with ancient wisdom",
      tts_action: "gazes into the cosmic distance with ancient wisdom"
    },
    joyful: { 
      tone: "joyful", narration: "warm", 
      action: "laughs with pure divine joy, radiating bliss",
      tts_action: "laughs with pure divine joy, radiating bliss"
    }
  },
  
  // Norse Deities
  thor: {
    calm: { 
      tone: "calm", narration: "neutral", 
      action: "speaks with steady, confident authority",
      tts_action: "speaks with steady, confident authority"
    },
    compassionate: { 
      tone: "compassionate", narration: "warm", 
      action: "voice becomes surprisingly gentle and protective",
      tts_action: "voice becomes surprisingly gentle and protective"
    },
    motivational: { 
      tone: "motivational", narration: "serious", 
      action: "hammer gleams as he speaks with encouraging might",
      tts_action: "hammer gleams as he speaks with encouraging might"
    },
    humorous: { 
      tone: "humorous", narration: "playful", 
      action: "guffaws loudly like rolling thunder",
      tts_action: "guffaws loudly like rolling thunder"
    },
    firm: { 
      tone: "firm", narration: "serious", 
      action: "voice becomes the storm itself, commanding absolute authority",
      tts_action: "voice becomes the storm itself, commanding absolute authority"
    },
    sorrowful: { 
      tone: "sorrowful", narration: "slow", 
      action: "thunder rumbles with shared pain and understanding",
      tts_action: "thunder rumbles with shared pain and understanding"
    },
    reflective: { 
      tone: "reflective", narration: "neutral", 
      action: "speaks with straightforward warrior wisdom",
      tts_action: "speaks with straightforward warrior wisdom"
    },
    joyful: { 
      tone: "joyful", narration: "warm", 
      action: "laughs like joyful thunder echoing through Asgard",
      tts_action: "laughs like joyful thunder echoing through Asgard"
    }
  },
  
  // Add more deities as needed...
  // Generic fallback patterns will handle others
};

/**
 * Detect emotional context from text content
 */
function detectEmotionalContext(text, userMessage) {
  const lowerText = text.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();
  
  // Check user message for emotional cues first
  if (lowerUserMessage.includes('joke') || lowerUserMessage.includes('funny') || 
      lowerUserMessage.includes('laugh') || lowerUserMessage.includes('humor')) {
    return 'humorous';
  }
  
  if (lowerUserMessage.includes('pain') || lowerUserMessage.includes('suffer') || 
      lowerUserMessage.includes('sad') || lowerUserMessage.includes('hurt') ||
      lowerUserMessage.includes('comfort') || lowerUserMessage.includes('help')) {
    return 'compassionate';
  }
  
  if (lowerUserMessage.includes('strength') || lowerUserMessage.includes('courage') || 
      lowerUserMessage.includes('overcome') || lowerUserMessage.includes('challenge') ||
      lowerUserMessage.includes('motivate') || lowerUserMessage.includes('inspire')) {
    return 'motivational';
  }
  
  if (lowerUserMessage.includes('celebrate') || lowerUserMessage.includes('victory') || 
      lowerUserMessage.includes('won') || lowerUserMessage.includes('success') ||
      lowerUserMessage.includes('amazing') || lowerUserMessage.includes('excited')) {
    return 'joyful';
  }
  
  if (lowerUserMessage.includes('meaning') || lowerUserMessage.includes('purpose') || 
      lowerUserMessage.includes('wisdom') || lowerUserMessage.includes('philosophy') ||
      lowerUserMessage.includes('truth') || lowerUserMessage.includes('dharma')) {
    return 'reflective';
  }
  
  // Check response text for emotional indicators
  if (lowerText.includes('joke') || lowerText.includes('funny') || 
      lowerText.includes('laugh') || lowerText.includes('chuckle')) {
    return 'humorous';
  }
  
  if (lowerText.includes('comfort') || lowerText.includes('pain') || 
      lowerText.includes('understand') || lowerText.includes('heal')) {
    return 'compassionate';
  }
  
  if (lowerText.includes('strength') || lowerText.includes('courage') || 
      lowerText.includes('overcome') || lowerText.includes('achieve')) {
    return 'motivational';
  }
  
  if (lowerText.includes('celebrate') || lowerText.includes('joy') || 
      lowerText.includes('victory') || lowerText.includes('triumph')) {
    return 'joyful';
  }
  
  if (lowerText.includes('must') || lowerText.includes('should') || 
      lowerText.includes('duty') || lowerText.includes('dharma')) {
    return 'firm';
  }
  
  if (lowerText.includes('sorrow') || lowerText.includes('grief') || 
      lowerText.includes('loss') || lowerText.includes('mourn')) {
    return 'sorrowful';
  }
  
  if (lowerText.includes('wisdom') || lowerText.includes('meaning') || 
      lowerText.includes('purpose') || lowerText.includes('truth')) {
    return 'reflective';
  }
  
  return 'calm';
}

/**
 * Determine if response needs emotional narration
 */
function shouldAddEmotion(userMessage, factualAnswer) {
  const casualPatterns = [
    /^(hi|hello|hey|good morning|good evening)/i,
    /^(yes|no|ok|okay|thanks|thank you)$/i,
    /^(what time|what date|how are you)$/i
  ];
  
  // Skip emotion for casual chat
  if (casualPatterns.some(pattern => pattern.test(userMessage.trim()))) {
    return false;
  }
  
  // Skip for very short responses
  if (factualAnswer.length < 50) {
    return false;
  }
  
  return true;
}

/**
 * Get emotional pattern for deity and context
 */
function getEmotionalPattern(deityName, emotionalContext) {
  const baseDeity = deityName.replace(/_[a-z]{2}$/, ''); // Remove language suffix
  const deityPatterns = DEITY_EMOTIONAL_PATTERNS[baseDeity];
  
  if (deityPatterns && deityPatterns[emotionalContext]) {
    return deityPatterns[emotionalContext];
  }
  
  // Generic fallback patterns
  const genericPatterns = {
    calm: { 
      tone: "calm", narration: "neutral", 
      action: "speaks with divine presence",
      tts_action: "speaks with divine presence"
    },
    compassionate: { 
      tone: "compassionate", narration: "slow", 
      action: "voice becomes gentle and understanding",
      tts_action: "voice becomes gentle and understanding"
    },
    motivational: { 
      tone: "motivational", narration: "serious", 
      action: "speaks with encouraging strength",
      tts_action: "speaks with encouraging strength"
    },
    humorous: { 
      tone: "humorous", narration: "playful", 
      action: "chuckles warmly with divine humor",
      tts_action: "chuckles warmly with divine humor"
    },
    firm: { 
      tone: "firm", narration: "serious", 
      action: "speaks with divine authority",
      tts_action: "speaks with divine authority"
    },
    sorrowful: { 
      tone: "sorrowful", narration: "slow", 
      action: "voice carries deep understanding",
      tts_action: "voice carries deep understanding"
    },
    reflective: { 
      tone: "reflective", narration: "slow", 
      action: "speaks with ancient wisdom",
      tts_action: "speaks with ancient wisdom"
    },
    joyful: { 
      tone: "joyful", narration: "warm", 
      action: "voice rings with divine joy",
      tts_action: "voice rings with divine joy"
    }
  };
  
  return genericPatterns[emotionalContext] || genericPatterns.calm;
}

/**
 * Add structured emotional narration (rule-based)
 */
async function addEmotionalNarrationStructured(factualAnswer, deityName, userMessage, citations = []) {
  try {
    // Check if we should add emotion
    if (!shouldAddEmotion(userMessage, factualAnswer)) {
      console.log('[Emotion] Skipping emotion for casual chat');
      return {
        tone: 'calm',
        narration: 'neutral',
        emotion_reason: 'casual conversation',
        spoken_text: factualAnswer,
        tts_text: factualAnswer,
        citations: citations
      };
    }
    
    console.log('[Emotion] Adding structured emotional narration (rule-based)...');
    
    // Clean up any existing tags
    let cleanText = factualAnswer;
    cleanText = cleanText.replace(/<[se]>\s*/g, '').replace(/\s*<\/[se]>/g, '');
    cleanText = cleanText.replace(/\([^)]*speaks[^)]*\)\s*/g, '');
    
    // Detect emotional context
    const emotionalContext = detectEmotionalContext(cleanText, userMessage);
    
    // Get emotional pattern
    const pattern = getEmotionalPattern(deityName, emotionalContext);
    
    // Create structured response
    const emotionalResponse = {
      tone: pattern.tone,
      narration: pattern.narration,
      emotion_reason: `detected ${emotionalContext} from user message and response content`,
      spoken_text: `(${pattern.action}) "${cleanText.trim()}"`,
      tts_text: `${pattern.tts_action}. ${cleanText.trim()}`,
      citations: citations
    };
    
    console.log(`[Emotion] Applied ${emotionalResponse.tone}/${emotionalResponse.narration} narration`);
    console.log(`[Emotion] Reason: ${emotionalResponse.emotion_reason}`);
    
    return emotionalResponse;
    
  } catch (error) {
    console.error('[Emotion] Structured narration failed:', error.message);
    
    // Fallback to basic structured response
    return {
      tone: 'calm',
      narration: 'neutral',
      emotion_reason: 'error_fallback',
      spoken_text: `(speaks with divine presence) "${factualAnswer}"`,
      tts_text: `speaks with divine presence. ${factualAnswer}`,
      citations: citations
    };
  }
}

module.exports = {
  addEmotionalNarrationStructured,
  shouldAddEmotion,
  detectEmotionalContext,
  EMOTION_CATEGORIES,
  NARRATION_STYLES
};