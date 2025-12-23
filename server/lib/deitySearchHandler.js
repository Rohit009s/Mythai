/**
 * Deity-Specific Search Handler
 * 
 * Implements STRICT PRIMARY-FIRST approach:
 * 1. Search PRIMARY books ONLY
 * 2. If found (score > threshold) → Use results
 * 3. If NOT found → Generate own text (no RAG)
 */

const qdrantClient = require('./qdrantEnhanced');
const hfClient = require('./huggingfaceEnhanced');
const { getDeityBooks, buildDeityFilter } = require('../config/deityBooksMapping');

const MINIMUM_SCORE_THRESHOLD = 0.65; // Minimum relevance score to use results

class DeitySearchHandler {
  /**
   * Search with strict primary-first approach
   * @param {string} query - User query
   * @param {string} deityName - Deity name
   * @param {number} topK - Number of results
   * @returns {object} Search results with metadata
   */
  async searchPrimaryFirst(query, deityName, topK = 5) {
    const books = getDeityBooks(deityName);
    
    console.log(`[DeitySearch] Searching for ${deityName}`);
    console.log(`[DeitySearch] Primary books: ${books.primary.join(', ')}`);
    
    // Step 1: Generate embedding
    const embeddings = await hfClient.generateEmbeddings([query]);
    const embedding = embeddings[0];
    
    // Step 2: Search PRIMARY books ONLY
    const primaryFilter = buildDeityFilter(deityName, true); // Primary only
    
    const primaryResults = await qdrantClient.searchByVector(embedding, {
      top_k: topK,
      ...this.filterToOptions(primaryFilter),
      useCache: true
    });
    
    console.log(`[DeitySearch] Found ${primaryResults.length} results from primary books`);
    
    // Step 3: Check if results are relevant
    const relevantResults = primaryResults.filter(r => r.score >= MINIMUM_SCORE_THRESHOLD);
    
    if (relevantResults.length > 0) {
      console.log(`[DeitySearch] ✅ Found ${relevantResults.length} relevant results (score >= ${MINIMUM_SCORE_THRESHOLD})`);
      console.log(`[DeitySearch] Top result: ${relevantResults[0].book} (score: ${relevantResults[0].score.toFixed(3)})`);
      
      return {
        found: true,
        source: 'primary_books',
        results: relevantResults,
        books_searched: books.primary,
        should_use_rag: true,
        message: `Found in ${relevantResults[0].book}`
      };
    }
    
    // Step 4: No relevant results found in primary books
    console.log(`[DeitySearch] ❌ No relevant results in primary books (highest score: ${primaryResults[0]?.score.toFixed(3) || 'N/A'})`);
    console.log(`[DeitySearch] Will generate own text without RAG`);
    
    return {
      found: false,
      source: 'none',
      results: [],
      books_searched: books.primary,
      should_use_rag: false,
      message: `No relevant information found in ${books.primary.join(', ')}. Will generate response based on general knowledge.`
    };
  }
  
  /**
   * Search with fallback to secondary (optional mode)
   * @param {string} query - User query
   * @param {string} deityName - Deity name
   * @param {number} topK - Number of results
   * @returns {object} Search results with metadata
   */
  async searchWithSecondaryFallback(query, deityName, topK = 5) {
    const books = getDeityBooks(deityName);
    
    // Step 1: Try primary first
    const primarySearch = await this.searchPrimaryFirst(query, deityName, topK);
    
    if (primarySearch.found) {
      return primarySearch;
    }
    
    // Step 2: No results in primary, try secondary
    console.log(`[DeitySearch] Trying secondary books: ${books.secondary.join(', ')}`);
    
    const embeddings = await hfClient.generateEmbeddings([query]);
    const embedding = embeddings[0];
    
    const secondaryFilter = this.buildSecondaryFilter(deityName);
    
    const secondaryResults = await qdrantClient.searchByVector(embedding, {
      top_k: topK,
      ...this.filterToOptions(secondaryFilter),
      useCache: true
    });
    
    const relevantResults = secondaryResults.filter(r => r.score >= MINIMUM_SCORE_THRESHOLD);
    
    if (relevantResults.length > 0) {
      console.log(`[DeitySearch] ✅ Found ${relevantResults.length} results in secondary books`);
      
      return {
        found: true,
        source: 'secondary_books',
        results: relevantResults,
        books_searched: books.secondary,
        should_use_rag: true,
        message: `Found in ${relevantResults[0].book} (secondary source)`
      };
    }
    
    // Step 3: Nothing found anywhere
    console.log(`[DeitySearch] ❌ No relevant results in primary or secondary books`);
    
    return {
      found: false,
      source: 'none',
      results: [],
      books_searched: [...books.primary, ...books.secondary],
      should_use_rag: false,
      message: 'No relevant information found in sacred texts. Will generate response based on general knowledge.'
    };
  }
  
  /**
   * Build filter for secondary books only
   */
  buildSecondaryFilter(deityName) {
    const books = getDeityBooks(deityName);
    
    if (books.secondary.length === 0) {
      return null;
    }
    
    return {
      should: books.secondary.map(book => ({
        key: 'book',
        match: { value: book }
      }))
    };
  }
  
  /**
   * Convert filter object to Qdrant options
   */
  filterToOptions(filter) {
    if (!filter) return {};
    
    // Extract book names from filter
    if (filter.should) {
      const books = filter.should.map(f => f.match.value);
      return { books };
    }
    
    return {};
  }
  
  /**
   * Generate response when no books found
   * @param {string} query - User query
   * @param {string} deityName - Deity name
   * @param {object} searchResult - Search result metadata
   * @returns {string} Generated response
   */
  async generateWithoutRAG(query, deityName, searchResult) {
    const books = getDeityBooks(deityName);
    
    const prompt = `You are ${deityName}, a divine guide speaking in first person.

The user asks: "${query}"

Important: This question was not found in your primary sacred texts (${books.primary.join(', ')}). 
You should:
1. Acknowledge that this specific question is not directly addressed in your primary texts
2. Provide a thoughtful response based on your general wisdom and character
3. Be honest that you're speaking from general wisdom, not specific scripture
4. Keep response under 200 words

Respond as ${deityName} would, with wisdom and compassion:`;

    const response = await hfClient.generateWithLlama([
      { role: 'system', content: `You are ${deityName}, speaking with wisdom and honesty.` },
      { role: 'user', content: prompt }
    ], 0.7, 300);
    
    return response;
  }
}

// Singleton instance
const deitySearchHandler = new DeitySearchHandler();

module.exports = deitySearchHandler;
