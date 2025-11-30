/**
 * Reference Formatter
 * Formats sacred text references with exact quotes, meaning, and application
 */

/**
 * Format retrieved texts into structured references
 */
function formatReferences(retrievedTexts, userQuestion, intent) {
  if (!retrievedTexts || retrievedTexts.length === 0) {
    return null;
  }

  // Take the most relevant reference
  const primary = retrievedTexts[0];
  
  return {
    sacredText: {
      quote: extractQuote(primary.text),
      source: parseSource(primary.source, primary.text)
    },
    meaning: null, // Will be filled by LLM
    application: null, // Will be filled by LLM
    summary: null // Will be filled by LLM
  };
}

/**
 * Extract a clean quote from the text (first 200 chars or first complete sentence)
 */
function extractQuote(text) {
  if (!text) return '';
  
  // Try to get first complete sentence
  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd > 0 && sentenceEnd < 300) {
    return text.substring(0, sentenceEnd + 1).trim();
  }
  
  // Otherwise take first 200 chars
  if (text.length > 200) {
    return text.substring(0, 200).trim() + '...';
  }
  
  return text.trim();
}

/**
 * Parse source information to extract book, chapter, verse
 */
function parseSource(sourceTitle, text) {
  const source = {
    book: sourceTitle || 'Sacred Text',
    chapter: null,
    verse: null,
    fullReference: sourceTitle || 'Sacred Text'
  };

  // Try to extract chapter and verse from source title
  // Patterns: "Bhagavad Gita 4:39", "Chapter 4, Verse 39", "4.39"
  const patterns = [
    /Chapter\s+(\d+),?\s+Verse\s+(\d+)/i,
    /(\d+):(\d+)/,
    /(\d+)\.(\d+)/
  ];

  for (const pattern of patterns) {
    const match = sourceTitle?.match(pattern);
    if (match) {
      source.chapter = match[1];
      source.verse = match[2];
      break;
    }
  }

  // Also try to extract from text itself
  if (!source.chapter) {
    const textMatch = text?.match(/Chapter\s+(\d+),?\s+Verse\s+(\d+)/i);
    if (textMatch) {
      source.chapter = textMatch[1];
      source.verse = textMatch[2];
    }
  }

  // Build full reference
  if (source.chapter && source.verse) {
    source.fullReference = `${source.book}, Chapter ${source.chapter}, Verse ${source.verse}`;
  }

  return source;
}

/**
 * Create enhanced prompt for LLM to generate meaning, application, and summary
 */
function createReferencePrompt(quote, source, userQuestion, mainResponse) {
  return `You are explaining a sacred text reference. Provide three things:

SACRED TEXT:
"${quote}"
- Source: ${source.fullReference}

USER QUESTION: ${userQuestion}

YOUR MAIN RESPONSE: ${mainResponse}

Now provide:

1. MEANING: Explain what this sacred text means in simple, clear language (2-3 sentences)

2. APPLICATION: Explain how this specifically applies to the user's question about "${userQuestion}" (2-3 sentences)

3. SUMMARY: A brief one-sentence summary connecting the reference to the conversation

Format your response as JSON:
{
  "meaning": "...",
  "application": "...",
  "summary": "..."
}`;
}

/**
 * Parse LLM response to extract meaning, application, summary
 */
async function enhanceReferenceWithLLM(reference, userQuestion, mainResponse, chatCompletion) {
  if (!reference || !reference.sacredText) {
    return reference;
  }

  try {
    const prompt = createReferencePrompt(
      reference.sacredText.quote,
      reference.sacredText.source,
      userQuestion,
      mainResponse
    );

    const response = await chatCompletion([
      { role: 'system', content: 'You are a helpful assistant that explains sacred texts. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], null, 0.7, 300);

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    reference.meaning = parsed.meaning || null;
    reference.application = parsed.application || null;
    reference.summary = parsed.summary || null;
    
    console.log('[Reference] Enhanced with meaning, application, and summary');
  } catch (error) {
    console.warn('[Reference] Failed to enhance with LLM:', error.message);
    // Provide fallback values
    reference.meaning = 'This sacred text provides wisdom relevant to your question.';
    reference.application = 'Apply this teaching by reflecting on its message in your daily life.';
    reference.summary = 'Ancient wisdom guiding your path forward.';
  }

  return reference;
}

module.exports = {
  formatReferences,
  enhanceReferenceWithLLM,
  extractQuote,
  parseSource
};
