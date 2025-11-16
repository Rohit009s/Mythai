/**
 * Test suite for citation extraction and validation
 */

// Helper: extract citations from reply text using regex
function extractCitations(text) {
  const regex = /\(Source:\s*([^,)]+),?\s*([^)]*)\)/g;
  const citations = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    citations.push({
      source: match[1].trim(),
      details: match[2].trim()
    });
  }
  return citations;
}

// Helper: validate that citations match referencedSources
function validateCitations(replyText, referencedSources) {
  const citations = extractCitations(replyText);
  if (citations.length === 0 && referencedSources.length > 0) {
    return { valid: false, reason: 'No citations found in reply text but sources were retrieved' };
  }
  for (const cite of citations) {
    const found = referencedSources.some(src => src.source_title.includes(cite.source));
    if (!found) {
      return { valid: false, reason: `Citation source '${cite.source}' not in referencedSources` };
    }
  }
  return { valid: true, citationCount: citations.length };
}

describe('Chat - Citation Validation', () => {
  test('should extract citations from reply', () => {
    const reply = 'The Gita teaches duty. (Source: Bhagavad Gita, 2.47) Always act righteously.';
    const citations = extractCitations(reply);
    expect(citations).toHaveLength(1);
    expect(citations[0].source).toBe('Bhagavad Gita');
    expect(citations[0].details).toContain('2.47');
  });

  test('should extract multiple citations', () => {
    const reply = 'First point (Source: Text A, 1.1) and second (Source: Text B, 2.2).';
    const citations = extractCitations(reply);
    expect(citations).toHaveLength(2);
  });

  test('should validate citations against sources', () => {
    const replyText = 'The story is found in Mahabharata. (Source: Mahabharata, chapter 10)';
    const sources = [
      { source_title: 'Mahabharata', snippet_id: 'mh-1' }
    ];
    const validation = validateCitations(replyText, sources);
    expect(validation.valid).toBe(true);
  });

  test('should fail if citation source missing from referenced sources', () => {
    const replyText = 'As per Gita. (Source: Bhagavad Gita, 2.47)';
    const sources = [
      { source_title: 'Mahabharata', snippet_id: 'mh-1' }
    ];
    const validation = validateCitations(replyText, sources);
    expect(validation.valid).toBe(false);
  });

  test('should warn if no citations but sources retrieved', () => {
    const replyText = 'Just a plain reply with no citations.';
    const sources = [
      { source_title: 'Bhagavad Gita', snippet_id: 'bg-1' }
    ];
    const validation = validateCitations(replyText, sources);
    expect(validation.valid).toBe(false);
  });
});
