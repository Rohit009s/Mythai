/**
 * Reference Formatter
 * Formats sacred text references with exact quotes, meaning, and application
 * Enhanced with additional utility functions for the multi-model pipeline
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
    const { parseReferenceEnhancement } = require('./llmJsonParser');
    
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

    const content = response.choices[0].message.content;
    
    // Use utility to parse JSON safely
    const parsed = parseReferenceEnhancement(content);
    
    reference.meaning = parsed.meaning;
    reference.application = parsed.application;
    reference.summary = parsed.summary;
    
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

/**
 * Standardize reference format across the system
 * @param {Object} reference - Raw reference object
 * @returns {Object} Standardized reference
 */
function standardizeReference(reference) {
  if (!reference) return null;

  return {
    book: reference.book || reference.source || 'Unknown',
    chapter: reference.chapter || null,
    verse: reference.verse || null,
    text: reference.text || reference.quote || '',
    source: reference.source || reference.fullReference || '',
    score: reference.score || 0,
    language: reference.language || 'en',
    url: reference.url || null
  };
}

/**
 * Format multiple references into a consistent structure
 * @param {Array} references - Array of reference objects
 * @returns {Array} Array of standardized references
 */
function formatReferenceList(references) {
  if (!Array.isArray(references)) return [];

  return references
    .map(ref => standardizeReference(ref))
    .filter(ref => ref && ref.text)
    .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by relevance score
}

/**
 * Create citation string from reference
 * @param {Object} reference - Reference object
 * @param {string} style - Citation style ('full', 'short', 'inline')
 * @returns {string} Formatted citation
 */
function createCitation(reference, style = 'full') {
  if (!reference) return '';

  const { book, chapter, verse, source } = reference;

  switch (style) {
    case 'short':
      if (chapter && verse) {
        return `${book} ${chapter}:${verse}`;
      }
      return book;

    case 'inline':
      if (chapter && verse) {
        return `(${book} ${chapter}:${verse})`;
      }
      return `(${book})`;

    case 'full':
    default:
      if (chapter && verse) {
        return `${book}, Chapter ${chapter}, Verse ${verse}`;
      }
      if (source) {
        return source;
      }
      return book;
  }
}

/**
 * Extract all references from text
 * @param {string} text - Text containing references
 * @returns {Array} Array of extracted references
 */
function extractReferencesFromText(text) {
  if (!text) return [];

  const references = [];
  
  // Reference patterns
  const patterns = [
    // Book Chapter:Verse
    {
      pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+):(\d+(?:-\d+)?)\b/g,
      format: (match) => ({
        book: match[1],
        chapter: match[2],
        verse: match[3],
        text: match[0]
      })
    },
    // Book Chapter.Verse
    {
      pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+)\.(\d+(?:-\d+)?)\b/g,
      format: (match) => ({
        book: match[1],
        chapter: match[2],
        verse: match[3],
        text: match[0]
      })
    },
    // Chapter X, Verse Y
    {
      pattern: /Chapter\s+(\d+),?\s+Verse\s+(\d+(?:-\d+)?)/gi,
      format: (match) => ({
        book: 'Sacred Text',
        chapter: match[1],
        verse: match[2],
        text: match[0]
      })
    }
  ];

  for (const { pattern, format } of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      references.push(standardizeReference(format(match)));
    }
  }

  return references;
}

/**
 * Validate reference format
 * @param {Object} reference - Reference to validate
 * @returns {Object} Validation result
 */
function validateReference(reference) {
  const errors = [];
  const warnings = [];

  if (!reference) {
    errors.push('Reference is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (!reference.book) {
    errors.push('Missing book name');
  }

  if (!reference.text) {
    warnings.push('Missing reference text');
  }

  if (reference.chapter && isNaN(parseInt(reference.chapter))) {
    errors.push('Chapter must be a number');
  }

  if (reference.verse && isNaN(parseInt(reference.verse))) {
    errors.push('Verse must be a number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Merge duplicate references
 * @param {Array} references - Array of references
 * @returns {Array} Array with duplicates merged
 */
function mergeDuplicateReferences(references) {
  if (!Array.isArray(references)) return [];

  const merged = new Map();

  for (const ref of references) {
    const key = `${ref.book}-${ref.chapter}-${ref.verse}`;
    
    if (merged.has(key)) {
      const existing = merged.get(key);
      // Keep the one with higher score or longer text
      if ((ref.score || 0) > (existing.score || 0) || 
          (ref.text || '').length > (existing.text || '').length) {
        merged.set(key, ref);
      }
    } else {
      merged.set(key, ref);
    }
  }

  return Array.from(merged.values());
}

/**
 * Format references for display in UI
 * @param {Array} references - Array of references
 * @param {Object} options - Display options
 * @returns {Array} Formatted references for UI
 */
function formatForDisplay(references, options = {}) {
  const {
    maxLength = 200,
    includeScore = false,
    citationStyle = 'full'
  } = options;

  return references.map(ref => {
    let displayText = ref.text;
    
    // Truncate if too long
    if (displayText.length > maxLength) {
      displayText = displayText.substring(0, maxLength).trim() + '...';
    }

    const formatted = {
      citation: createCitation(ref, citationStyle),
      text: displayText,
      book: ref.book,
      chapter: ref.chapter,
      verse: ref.verse
    };

    if (includeScore && ref.score !== undefined) {
      formatted.relevanceScore = Math.round(ref.score * 100) / 100;
    }

    return formatted;
  });
}

module.exports = {
  formatReferences,
  enhanceReferenceWithLLM,
  extractQuote,
  parseSource,
  // New utility functions
  standardizeReference,
  formatReferenceList,
  createCitation,
  extractReferencesFromText,
  validateReference,
  mergeDuplicateReferences,
  formatForDisplay
};
