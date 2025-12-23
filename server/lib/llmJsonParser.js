/**
 * LLM JSON Parser Utility
 * 
 * Safely parses JSON from LLM responses, handling:
 * - Special tokens (<s>, </s>, <|...|>)
 * - Markdown code blocks
 * - Extra text before/after JSON
 * - Malformed responses
 */

/**
 * Clean LLM response text
 * @param {string} text - Raw LLM response
 * @returns {string} Cleaned text
 */
function cleanLLMResponse(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text.trim();

  // Remove special tokens from HuggingFace models
  cleaned = cleaned.replace(/<s>/g, '');
  cleaned = cleaned.replace(/<\/s>/g, '');
  cleaned = cleaned.replace(/<\|.*?\|>/g, '');
  cleaned = cleaned.replace(/\[INST\]/g, '');
  cleaned = cleaned.replace(/\[\/INST\]/g, '');
  cleaned = cleaned.replace(/<<SYS>>/g, '');
  cleaned = cleaned.replace(/<\/SYS>>/g, '');

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');

  return cleaned.trim();
}

/**
 * Extract JSON from LLM response
 * @param {string} text - LLM response text
 * @returns {string|null} Extracted JSON string or null
 */
function extractJSON(text) {
  if (!text) return null;

  // Try to find JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Try to find JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return null;
}

/**
 * Parse JSON from LLM response with error handling
 * @param {string} text - Raw LLM response
 * @param {object} fallback - Fallback value if parsing fails
 * @returns {object} Parsed JSON or fallback
 */
function parseLLMJSON(text, fallback = null) {
  try {
    // Step 1: Clean the response
    const cleaned = cleanLLMResponse(text);

    // Step 2: Extract JSON
    const jsonStr = extractJSON(cleaned);
    if (!jsonStr) {
      console.warn('[LLM JSON Parser] No JSON found in response');
      return fallback;
    }

    // Step 3: Parse JSON
    const parsed = JSON.parse(jsonStr);
    return parsed;

  } catch (error) {
    console.warn('[LLM JSON Parser] Failed to parse:', error.message);
    console.warn('[LLM JSON Parser] Raw text:', text?.substring(0, 200));
    return fallback;
  }
}

/**
 * Parse JSON with validation
 * @param {string} text - Raw LLM response
 * @param {function} validator - Validation function (returns true if valid)
 * @param {object} fallback - Fallback value if parsing/validation fails
 * @returns {object} Parsed and validated JSON or fallback
 */
function parseLLMJSONWithValidation(text, validator, fallback = null) {
  const parsed = parseLLMJSON(text, fallback);

  if (parsed && validator(parsed)) {
    return parsed;
  }

  console.warn('[LLM JSON Parser] Validation failed');
  return fallback;
}

/**
 * Parse classification response
 * @param {string} text - Raw LLM response
 * @returns {object} Classification object
 */
function parseClassification(text) {
  const fallback = {
    intent: 'SCRIPTURE_QA',
    needs_rag: true,
    emotion: 'neutral',
    confidence: 'medium',
    reasoning: 'Fallback classification'
  };

  return parseLLMJSONWithValidation(
    text,
    (obj) => obj.intent && obj.hasOwnProperty('needs_rag') && obj.emotion,
    fallback
  );
}

/**
 * Parse reference enhancement response
 * @param {string} text - Raw LLM response
 * @returns {object} Reference enhancement object
 */
function parseReferenceEnhancement(text) {
  const fallback = {
    meaning: 'This sacred text provides wisdom relevant to your question.',
    application: 'Apply this teaching by reflecting on its message in your daily life.',
    summary: 'Ancient wisdom guiding your path forward.'
  };

  return parseLLMJSONWithValidation(
    text,
    (obj) => obj.meaning && obj.application && obj.summary,
    fallback
  );
}

module.exports = {
  cleanLLMResponse,
  extractJSON,
  parseLLMJSON,
  parseLLMJSONWithValidation,
  parseClassification,
  parseReferenceEnhancement
};
