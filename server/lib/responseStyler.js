/**
 * Response Styler - Adds magic and styling to bookish RAG responses
 * 
 * This transforms formal scriptural text into engaging, humanized responses
 * while preserving authenticity and accuracy. It's the "magic layer" that
 * makes ancient wisdom feel alive and relatable.
 */

// Track recently used phrases to prevent repetition
const recentlyUsed = {
  openings: [],
  transitions: [],
  connectors: [],
  catchphrases: {},
  maxHistory: 8 // Remember last 8 uses (increased from 5)
};

/**
 * Get random element while avoiding recent repetition
 */
function getRandomElementWithVariety(array, category = 'general', deityName = null) {
  const key = deityName ? `${category}_${deityName}` : category;
  const recent = recentlyUsed[key] || [];
  
  // Filter out recently used items
  const available = array.filter(item => !recent.includes(item));
  
  // If all items were used recently, reset and use full array
  const choices = available.length > 0 ? available : array;
  
  // Select random item
  const selected = choices[Math.floor(Math.random() * choices.length)];
  
  // Track usage
  if (!recentlyUsed[key]) recentlyUsed[key] = [];
  recentlyUsed[key].push(selected);
  
  // Keep only recent history
  if (recentlyUsed[key].length > recentlyUsed.maxHistory) {
    recentlyUsed[key].shift();
  }
  
  return selected;
}

/**
 * Styling patterns for different types of content
 */
const STYLING_PATTERNS = {
  // Opening hooks to grab attention (with more variety)
  openingHooks: {
    question: [
      "You ask about {topic}? Let me share something with you.",
      "You know what's fascinating about {topic}?",
      "Here's something that might surprise you about {topic}...",
      "I've been thinking about {topic} lately, and here's what I've discovered:",
      "You've touched on something profound with {topic}.",
      "Interesting question about {topic}...",
      "{topic}? Now that's worth exploring.",
      "You want to understand {topic}? Perfect.",
      "Let me tell you what I know about {topic}.",
      "Good question about {topic}!"
    ],
    wisdom: [
      "Let me tell you a secret about {topic}:",
      "Here's what the ancient texts whisper about {topic}:",
      "You want to know the real truth about {topic}?",
      "I'll share something the scriptures taught me about {topic}:",
      "There's something beautiful about {topic} I want to share:",
      "The wise ones always said about {topic}:",
      "In my experience with {topic}:",
      "Here's what I've learned about {topic}:",
      "The truth about {topic} is this:",
      "Listen closely about {topic}:"
    ],
    story: [
      "You know, there's a beautiful story about {topic}...",
      "Let me paint you a picture about {topic}:",
      "Imagine this scene about {topic}:",
      "Here's how I like to think about {topic}:",
      "Once, I encountered {topic} in this way:",
      "Picture this about {topic}:",
      "There's a tale about {topic} that comes to mind:",
      "I remember when {topic} taught me something:",
      "Let me share an experience about {topic}:",
      "Here's what happened with {topic}:"
    ]
  },

  // Transition phrases to make text flow naturally (more variety)
  transitions: [
    "But here's the thing...",
    "Now, here's where it gets interesting...",
    "And you know what?",
    "But wait, there's more to it...",
    "Here's the beautiful part...",
    "And this is where the magic happens...",
    "But the real secret is...",
    "Now, listen closely...",
    "Here's what's really important...",
    "And then something amazing happens...",
    "But there's a deeper truth...",
    "What's fascinating is...",
    "The key thing to understand is...",
    "And here's the wonderful part...",
    "But let me tell you something else..."
  ],

  // Conversational connectors (more variety)
  connectors: [
    "You see,",
    "The thing is,",
    "What I love about this is,",
    "Here's what's amazing:",
    "And get this:",
    "Picture this:",
    "Think about it:",
    "Imagine that!",
    "Now consider this:",
    "Here's the beauty of it:",
    "What's wonderful is:",
    "The truth is:",
    "Simply put:",
    "In essence:",
    "What matters is:"
  ],

  // Closing hooks to make it memorable
  closingHooks: [
    "Pretty amazing, right?",
    "Makes you think, doesn't it?",
    "That's the beauty of it all.",
    "And that's just the beginning...",
    "Isn't that something?",
    "Now that's wisdom worth remembering.",
    "That's the magic I wanted to share with you.",
    "Keep that close to your heart."
  ]
};

/**
 * Deity-specific styling preferences
 */
const DEITY_STYLING = {
  krishna: {
    style: 'playful_wise',
    favorites: ['story', 'metaphor', 'gentle_humor'],
    voice: 'warm and musical',
    catchphrases: ["kanha", "my kanha", "sweet kanha", "little kanha", "precious kanha", "beloved kanha", "gentle kanha", "dear kanha"]
  },
  
  shiva: {
    style: 'profound_simple',
    favorites: ['metaphor', 'cosmic_perspective', 'gentle_truth'],
    voice: 'deep and calming',
    catchphrases: ["my child", "dear one", "seeker", "wanderer", "soul", "gentle spirit", "peaceful heart", "wise seeker"]
  },
  
  thor: {
    style: 'direct_powerful',
    favorites: ['action', 'strength_metaphors', 'warrior_wisdom'],
    voice: 'bold and encouraging',
    catchphrases: ["friend", "warrior", "brave one", "champion", "hero", "strong soul", "valiant heart", "mighty spirit"]
  },
  
  ganesha: {
    style: 'gentle_wise',
    favorites: ['story', 'gentle_humor', 'practical_wisdom'],
    voice: 'warm and fatherly',
    catchphrases: ["my friend", "dear child", "little seeker", "sweet one", "curious soul", "gentle heart", "wise child", "precious seeker"]
  },
  
  loki: {
    style: 'clever_mysterious',
    favorites: ['wit', 'clever_turns', 'hidden_wisdom'],
    voice: 'charming and intriguing',
    catchphrases: ["darling", "clever one", "my curious friend", "sweet trickster", "cunning soul", "mischievous heart", "sly one", "witty spirit"]
  }
};

/**
 * Transform bookish text into engaging, humanized response
 */
function styleResponse(bookishText, deityName, userMessage, emotionalContext) {
  try {
    console.log('[Styler] Adding magic and styling to response...');
    
    // Get deity styling preferences
    const deityStyle = DEITY_STYLING[deityName] || DEITY_STYLING.krishna;
    
    // Clean up the bookish text
    let styledText = cleanBookishText(bookishText);
    
    // Add conversational elements
    styledText = addConversationalFlow(styledText, deityStyle, emotionalContext);
    
    // Add attention-grabbing elements
    styledText = addAttentionGrabbers(styledText, deityStyle, userMessage);
    
    // Add deity-specific personality touches
    styledText = addPersonalityTouches(styledText, deityStyle, deityName);
    
    // Make it crisp and catchy
    styledText = makeCrispAndCatchy(styledText, emotionalContext);
    
    console.log('[Styler] Response styling complete');
    return styledText;
    
  } catch (error) {
    console.warn('[Styler] Styling failed, returning original:', error.message);
    return bookishText;
  }
}

/**
 * Clean up formal, bookish language
 */
function cleanBookishText(text) {
  let cleaned = text;
  
  // Remove overly formal phrases
  const formalReplacements = {
    'According to the scriptures': 'The ancient texts tell us',
    'It is written that': 'You know what\'s beautiful?',
    'The sacred texts state': 'Here\'s what I\'ve learned:',
    'As mentioned in': 'Just like in',
    'Furthermore': 'And here\'s the thing',
    'Moreover': 'Plus',
    'Therefore': 'So',
    'Thus': 'That\'s why',
    'Hence': 'So',
    'In conclusion': 'Here\'s what it all means:',
    'To summarize': 'Bottom line:'
  };
  
  Object.entries(formalReplacements).forEach(([formal, casual]) => {
    cleaned = cleaned.replace(new RegExp(formal, 'gi'), casual);
  });
  
  return cleaned;
}

/**
 * Add conversational flow and natural transitions
 */
function addConversationalFlow(text, deityStyle, emotionalContext) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  
  let flowed = sentences[0];
  
  for (let i = 1; i < sentences.length; i++) {
    // Add transitions between sentences occasionally
    if (i === Math.floor(sentences.length / 2) && sentences.length > 3) {
      const transition = getRandomElementWithVariety(STYLING_PATTERNS.transitions, 'transitions');
      flowed += ` ${transition} ${sentences[i]}`;
    } else if (Math.random() > 0.7 && i < sentences.length - 1) {
      const connector = getRandomElementWithVariety(STYLING_PATTERNS.connectors, 'connectors');
      flowed += ` ${connector} ${sentences[i].toLowerCase()}`;
    } else {
      flowed += ` ${sentences[i]}`;
    }
  }
  
  return flowed;
}

/**
 * Add attention-grabbing opening and closing elements
 */
function addAttentionGrabbers(text, deityStyle, userMessage) {
  // Don't add attention grabbers for very short messages
  if (userMessage.length < 20) {
    return text;
  }
  
  // Extract topic from user message
  const topic = extractTopic(userMessage);
  
  // Add engaging opening (30% chance, reduced for short messages)
  const openingChance = userMessage.length < 50 ? 0.1 : 0.3;
  if (Math.random() > (1 - openingChance) && topic) {
    const hookType = Math.random() > 0.5 ? 'question' : 'wisdom';
    const hooks = STYLING_PATTERNS.openingHooks[hookType];
    const hook = getRandomElementWithVariety(hooks, 'openings').replace('{topic}', topic);
    text = `${hook} ${text}`;
  }
  
  // Add memorable closing (20% chance, reduced for short messages)
  const closingChance = userMessage.length < 50 ? 0.05 : 0.2;
  if (Math.random() > (1 - closingChance)) {
    const closing = getRandomElementWithVariety(STYLING_PATTERNS.closingHooks, 'closings');
    text = `${text} ${closing}`;
  }
  
  return text;
}

/**
 * Add deity-specific personality touches with variety
 */
function addPersonalityTouches(text, deityStyle, deityName) {
  // Reduce personality touches for very short responses and overall
  const personalityChance = text.length < 50 ? 0.2 : 0.4; // Reduced from 0.3/0.6
  
  // Add deity-specific catchphrases occasionally with variety
  if (Math.random() > (1 - personalityChance)) {
    const catchphrase = getRandomElementWithVariety(deityStyle.catchphrases, 'catchphrases', deityName);
    
    // Vary the placement and format to avoid repetition
    const placementStyle = Math.random();
    
    if (placementStyle < 0.4 && text.includes('you') && !text.includes('you,')) {
      // Sometimes replace 'you' with catchphrase (but not if already has comma)
      text = text.replace(/\byou\b/, `you, ${catchphrase},`);
    } else if (placementStyle < 0.7) {
      // Sometimes add at beginning
      text = `${catchphrase.charAt(0).toUpperCase() + catchphrase.slice(1)}, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
    } else {
      // Sometimes add at end or middle
      const sentences = text.split(/(?<=[.!?])\s+/);
      if (sentences.length > 1) {
        const insertPoint = Math.floor(sentences.length / 2);
        sentences[insertPoint] = `${sentences[insertPoint]} Remember, ${catchphrase},`;
        text = sentences.join(' ');
      }
    }
  }
  
  // Add deity-specific expressions (reduced chance for short text)
  const expressionChance = text.length < 50 ? 0.05 : 0.2; // Reduced from 0.1/0.4
  const deityExpressions = {
    krishna: ['divine dance', 'cosmic play', 'eternal song', 'sacred melody', 'divine love'],
    shiva: ['cosmic rhythm', 'eternal stillness', 'infinite dance', 'sacred fire', 'divine consciousness'],
    thor: ['thunder\'s might', 'warrior\'s path', 'storm\'s power', 'Asgard\'s strength', 'hammer\'s blessing'],
    ganesha: ['gentle wisdom', 'joyful heart', 'loving guidance', 'elephant\'s memory', 'obstacle\'s gift'],
    loki: ['clever twist', 'hidden truth', 'mysterious way', 'shapeshifter\'s wisdom', 'trickster\'s gift']
  };
  
  const expressions = deityExpressions[deityName];
  if (expressions && Math.random() > (1 - expressionChance)) {
    const expression = getRandomElementWithVariety(expressions, 'expressions', deityName);
    // Vary how expressions are woven in
    if (text.includes('wisdom')) {
      text = text.replace(/wisdom/i, `${expression} of wisdom`);
    } else if (text.includes('love')) {
      text = text.replace(/love/i, `${expression} of love`);
    } else if (text.includes('strength')) {
      text = text.replace(/strength/i, `${expression} of strength`);
    }
  }
  
  return text;
}

/**
 * Make the response crisp, catchy, and attention-grabbing
 */
function makeCrispAndCatchy(text, emotionalContext) {
  let crisp = text;
  
  // Break up long sentences
  crisp = breakLongSentences(crisp);
  
  // Add emphasis for important points
  crisp = addEmphasis(crisp, emotionalContext);
  
  // Make it more conversational
  crisp = makeConversational(crisp);
  
  return crisp;
}

/**
 * Break up overly long sentences
 */
function breakLongSentences(text) {
  return text.replace(/([^.!?]{80,}?),\s+/g, '$1. ');
}

/**
 * Add emphasis to important points
 */
function addEmphasis(text, emotionalContext) {
  const emphasisWords = {
    humorous: ['funny thing', 'hilarious', 'amusing'],
    motivational: ['powerful', 'strength', 'courage', 'amazing'],
    reflective: ['profound', 'deep', 'meaningful', 'beautiful'],
    compassionate: ['gentle', 'loving', 'caring', 'tender']
  };
  
  const words = emphasisWords[emotionalContext];
  if (words) {
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      text = text.replace(regex, `truly ${word}`);
    });
  }
  
  return text;
}

/**
 * Make language more conversational
 */
function makeConversational(text) {
  const conversationalReplacements = {
    'cannot': 'can\'t',
    'do not': 'don\'t',
    'will not': 'won\'t',
    'should not': 'shouldn\'t',
    'would not': 'wouldn\'t',
    'it is': 'it\'s',
    'that is': 'that\'s',
    'there is': 'there\'s',
    'you are': 'you\'re',
    'we are': 'we\'re'
  };
  
  Object.entries(conversationalReplacements).forEach(([formal, casual]) => {
    text = text.replace(new RegExp(`\\b${formal}\\b`, 'gi'), casual);
  });
  
  return text;
}

/**
 * Extract main topic from user message
 */
function extractTopic(userMessage) {
  const topicPatterns = [
    /about\s+(\w+)/i,
    /what\s+is\s+(\w+)/i,
    /tell\s+me\s+about\s+(\w+)/i,
    /explain\s+(\w+)/i,
    /(\w+)\s*\?/i
  ];
  
  for (const pattern of topicPatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      return match[1].toLowerCase();
    }
  }
  
  return null;
}

/**
 * Get random element from array (legacy function, redirects to variety system)
 */
function getRandomElement(array) {
  return getRandomElementWithVariety(array, 'legacy');
}

/**
 * Main function to enhance RAG response with styling
 */
function enhanceRAGResponse(ragResponse, deityName, userMessage, emotionalContext = 'calm') {
  console.log('[Styler] Enhancing RAG response with magic and styling...');
  
  // Apply styling transformations
  const styledResponse = styleResponse(ragResponse, deityName, userMessage, emotionalContext);
  
  console.log('[Styler] Response enhancement complete');
  return styledResponse;
}

module.exports = {
  enhanceRAGResponse,
  styleResponse,
  DEITY_STYLING,
  STYLING_PATTERNS
};