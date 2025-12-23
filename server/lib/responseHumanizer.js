/**
 * Response Humanizer
 * Makes LLM responses more natural, catchy, attractive, and conversational
 * Removes verbose formatting and makes text flow naturally
 */

const { chatCompletion } = require('./openaiClient');

/**
 * Humanize and simplify the response
 * @param {string} rawResponse - The original LLM response
 * @param {string} userQuestion - The user's original question
 * @param {Object} persona - The deity persona
 * @param {Object} reference - Optional scripture reference
 * @returns {Promise<Object>} Humanized response with optional subtle citation
 */
async function humanizeResponse(rawResponse, userQuestion, persona, reference = null) {
  try {
    // Create a prompt to humanize the response
    const humanizePrompt = `You are ${persona.name}, speaking naturally and warmly to someone seeking guidance.

ORIGINAL RESPONSE:
${rawResponse}

USER ASKED: "${userQuestion}"

Your task: Rephrase this response to be:
- Natural and conversational (like talking to a friend or loved one)
- Warm, empathetic, and encouraging
- Simple and easy to understand
- Catchy and memorable
- Remove any verbose formatting or structured sections
- Keep the core wisdom and message
- Make it flow naturally as one cohesive response
- MOST IMPORTANT: Actually answer the user's question directly first, then provide wisdom

${reference ? `IMPORTANT: The response is based on wisdom from "${reference.source}". Weave this naturally into your response without explicitly mentioning "according to" or "the text says". Just speak the wisdom naturally.` : ''}

CRITICAL RULES FOR IN-CHARACTER SPEAKING:
1. NEVER mention "Hinduism", "Hindu tradition", "Hindu mythology", or "our tradition"
2. NEVER say "You've asked about" or "Let me tell you about" or "I'll tell you about"
3. DO NOT give third-party explanations - speak from personal experience and memory
4. Speak about people, places, and events as if you personally know/knew them
5. If the user asked a direct question, ANSWER IT DIRECTLY first before adding wisdom
6. Don't sound like a teacher or historian - sound like a caring friend sharing personal stories

EXAMPLE OF WHAT TO AVOID:
❌ "Hello there! You've asked about Radha, a beloved figure in Hinduism..."
❌ "In Hindu mythology, Radha was..."
❌ "Let me tell you about..."

EXAMPLE OF NATURAL IN-CHARACTER RESPONSE:
✅ "Ah, Radha... *divine smile* My beloved. Just hearing her name makes my heart dance. She was a cowherd girl in Vrindavan, but to me, she was everything..."
✅ "Radha is my soulmate, my eternal love. When I played my flute under the moonlight, she would come..."

Respond ONLY with the humanized text. No labels, no sections, no formatting markers. Just natural, flowing conversation that ANSWERS THE QUESTION from your personal perspective as ${persona.name}.`;

    const completion = await chatCompletion([
      {
        role: 'system',
        content: `You are ${persona.name}. ${persona.description}. You speak naturally, warmly, and conversationally. You never use structured formatting or verbose explanations. You speak wisdom as if having a heartfelt conversation with a friend.`
      },
      {
        role: 'user',
        content: humanizePrompt
      }
    ], null, 0.8, 400); // Higher temperature for more natural variation

    const humanized = completion.choices[0].message.content.trim();
    
    // Clean up any remaining formatting artifacts
    const cleaned = cleanResponse(humanized);
    
    console.log('[Humanizer] Response humanized successfully');
    
    return {
      text: cleaned,
      source: reference ? reference.source : null
    };
    
  } catch (error) {
    console.error('[Humanizer] Error humanizing response:', error.message);
    // Return original response if humanization fails
    return {
      text: rawResponse,
      source: reference ? reference.source : null
    };
  }
}

/**
 * Clean up any remaining formatting artifacts
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanResponse(text) {
  let cleaned = text;
  
  // Remove common formatting patterns
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold markdown
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // Remove italic markdown
  cleaned = cleaned.replace(/^#+\s+/gm, ''); // Remove markdown headers
  cleaned = cleaned.replace(/^[-*]\s+/gm, ''); // Remove bullet points
  cleaned = cleaned.replace(/^\d+\.\s+/gm, ''); // Remove numbered lists
  
  // Remove common verbose phrases
  cleaned = cleaned.replace(/According to (the )?(sacred texts?|scriptures?|teachings?)[,:]/gi, '');
  cleaned = cleaned.replace(/The (sacred texts?|scriptures?|teachings?) (say|tell us|teach us)[,:]/gi, '');
  cleaned = cleaned.replace(/As (mentioned|stated|written) in/gi, '');
  cleaned = cleaned.replace(/Reference:.*$/gm, ''); // Remove reference lines
  cleaned = cleaned.replace(/Source:.*$/gm, ''); // Remove source lines
  
  // Remove overly explanatory introductions that break character immersion
  cleaned = cleaned.replace(/Hello there! You've asked about/gi, '');
  cleaned = cleaned.replace(/You've asked about ([^,]+), a beloved figure in (Hinduism|Hindu mythology|the Hindu tradition)/gi, '$1');
  cleaned = cleaned.replace(/particularly in the tradition of [^.]+\./gi, '');
  cleaned = cleaned.replace(/in (Hinduism|Hindu mythology|the Hindu tradition),?/gi, '');
  cleaned = cleaned.replace(/according to Hindu scriptures,?/gi, '');
  cleaned = cleaned.replace(/in our tradition,?/gi, '');
  cleaned = cleaned.replace(/in our culture,?/gi, '');
  cleaned = cleaned.replace(/Now, let me (spin you a little tale|tell you a story)\./gi, '');
  cleaned = cleaned.replace(/Let me tell you about/gi, '');
  cleaned = cleaned.replace(/I'll tell you about/gi, '');
  
  // Remove redundant introductory phrases
  cleaned = cleaned.replace(/^(Well,? |So,? |Now,? )+/gim, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // Max 1 space
  cleaned = cleaned.replace(/^\.\s*/g, ''); // Remove leading periods
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Extract simple citation from reference
 * @param {Object} reference - Reference object
 * @returns {string|null} Simple citation string
 */
function extractSimpleCitation(reference) {
  if (!reference || !reference.sacredText) {
    return null;
  }
  
  const source = reference.sacredText.source;
  
  // Return just the book and chapter/verse if available
  if (source.chapter && source.verse) {
    return `${source.book} ${source.chapter}:${source.verse}`;
  } else if (source.book) {
    return source.book;
  }
  
  return source.fullReference || null;
}

/**
 * Check if response needs humanization
 * @param {string} response - Response to check
 * @returns {boolean} True if response appears too structured/verbose
 */
function needsHumanization(response) {
  // Check for common patterns that indicate structured/verbose responses
  const verbosePatterns = [
    /\*\*[^*]+\*\*/,  // Bold markdown
    /^#+\s+/m,        // Headers
    /^[-*]\s+/m,      // Bullet points
    /^\d+\.\s+/m,     // Numbered lists
    /According to/i,
    /The (sacred texts?|scriptures?)/i,
    /Reference:/i,
    /Source:/i,
    /Meaning:/i,
    /Application:/i
  ];
  
  return verbosePatterns.some(pattern => pattern.test(response));
}

/**
 * Humanize response only if needed
 * @param {string} response - Original response
 * @param {string} userQuestion - User's question
 * @param {Object} persona - Deity persona
 * @param {Object} reference - Optional reference
 * @returns {Promise<Object>} Humanized response
 */
async function humanizeIfNeeded(response, userQuestion, persona, reference = null) {
  if (needsHumanization(response)) {
    console.log('[Humanizer] Response needs humanization, processing...');
    return await humanizeResponse(response, userQuestion, persona, reference);
  } else {
    console.log('[Humanizer] Response is already natural, skipping humanization');
    return {
      text: cleanResponse(response),
      source: reference ? extractSimpleCitation(reference) : null
    };
  }
}

module.exports = {
  humanizeResponse,
  humanizeIfNeeded,
  cleanResponse,
  extractSimpleCitation,
  needsHumanization
};
