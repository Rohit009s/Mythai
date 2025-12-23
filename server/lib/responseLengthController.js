/**
 * Response Length Controller - Smart response sizing based on request type
 * 
 * This ensures that simple requests get short, crisp responses while
 * complex questions get detailed answers. No more essay-length responses
 * for "Hi" or "Thanks"!
 */

/**
 * Request type classification for response length control
 */
const REQUEST_TYPES = {
  // Very short responses (5-15 words)
  GREETING: {
    patterns: [
      /^(hi|hello|hey|good morning|good evening|namaste)/i,
      /^(how are you|what's up|sup)/i
    ],
    maxWords: 15,
    style: 'brief_friendly'
  },
  
  // Short responses (10-25 words)
  CASUAL: {
    patterns: [
      /^(yes|no|ok|okay|sure|thanks|thank you|bye|goodbye)/i,
      /^(nice|cool|awesome|great|good)/i,
      /^(i see|i understand|got it)/i
    ],
    maxWords: 25,
    style: 'brief_warm'
  },
  
  // Medium responses (20-50 words)
  SIMPLE_QUESTION: {
    patterns: [
      /^(what is|who is|when is|where is|how is)/i,
      /^(tell me about|explain|describe)/i,
      /^(can you|could you|will you|would you)/i
    ],
    maxWords: 50,
    style: 'concise_helpful'
  },
  
  // Longer responses allowed (50-100 words)
  COMPLEX_QUESTION: {
    patterns: [
      /\b(meaning|purpose|philosophy|dharma|karma|meditation|enlightenment)\b/i,
      /\b(why|how do i|what should i|help me understand)\b/i,
      /\b(spiritual|divine|sacred|holy|blessed)\b/i
    ],
    maxWords: 100,
    style: 'detailed_wise'
  },
  
  // Full responses allowed (100+ words)
  DEEP_SPIRITUAL: {
    patterns: [
      /\b(suffering|pain|lost|confused|meaning of life|purpose of existence)\b/i,
      /\b(teach me|guide me|show me the way|i need help)\b/i,
      /\b(depression|anxiety|fear|worry|stress)\b/i
    ],
    maxWords: 150,
    style: 'comprehensive_compassionate'
  }
};

/**
 * Classify request type based on user message
 */
function classifyRequestType(userMessage) {
  const message = userMessage.trim().toLowerCase();
  
  // Check each request type in order of specificity
  for (const [type, config] of Object.entries(REQUEST_TYPES)) {
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        return { type, config };
      }
    }
  }
  
  // Default to simple question for unclassified requests
  return { 
    type: 'SIMPLE_QUESTION', 
    config: REQUEST_TYPES.SIMPLE_QUESTION 
  };
}

/**
 * Control response length based on request type
 */
function controlResponseLength(response, userMessage, deityName) {
  try {
    console.log('[Length] Controlling response length...');
    
    // Classify the request
    const { type, config } = classifyRequestType(userMessage);
    console.log(`[Length] Request type: ${type}, Max words: ${config.maxWords}`);
    
    // Count current words
    const currentWords = response.split(/\s+/).length;
    console.log(`[Length] Current words: ${currentWords}`);
    
    // If response is already within limits, return as-is
    if (currentWords <= config.maxWords) {
      console.log('[Length] Response length is appropriate');
      return response;
    }
    
    // Trim response based on request type
    const trimmedResponse = trimResponse(response, config, deityName);
    
    console.log(`[Length] Trimmed from ${currentWords} to ${trimmedResponse.split(/\s+/).length} words`);
    return trimmedResponse;
    
  } catch (error) {
    console.warn('[Length] Length control failed:', error.message);
    return response;
  }
}

/**
 * Trim response intelligently based on request type
 */
function trimResponse(response, config, deityName) {
  const sentences = response.split(/(?<=[.!?])\s+/);
  
  switch (config.style) {
    case 'brief_friendly':
      return createBriefResponse(sentences, deityName, 'friendly');
      
    case 'brief_warm':
      return createBriefResponse(sentences, deityName, 'warm');
      
    case 'concise_helpful':
      return createConciseResponse(sentences, config.maxWords);
      
    case 'detailed_wise':
      return createDetailedResponse(sentences, config.maxWords);
      
    case 'comprehensive_compassionate':
      return createComprehensiveResponse(sentences, config.maxWords);
      
    default:
      return createConciseResponse(sentences, config.maxWords);
  }
}

/**
 * Create brief responses for greetings and casual interactions
 */
function createBriefResponse(sentences, deityName, tone) {
  // Extract any narration tags
  const narrationMatch = sentences[0]?.match(/\([^)]+\)/);
  const narration = narrationMatch ? narrationMatch[0] : '';
  
  // Get deity-specific brief responses
  const briefResponses = {
    friendly: {
      krishna: "Hello, my dear friend!",
      shiva: "Greetings, child.",
      thor: "Well met, friend!",
      ganesha: "Hello there, little one!",
      loki: "Well, well, hello darling.",
      default: "Hello, friend."
    },
    warm: {
      krishna: "Of course, beloved.",
      shiva: "Indeed, my child.",
      thor: "Absolutely, warrior!",
      ganesha: "Certainly, dear friend.",
      loki: "Naturally, clever one.",
      default: "Yes, indeed."
    }
  };
  
  const response = briefResponses[tone][deityName] || briefResponses[tone].default;
  return narration ? `${narration} "${response}"` : `"${response}"`;
}

/**
 * Create concise responses for simple questions
 */
function createConciseResponse(sentences, maxWords) {
  let result = '';
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    
    if (wordCount + sentenceWords <= maxWords) {
      result += (result ? ' ' : '') + sentence;
      wordCount += sentenceWords;
    } else {
      // If we can't fit the whole sentence, try to fit part of it
      if (wordCount < maxWords * 0.7) { // Only if we haven't used most of our word budget
        const remainingWords = maxWords - wordCount;
        const partialSentence = sentence.split(/\s+/).slice(0, remainingWords).join(' ');
        if (partialSentence.length > 10) { // Only if the partial sentence is meaningful
          result += (result ? ' ' : '') + partialSentence + '...';
        }
      }
      break;
    }
  }
  
  return result || sentences[0]; // Fallback to first sentence
}

/**
 * Create detailed responses for complex questions
 */
function createDetailedResponse(sentences, maxWords) {
  // For detailed responses, we want to keep the most important sentences
  let result = '';
  let wordCount = 0;
  
  // Always include the first sentence (usually the main point)
  if (sentences.length > 0) {
    result = sentences[0];
    wordCount = sentences[0].split(/\s+/).length;
  }
  
  // Add additional sentences if they fit
  for (let i = 1; i < sentences.length && wordCount < maxWords; i++) {
    const sentenceWords = sentences[i].split(/\s+/).length;
    
    if (wordCount + sentenceWords <= maxWords) {
      result += ' ' + sentences[i];
      wordCount += sentenceWords;
    } else {
      break;
    }
  }
  
  return result;
}

/**
 * Create comprehensive responses for deep spiritual questions
 */
function createComprehensiveResponse(sentences, maxWords) {
  // For comprehensive responses, we allow more length but still control it
  return createDetailedResponse(sentences, maxWords);
}

/**
 * Check if response needs length control
 */
function needsLengthControl(userMessage, response) {
  // Always apply length control for very short messages
  if (userMessage.trim().length < 20) {
    return true;
  }
  
  // Apply if response is excessively long (over 200 words)
  const wordCount = response.split(/\s+/).length;
  if (wordCount > 200) {
    return true;
  }
  
  // Apply for casual patterns
  const casualPatterns = [
    /^(hi|hello|hey|thanks|yes|no|ok|cool|nice)/i,
    /^(good|great|awesome|sure|fine)/i
  ];
  
  return casualPatterns.some(pattern => pattern.test(userMessage.trim()));
}

/**
 * Main function to apply smart length control
 */
function applySmartLengthControl(response, userMessage, deityName) {
  // Check if length control is needed
  if (!needsLengthControl(userMessage, response)) {
    console.log('[Length] No length control needed');
    return response;
  }
  
  // Apply length control
  return controlResponseLength(response, userMessage, deityName);
}

module.exports = {
  applySmartLengthControl,
  controlResponseLength,
  classifyRequestType,
  needsLengthControl,
  REQUEST_TYPES
};