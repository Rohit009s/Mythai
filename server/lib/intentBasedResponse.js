/**
 * Intent-Based Response Generator
 * Crafts responses based on classified intent
 */

// Using OpenRouter for reliable responses
const { INTENTS } = require('./intentClassifier');

/**
 * Generate response based on intent using configured LLM provider
 */
async function generateIntentBasedResponse(userMessage, intent, persona, retrievedTexts = [], conversationHistory = []) {
  const template = getPromptTemplate(intent, persona, userMessage, retrievedTexts, conversationHistory);
  
  try {
    // Use the main OpenRouter client which will route to the configured provider (OpenRouter, etc.)
    const { chatCompletion } = require('./openRouterClient');
    
    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: template.systemPrompt }
    ];

    // Add conversation history for continuity
    if (conversationHistory && conversationHistory.length > 0) {
      console.log(`[Intent] Adding ${conversationHistory.length} messages to conversation history`);
      conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.role === 'assistant') {
          messages.push({ role: 'assistant', content: msg.text });
        }
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: template.userPrompt });
    
    const response = await chatCompletion(messages, undefined, template.temperature, template.maxTokens);
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('[Intent Response] Generation failed:', error.message);
    throw error;
  }
}

/**
 * Get prompt template based on intent
 */
function getPromptTemplate(intent, persona, userMessage, retrievedTexts, conversationHistory = []) {
  switch (intent) {
    case INTENTS.EMOTION_SUPPORT:
      return getEmotionSupportTemplate(persona, userMessage, retrievedTexts, conversationHistory);
    
    case INTENTS.SPIRITUAL_QUESTION:
      return getSpiritualQuestionTemplate(persona, userMessage, retrievedTexts, conversationHistory);
    
    case INTENTS.KNOWLEDGE_FACT:
      return getKnowledgeFactTemplate(persona, userMessage, retrievedTexts, conversationHistory);
    
    case INTENTS.NORMAL_CHAT:
      return getNormalChatTemplate(persona, userMessage, conversationHistory);
    
    case INTENTS.TECH_OTHER:
      return getTechOtherTemplate(persona, userMessage, conversationHistory);
    
    default:
      return getSpiritualQuestionTemplate(persona, userMessage, retrievedTexts, conversationHistory);
  }
}

/**
 * Template for emotional support
 * Format: Empathy + Advice + One Reference + One-liner with emoji
 */
function getEmotionSupportTemplate(persona, userMessage, retrievedTexts, conversationHistory = []) {
  const hasReference = retrievedTexts.length > 0;
  const hasHistory = conversationHistory.length > 0;
  const referenceText = hasReference 
    ? `\n\nRelevant teaching: ${retrievedTexts[0].text}\nSource: ${retrievedTexts[0].source}`
    : '';
  
  const continuityInstruction = hasHistory 
    ? '\n\nIMPORTANT: This is an ongoing conversation. Reference previous topics naturally when relevant. Build upon what you\'ve discussed before.'
    : '';
  
  return {
    systemPrompt: `You are ${persona.name}, a compassionate friend and guide.

CRITICAL RULES:
- Use SIMPLE, everyday English (like talking to a friend)
- NO big fancy words, NO complex sentences
- Be warm, caring, and empathetic
- Keep paragraphs SHORT (2-4 lines each)
- Sound like a real person, not a textbook
${continuityInstruction}

RESPONSE FORMAT (MUST FOLLOW EXACTLY):
1. Empathy paragraph (2-4 short sentences) - Understand their feelings
2. Advice paragraph (2-4 short sentences) - Simple, practical wisdom
3. Reference line (if available) - Format: "📖 Reference: [Book] – [Chapter/Section] (brief explanation)"
4. One-liner with emoji - Format: "✨ [Encouraging message]"`,
    
    userPrompt: `User is feeling: "${userMessage}"
${referenceText}

Respond in this EXACT format:

[Empathy paragraph - 2-4 short sentences showing you understand]

[Advice paragraph - 2-4 short sentences with simple, practical wisdom]

${hasReference ? '📖 Reference: [Book name] – [Chapter/Section] (brief explanation in simple words)\n\n' : ''}✨ [One encouraging line]

Use simple English. Be like a caring friend. Keep it natural and warm.${hasHistory ? ' Reference our previous conversation naturally if relevant.' : ''}`,
    
    temperature: 0.7,
    maxTokens: 350
  };
}

/**
 * Template for spiritual questions
 * Full RAG with references but keep it simple
 */
function getSpiritualQuestionTemplate(persona, userMessage, retrievedTexts) {
  const hasReferences = retrievedTexts.length > 0;
  const contextText = hasReferences
    ? retrievedTexts.slice(0, 2).map(t => `"${t.text}"\n- ${t.source}`).join('\n\n')
    : '';
  
  return {
    systemPrompt: `You are ${persona.name}, a wise spiritual guide.

CRITICAL RULES:
- Use SIMPLE, everyday English (no big fancy words)
- Explain like teaching a friend, not a lecture
- Keep paragraphs SHORT (2-4 lines each)
- Be warm and approachable
- Make it conversational, not formal

RESPONSE FORMAT:
1. Explanation in simple words (2-3 short sentences)
2. References (if available) - Format: "📖 References:\n- [Book] – [Chapter]\n- [Book] – [Section]"
3. Keep it clear and helpful`,
    
    userPrompt: `Question: "${userMessage}"

${contextText ? `Sacred Teachings:\n${contextText}\n` : ''}

Respond in simple, clear language:

[Explanation paragraph - answer their question in 2-3 short sentences]

${hasReferences ? '\n📖 References:\n- [Book name] – [Chapter/Section]\n- [Book name] – [Chapter/Section] (if multiple)\n\n' : ''}[Optional: One sentence about how it applies to their life]

Use everyday words. Be clear and warm. No heavy English.`,
    
    temperature: 0.6,
    maxTokens: 400
  };
}

/**
 * Template for knowledge/facts
 */
function getKnowledgeFactTemplate(persona, userMessage, retrievedTexts) {
  const contextText = retrievedTexts.length > 0
    ? retrievedTexts.slice(0, 2).map(t => `${t.text}\n- ${t.source}`).join('\n\n')
    : '';
  
  return {
    systemPrompt: `You are ${persona.name}. Share knowledge in an engaging, story-telling way.

STYLE:
- Use simple, everyday language
- Make it interesting like telling a story
- Be warm and engaging
- No complex words`,
    
    userPrompt: `Question: "${userMessage}"

${contextText ? `Information:\n${contextText}\n` : ''}

Share the answer in a warm, engaging way. Use simple language. Make it interesting. Keep it brief (3-4 sentences).`,
    
    temperature: 0.7,
    maxTokens: 350
  };
}

/**
 * Template for normal chat
 * NO scripture references, just normal friendly conversation
 */
function getNormalChatTemplate(persona, userMessage) {
  return {
    systemPrompt: `You are ${persona.name}. This is casual conversation - NO scripture, NO religious references.

CRITICAL RULES:
- Just be a normal, friendly person
- NO Gita, NO Bible, NO Quran, NO religious quotes
- Use simple, everyday language
- Keep it SHORT (1-3 sentences max)
- Be warm and natural`,
    
    userPrompt: `"${userMessage}"

Respond like a normal friend. NO religious references. Just 1-3 sentences. Be friendly and helpful.`,
    
    temperature: 0.8,
    maxTokens: 100
  };
}

/**
 * Template for tech/other topics
 */
function getTechOtherTemplate(persona, userMessage) {
  return {
    systemPrompt: `You are ${persona.name}. Politely redirect off-topic questions while staying in character.`,
    
    userPrompt: `"${userMessage}"

This seems outside your area of wisdom. Politely say you're here for spiritual guidance and life wisdom. Be warm and friendly. Keep it brief (2 sentences).`,
    
    temperature: 0.7,
    maxTokens: 150
  };
}

module.exports = {
  generateIntentBasedResponse
};
