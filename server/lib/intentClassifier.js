/**
 * Intent Classifier with LLM
 * Uses LLM to intelligently classify user intent and decide RAG usage
 */

const { chatCompletion } = require('./huggingfaceClient');

/**
 * Intent types
 */
const INTENTS = {
  EMOTION_SUPPORT: 'EMOTION_SUPPORT',      // Feelings: sad, anxious, confused
  SPIRITUAL_QUESTION: 'SPIRITUAL_QUESTION', // "What does Gita say about karma?"
  KNOWLEDGE_FACT: 'KNOWLEDGE_FACT',        // "Who is Krishna?", "Story of..."
  NORMAL_CHAT: 'NORMAL_CHAT',              // "How is weather?", "Hello"
  TECH_OTHER: 'TECH_OTHER'                 // Technical or off-topic
};

/**
 * Classify user intent using LLM (OpenRouter for reliability)
 */
async function classifyIntent(userMessage) {
  const classificationPrompt = `Classify this user message into ONE category and decide if we need sacred scripture references.

USER MESSAGE: "${userMessage}"

CATEGORIES:
1. EMOTION_SUPPORT - User expressing feelings (sad, anxious, confused, lonely, worried, stressed, happy, grateful)
2. SPIRITUAL_QUESTION - Asking about spiritual concepts, teachings, or religious texts
3. KNOWLEDGE_FACT - Asking for facts, stories, or information about deities/mythology
4. NORMAL_CHAT - Casual conversation (greetings, weather, time, jokes, general chat)
5. TECH_OTHER - Technical questions or completely off-topic

RULES:
- If user expresses ANY emotion → EMOTION_SUPPORT (even if asking spiritual question)
- If asking about scripture/teachings → SPIRITUAL_QUESTION
- If asking who/what/story → KNOWLEDGE_FACT
- If casual/greeting → NORMAL_CHAT
- If technical/off-topic → TECH_OTHER

SCRIPTURE RAG NEEDED:
- EMOTION_SUPPORT → true (one relevant teaching)
- SPIRITUAL_QUESTION → true (detailed references)
- KNOWLEDGE_FACT → true (factual information)
- NORMAL_CHAT → false (no scripture needed)
- TECH_OTHER → false (no scripture needed)

Reply ONLY with valid JSON (no markdown, no explanation):
{"intent":"CATEGORY_NAME","use_scripture_rag":true/false,"confidence":"high/medium/low"}`;

  try {
    // Use the main OpenAI client which will route to the configured provider
    const { chatCompletion } = require('./openaiClient');
    
    const response = await chatCompletion([
      { role: 'system', content: 'You are a classification system. Reply ONLY with JSON.' },
      { role: 'user', content: classificationPrompt }
    ], null, 0.3, 150); // Low temperature for consistent classification

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    const classification = JSON.parse(content);
    
    // Validate
    if (!classification.intent || !INTENTS[classification.intent]) {
      throw new Error('Invalid intent classification');
    }
    
    console.log(`[Intent] Classified as: ${classification.intent} (RAG: ${classification.use_scripture_rag})`);
    
    return {
      intent: classification.intent,
      useScriptureRAG: classification.use_scripture_rag,
      confidence: classification.confidence || 'medium',
      raw: classification
    };
  } catch (error) {
    console.error('[Intent] Classification failed:', error.message);
    
    // Fallback to keyword-based classification
    return fallbackClassification(userMessage);
  }
}

/**
 * Fallback classification using keywords (if LLM fails)
 */
function fallbackClassification(text) {
  const lowerText = text.toLowerCase();
  
  // Emotion keywords
  const emotionKeywords = [
    'feel', 'feeling', 'sad', 'happy', 'depressed', 'anxious', 'worried',
    'afraid', 'scared', 'angry', 'hurt', 'pain', 'suffering', 'lonely',
    'confused', 'lost', 'stressed', 'overwhelmed', 'grateful', 'blessed'
  ];
  
  // Spiritual keywords
  const spiritualKeywords = [
    'dharma', 'karma', 'moksha', 'gita', 'bible', 'quran', 'scripture',
    'teaching', 'verse', 'chapter', 'says about', 'according to'
  ];
  
  // Knowledge keywords
  const knowledgeKeywords = [
    'who is', 'what is', 'tell me about', 'story of', 'explain',
    'history of', 'meaning of'
  ];
  
  // Casual keywords
  const casualKeywords = [
    'hello', 'hi', 'hey', 'good morning', 'good evening', 'how are you',
    'weather', 'time', 'date', 'joke', 'thanks', 'thank you'
  ];
  
  // Check emotion first (highest priority)
  for (const keyword of emotionKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        intent: INTENTS.EMOTION_SUPPORT,
        useScriptureRAG: true,
        confidence: 'medium',
        fallback: true
      };
    }
  }
  
  // Check casual
  for (const keyword of casualKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        intent: INTENTS.NORMAL_CHAT,
        useScriptureRAG: false,
        confidence: 'medium',
        fallback: true
      };
    }
  }
  
  // Check spiritual
  for (const keyword of spiritualKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        intent: INTENTS.SPIRITUAL_QUESTION,
        useScriptureRAG: true,
        confidence: 'medium',
        fallback: true
      };
    }
  }
  
  // Check knowledge
  for (const keyword of knowledgeKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        intent: INTENTS.KNOWLEDGE_FACT,
        useScriptureRAG: true,
        confidence: 'medium',
        fallback: true
      };
    }
  }
  
  // Default: treat as spiritual question (safer)
  return {
    intent: INTENTS.SPIRITUAL_QUESTION,
    useScriptureRAG: true,
    confidence: 'low',
    fallback: true
  };
}

/**
 * Get response template based on intent
 */
function getResponseTemplate(intent) {
  const templates = {
    [INTENTS.EMOTION_SUPPORT]: {
      structure: 'empathy + advice + one_reference + closing_line',
      style: 'warm, caring, simple language',
      maxLength: 400,
      includeReference: true,
      referenceCount: 1
    },
    [INTENTS.SPIRITUAL_QUESTION]: {
      structure: 'explanation + detailed_references + application',
      style: 'wise, clear, educational',
      maxLength: 600,
      includeReference: true,
      referenceCount: 2
    },
    [INTENTS.KNOWLEDGE_FACT]: {
      structure: 'factual_answer + context + one_reference',
      style: 'informative, clear, engaging',
      maxLength: 500,
      includeReference: true,
      referenceCount: 1
    },
    [INTENTS.NORMAL_CHAT]: {
      structure: 'friendly_response',
      style: 'casual, warm, brief',
      maxLength: 150,
      includeReference: false,
      referenceCount: 0
    },
    [INTENTS.TECH_OTHER]: {
      structure: 'polite_redirect',
      style: 'friendly, helpful',
      maxLength: 200,
      includeReference: false,
      referenceCount: 0
    }
  };
  
  return templates[intent] || templates[INTENTS.SPIRITUAL_QUESTION];
}

module.exports = {
  classifyIntent,
  getResponseTemplate,
  INTENTS
};
