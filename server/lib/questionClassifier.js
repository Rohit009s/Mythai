/**
 * Question Classifier
 * Determines if a question needs sacred text references or just AI response
 */

/**
 * Classify question type
 * @returns {Object} { needsReference: boolean, category: string }
 */
function classifyQuestion(text) {
  const lowerText = text.toLowerCase();
  
  // Keywords that indicate spiritual/philosophical questions (need references)
  const spiritualKeywords = [
    // Spiritual concepts
    'dharma', 'karma', 'moksha', 'nirvana', 'enlightenment', 'salvation', 'sin',
    'soul', 'spirit', 'divine', 'god', 'goddess', 'deity', 'prayer', 'worship',
    'meditation', 'yoga', 'mantra', 'scripture', 'holy', 'sacred',
    
    // Emotional/life guidance
    'sad', 'depressed', 'anxious', 'worried', 'afraid', 'fear', 'angry', 'hurt',
    'suffering', 'pain', 'grief', 'loss', 'lonely', 'confused', 'lost',
    'purpose', 'meaning', 'life', 'death', 'destiny', 'fate',
    
    // Moral/ethical questions
    'right', 'wrong', 'should i', 'moral', 'ethical', 'virtue', 'vice',
    'good', 'evil', 'justice', 'truth', 'honesty', 'compassion',
    
    // Relationship/guidance
    'relationship', 'family', 'love', 'marriage', 'friendship', 'forgiveness',
    'guidance', 'advice', 'help me', 'teach me', 'wisdom', 'lesson',
    
    // Religious practices
    'ritual', 'ceremony', 'festival', 'temple', 'church', 'mosque',
    'bhagavad gita', 'bible', 'quran', 'ramayana', 'mahabharata',
    
    // Philosophical
    'why', 'how to live', 'how to be', 'what is the meaning',
    'what should i do', 'how can i', 'help me understand'
  ];
  
  // Keywords that indicate general/casual questions (no references needed)
  const casualKeywords = [
    'weather', 'temperature', 'rain', 'sunny', 'cloudy',
    'time', 'date', 'today', 'tomorrow', 'yesterday',
    'hello', 'hi', 'hey', 'good morning', 'good evening',
    'how are you', 'what\'s up', 'sup',
    'joke', 'funny', 'laugh',
    'food', 'recipe', 'cook', 'eat',
    'movie', 'music', 'song', 'game',
    'news', 'sports', 'cricket', 'football'
  ];
  
  // Check for casual keywords first
  for (const keyword of casualKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        needsReference: false,
        category: 'casual',
        reason: `Detected casual keyword: ${keyword}`
      };
    }
  }
  
  // Check for spiritual keywords
  for (const keyword of spiritualKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        needsReference: true,
        category: 'spiritual',
        reason: `Detected spiritual keyword: ${keyword}`
      };
    }
  }
  
  // Check question patterns
  const spiritualPatterns = [
    /why (do|does|did|is|are|am)/i,
    /what is (the meaning|purpose|point)/i,
    /how (can|should|do) i (be|become|find|achieve)/i,
    /i (feel|am feeling|felt) (sad|depressed|lost|confused|angry)/i,
    /help me (with|understand|find)/i,
    /teach me (about|how)/i,
    /tell me about (life|death|purpose|meaning)/i
  ];
  
  for (const pattern of spiritualPatterns) {
    if (pattern.test(text)) {
      return {
        needsReference: true,
        category: 'spiritual',
        reason: 'Matched spiritual question pattern'
      };
    }
  }
  
  // Default: if question is longer than 10 words and seems thoughtful, use references
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 10) {
    return {
      needsReference: true,
      category: 'thoughtful',
      reason: 'Long, thoughtful question'
    };
  }
  
  // Very short questions - probably casual
  if (wordCount <= 3) {
    return {
      needsReference: false,
      category: 'casual',
      reason: 'Very short question'
    };
  }
  
  // Default to spiritual (safer to include references)
  return {
    needsReference: true,
    category: 'default',
    reason: 'Default to spiritual context'
  };
}

module.exports = {
  classifyQuestion
};
