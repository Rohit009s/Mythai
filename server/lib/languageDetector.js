/**
 * Language Detector with Transliteration Support
 * Detects language from text (including Romanized regional languages)
 * Supports: English, Hindi, Telugu, Tamil (both native script and Romanized)
 */

/**
 * Common words/patterns for language detection
 */
const LANGUAGE_PATTERNS = {
  // Telugu patterns (both script and Romanized)
  telugu: {
    script: /[\u0C00-\u0C7F]/,  // Telugu Unicode range
    romanized: [
      'tinava', 'tinnava', 'ela unnav', 'ela unnaru', 'meeru', 'nenu',
      'cheppandi', 'cheppu', 'emiti', 'enti', 'ela', 'enduku', 'ekkada',
      'eppudu', 'evaru', 'dhanyavadalu', 'namaskaram', 'bagunnara',
      'manchidi', 'baaledu', 'avunu', 'kaadu', 'chala', 'konchem'
    ],
    commonWords: ['తిన్నావా', 'ఎలా', 'ఉన్నావ', 'మీరు', 'నేను', 'చెప్పండి']
  },
  
  // Hindi patterns (both script and Romanized)
  hindi: {
    script: /[\u0900-\u097F]/,  // Devanagari Unicode range
    romanized: [
      'kaise', 'kaisa', 'kya', 'kyun', 'kahan', 'kab', 'kaun',
      'aap', 'tum', 'main', 'hum', 'acha', 'theek', 'dhanyavaad',
      'namaste', 'shukriya', 'haan', 'nahi', 'bahut', 'thoda',
      'batao', 'bataiye', 'samajh', 'seekho'
    ],
    commonWords: ['कैसे', 'क्या', 'आप', 'मैं', 'धन्यवाद', 'नमस्ते']
  },
  
  // Tamil patterns (both script and Romanized)
  tamil: {
    script: /[\u0B80-\u0BFF]/,  // Tamil Unicode range
    romanized: [
      'eppadi', 'epdi', 'enna', 'yean', 'enga', 'eppo', 'yaar',
      'neenga', 'naan', 'sollunga', 'sollu', 'nandri', 'vanakkam',
      'sari', 'illa', 'romba', 'konjam', 'puriyudha', 'theriyuma'
    ],
    commonWords: ['எப்படி', 'என்ன', 'நீங்க', 'நான்', 'நன்றி']
  }
};

/**
 * Detect language from text
 * Returns: { language: 'en'|'hi'|'te'|'ta', confidence: 'high'|'medium'|'low', isRomanized: boolean }
 */
function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  
  // Check for native scripts first (highest confidence)
  if (LANGUAGE_PATTERNS.telugu.script.test(text)) {
    return { language: 'te', confidence: 'high', isRomanized: false };
  }
  if (LANGUAGE_PATTERNS.hindi.script.test(text)) {
    return { language: 'hi', confidence: 'high', isRomanized: false };
  }
  if (LANGUAGE_PATTERNS.tamil.script.test(text)) {
    return { language: 'ta', confidence: 'high', isRomanized: false };
  }
  
  // Check for Romanized regional languages
  let teluguScore = 0;
  let hindiScore = 0;
  let tamilScore = 0;
  
  // Telugu Romanized detection
  for (const word of LANGUAGE_PATTERNS.telugu.romanized) {
    if (lowerText.includes(word)) {
      teluguScore += 2;
    }
  }
  
  // Hindi Romanized detection
  for (const word of LANGUAGE_PATTERNS.hindi.romanized) {
    if (lowerText.includes(word)) {
      hindiScore += 2;
    }
  }
  
  // Tamil Romanized detection
  for (const word of LANGUAGE_PATTERNS.tamil.romanized) {
    if (lowerText.includes(word)) {
      tamilScore += 2;
    }
  }
  
  // Determine language based on scores
  const maxScore = Math.max(teluguScore, hindiScore, tamilScore);
  
  if (maxScore >= 2) {
    if (teluguScore === maxScore) {
      return { language: 'te', confidence: 'high', isRomanized: true };
    }
    if (hindiScore === maxScore) {
      return { language: 'hi', confidence: 'high', isRomanized: true };
    }
    if (tamilScore === maxScore) {
      return { language: 'ta', confidence: 'high', isRomanized: true };
    }
  }
  
  // Check for English indicators
  const englishWords = ['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an'];
  let englishScore = 0;
  for (const word of englishWords) {
    if (lowerText.includes(word)) {
      englishScore++;
    }
  }
  
  if (englishScore >= 2) {
    return { language: 'en', confidence: 'high', isRomanized: false };
  }
  
  // Default to English if uncertain
  return { language: 'en', confidence: 'low', isRomanized: false };
}

/**
 * Get appropriate persona suffix based on detected language
 */
function getPersonaSuffix(detectedLanguage) {
  if (detectedLanguage.language === 'en') {
    return '';
  }
  return `_${detectedLanguage.language}`;
}

/**
 * Create language instruction for LLM
 */
function getLanguageInstruction(detectedLanguage) {
  if (detectedLanguage.language === 'en') {
    return 'Respond in English.';
  }
  
  const languageNames = {
    hi: 'Hindi (हिंदी)',
    te: 'Telugu (తెలుగు)',
    ta: 'Tamil (தமிழ்)'
  };
  
  const langName = languageNames[detectedLanguage.language] || 'English';
  
  if (detectedLanguage.isRomanized) {
    return `The user wrote in Romanized ${langName} (English script). Respond in native ${langName} script. For example, if they wrote "tinava", respond with "తిన్నావా?" in Telugu script.`;
  }
  
  return `Respond in ${langName} using native script.`;
}

module.exports = {
  detectLanguage,
  getPersonaSuffix,
  getLanguageInstruction,
  LANGUAGE_PATTERNS
};
