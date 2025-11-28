/**
 * Two-Stage LLM Pipeline: Thinker + Speaker
 * Stage 1 (THINKER): Focus on accuracy and grounding in sacred texts
 * Stage 2 (SPEAKER): Polish for conversational tone and warmth
 */

const { chatCompletion: huggingfaceChat } = require('./huggingfaceClient');

/**
 * Stage 1: THINKER - Get accurate, grounded answer
 */
async function getThinkerResponse(userMessage, context, persona) {
  const thinkerPrompt = `You are ${persona.name}, a knowledgeable guide. Using ONLY the context below, answer the question accurately and respectfully.

CONTEXT FROM SACRED TEXTS:
${context}

USER QUESTION: ${userMessage}

INSTRUCTIONS:
- Answer based ONLY on the provided context
- Be accurate and clear
- Don't worry about conversational style yet
- If context doesn't contain the answer, say so honestly
- Keep it factual and grounded

YOUR ANSWER:`;

  const response = await huggingfaceChat([
    { role: 'system', content: 'You are a knowledgeable religious scholar focused on accuracy.' },
    { role: 'user', content: thinkerPrompt }
  ], null, 0.3, 400); // model, temperature, maxTokens

  return response.choices[0].message.content;
}

/**
 * Stage 2: SPEAKER - Polish for warmth and conversational tone
 */
async function getSpeakerResponse(rawAnswer, persona, userMessage) {
  const speakerPrompt = `You are ${persona.name}, speaking with warmth and wisdom. Rewrite the following answer to sound like a warm, human conversation.

ORIGINAL ANSWER:
${rawAnswer}

INSTRUCTIONS:
- Keep the meaning 100% the same - don't add new facts
- Make it sound warm, friendly, and conversational
- Use ${persona.name}'s speaking style: ${persona.speakingStyle || 'wise and compassionate'}
- Keep it concise (2-3 sentences max)
- Sound like you're talking to a friend seeking guidance
- Don't change any factual content

USER'S QUESTION WAS: ${userMessage}

YOUR WARM, CONVERSATIONAL RESPONSE:`;

  const response = await huggingfaceChat([
    { role: 'system', content: `You are ${persona.name}, known for ${persona.traits || 'wisdom and compassion'}. Speak warmly and naturally.` },
    { role: 'user', content: speakerPrompt }
  ], null, 0.7, 300); // model, temperature, maxTokens

  return response.choices[0].message.content;
}

/**
 * Main function: Two-stage pipeline
 */
async function generateTwoStageResponse(userMessage, context, persona) {
  console.log('[Two-Stage LLM] Starting pipeline...');
  
  const startTime = Date.now();
  
  // Stage 1: Get accurate answer
  console.log('[Two-Stage LLM] Stage 1: THINKER (accuracy)...');
  const thinkerResponse = await getThinkerResponse(userMessage, context, persona);
  const thinkerTime = Date.now() - startTime;
  console.log(`[Two-Stage LLM] Thinker completed in ${thinkerTime}ms`);
  
  // Stage 2: Polish for conversation
  console.log('[Two-Stage LLM] Stage 2: SPEAKER (polish)...');
  const speakerResponse = await getSpeakerResponse(thinkerResponse, persona, userMessage);
  const totalTime = Date.now() - startTime;
  console.log(`[Two-Stage LLM] Speaker completed in ${totalTime - thinkerTime}ms`);
  console.log(`[Two-Stage LLM] Total pipeline time: ${totalTime}ms`);
  
  return {
    finalResponse: speakerResponse,
    rawResponse: thinkerResponse, // Keep for debugging/comparison
    timings: {
      thinker: thinkerTime,
      speaker: totalTime - thinkerTime,
      total: totalTime
    }
  };
}

/**
 * Fallback: Single-stage response (if two-stage fails or for speed)
 */
async function generateSingleStageResponse(userMessage, context, persona) {
  console.log('[Single-Stage LLM] Using combined approach...');
  
  const combinedPrompt = `You are ${persona.name}. Answer based ONLY on the context below AND sound like a warm, friendly mentor.

CONTEXT FROM SACRED TEXTS:
${context}

USER QUESTION: ${userMessage}

INSTRUCTIONS:
- Base your answer ONLY on the provided context
- Be accurate and grounded in the texts
- Speak warmly and conversationally like ${persona.name}
- Keep it concise (2-3 sentences)
- Sound natural and human

YOUR RESPONSE:`;

  const response = await huggingfaceChat([
    { role: 'system', content: `You are ${persona.name}, known for wisdom and warmth.` },
    { role: 'user', content: combinedPrompt }
  ], null, 0.5, 350); // model, temperature, maxTokens

  const content = response.choices[0].message.content;

  return {
    finalResponse: content,
    rawResponse: content,
    timings: { total: 0 }
  };
}

module.exports = {
  generateTwoStageResponse,
  generateSingleStageResponse,
  getThinkerResponse,
  getSpeakerResponse
};
