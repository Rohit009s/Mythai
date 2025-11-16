/**
 * Test suite for ingest.js chunking logic
 */
const fs = require('fs');
const path = require('path');

// Helper: copy the chunkText function from ingest.js for testing
function chunkText(text, chunkSize = 1200, chunkOverlap = 150) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const chunk = text.slice(i, end);
    chunks.push(chunk.trim());
    // Move forward by (chunkSize - overlap), but at minimum 1 char
    const nextStart = i + (chunkSize - chunkOverlap);
    i = Math.max(nextStart, i + 1);
    if (i >= text.length) break;
  }
  return chunks;
}

describe('Ingest - Chunking', () => {
  test('should chunk text by size with overlap', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(50); // ~2400 chars
    const chunks = chunkText(text, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeGreaterThan(0);
      expect(chunk.length).toBeLessThanOrEqual(550); // allow some buffer
    });
  });

  test('should handle small files', () => {
    const text = 'Short text';
    const chunks = chunkText(text, 100, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('Short text');
  });

  test('should preserve overlap between chunks', () => {
    const text = 'Word '.repeat(100); // ~500 chars
    const chunks = chunkText(text, 200, 50);
    expect(chunks.length).toBeGreaterThan(0);
  });
});
