/**
 * Error Handler
 * 
 * Handles errors in the multi-model pipeline with graceful degradation:
 * - Thinker failures → fallback to single-stage
 * - Speaker failures → return Thinker output directly
 * - TTS failures → return text-only response
 * - Implements retry logic with exponential backoff
 * 
 * Requirements: 1.5, 4.3, 4.5, 5.5, 8.2
 */

class ErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000; // 1 second
    this.maxRetryDelay = options.maxRetryDelay || 10000; // 10 seconds
    this.enableFallback = options.enableFallback !== false;
    this.fallbackPipeline = options.fallbackPipeline || null;
    
    console.log('[ErrorHandler] Initialized');
    console.log(`[ErrorHandler] Max retries: ${this.maxRetries}`);
    console.log(`[ErrorHandler] Fallback enabled: ${this.enableFallback}`);
  }

  /**
   * Handle Thinker stage errors
   * Falls back to single-stage processing
   * 
   * @param {Error} error - The error that occurred
   * @param {string} userQuestion - User's question
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Fallback response
   */
  async handleThinkerError(error, userQuestion, context) {
    console.error('[ErrorHandler] Thinker stage failed:', error.message);
    console.log('[ErrorHandler] Attempting fallback to single-stage processing');
    
    try {
      // Try fallback to single-stage
      const fallbackResponse = await this.fallbackToSingleStage(userQuestion, context);
      
      return {
        ...fallbackResponse,
        metadata: {
          ...fallbackResponse.metadata,
          processingMode: 'single-stage-fallback',
          fallbackUsed: true,
          fallbackReason: 'thinker-error',
          originalError: error.message
        }
      };
      
    } catch (fallbackError) {
      console.error('[ErrorHandler] Fallback also failed:', fallbackError.message);
      
      // Return minimal error response
      return this.createErrorResponse(
        userQuestion,
        context,
        `${error.message}; Fallback: ${fallbackError.message}`
      );
    }
  }

  /**
   * Handle Speaker stage errors
   * Returns Thinker output directly without humanization
   * 
   * @param {Error} error - The error that occurred
   * @param {Object} thinkerOutput - Output from Thinker stage
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Thinker output as final response
   */
  async handleSpeakerError(error, thinkerOutput, context) {
    console.error('[ErrorHandler] Speaker stage failed:', error.message);
    console.log('[ErrorHandler] Returning Thinker output directly');
    
    try {
      // Return Thinker's factual response directly
      return {
        text: thinkerOutput.factualResponse,
        audio: null,
        references: thinkerOutput.references,
        metadata: {
          requestId: context.requestId || this.generateRequestId(),
          processingMode: 'thinker-only-fallback',
          timing: {
            thinker: thinkerOutput.metadata.embeddingTime + 
                     thinkerOutput.metadata.searchTime + 
                     thinkerOutput.metadata.analysisTime,
            speaker: 0,
            tts: 0,
            total: thinkerOutput.metadata.embeddingTime + 
                   thinkerOutput.metadata.searchTime + 
                   thinkerOutput.metadata.analysisTime
          },
          models: {
            thinker: 'mistralai/Mistral-7B-Instruct-v0.2',
            speaker: null,
            tts: null
          },
          emotion: { primary: 'neutral', intensity: 0.5, tone: 'factual' },
          confidence: this.calculateConfidence(thinkerOutput),
          fallbackUsed: true,
          fallbackReason: 'speaker-error',
          originalError: error.message,
          originalQuestion: context.userQuestion || context.question,
          deityId: context.deityId,
          language: context.language,
          thinkerOutput: {
            reasoning: thinkerOutput.reasoning,
            topScore: thinkerOutput.metadata.topScore,
            resultsCount: thinkerOutput.metadata.resultsCount
          }
        }
      };
      
    } catch (processingError) {
      console.error('[ErrorHandler] Failed to process Thinker output:', processingError.message);
      
      // Return minimal error response
      return this.createErrorResponse(
        context.userQuestion || context.question,
        context,
        `${error.message}; Processing: ${processingError.message}`
      );
    }
  }

  /**
   * Handle TTS errors
   * Returns text-only response without audio
   * 
   * @param {Error} error - The error that occurred
   * @param {Object} textResponse - Response with text
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Text-only response
   */
  async handleTTSError(error, textResponse, context) {
    console.error('[ErrorHandler] TTS generation failed:', error.message);
    console.log('[ErrorHandler] Returning text-only response');
    
    try {
      // Return response without audio
      return {
        ...textResponse,
        audio: null,
        metadata: {
          ...textResponse.metadata,
          tts: 0,
          models: {
            ...textResponse.metadata.models,
            tts: null
          },
          ttsError: error.message,
          ttsFailure: true
        }
      };
      
    } catch (processingError) {
      console.error('[ErrorHandler] Failed to process text response:', processingError.message);
      
      // Return the original response as-is
      return {
        ...textResponse,
        audio: null
      };
    }
  }

  /**
   * Fallback to single-stage processing using existing pipeline
   * 
   * @param {string} userQuestion - User's question
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Single-stage response
   */
  async fallbackToSingleStage(userQuestion, context) {
    console.log('[ErrorHandler] Executing single-stage fallback');
    
    if (!this.enableFallback) {
      throw new Error('Fallback is disabled');
    }
    
    if (!this.fallbackPipeline) {
      throw new Error('No fallback pipeline configured');
    }
    
    try {
      // Use the fallback pipeline (e.g., smartPipeline)
      const fallbackResponse = await this.fallbackPipeline.process(userQuestion, context);
      
      // Normalize response format
      return {
        text: fallbackResponse.text || fallbackResponse.response || fallbackResponse,
        audio: fallbackResponse.audio || null,
        references: fallbackResponse.references || [],
        metadata: {
          requestId: context.requestId || this.generateRequestId(),
          processingMode: 'single-stage-fallback',
          timing: {
            thinker: 0,
            speaker: 0,
            tts: 0,
            total: fallbackResponse.metadata?.processing_time_ms || 0
          },
          models: {
            thinker: null,
            speaker: null,
            tts: null
          },
          emotion: fallbackResponse.metadata?.emotion || { primary: 'neutral', intensity: 0.5, tone: 'balanced' },
          confidence: fallbackResponse.metadata?.confidence || 0.5,
          fallbackUsed: true,
          originalQuestion: userQuestion,
          deityId: context.deityId,
          language: context.language
        }
      };
      
    } catch (error) {
      console.error('[ErrorHandler] Fallback pipeline failed:', error.message);
      throw error;
    }
  }

  /**
   * Retry a function with exponential backoff
   * 
   * @param {Function} fn - Async function to retry
   * @param {Object} options - Retry options
   * @param {number} [options.maxRetries] - Maximum number of retries
   * @param {number} [options.initialDelay] - Initial delay in ms
   * @param {number} [options.maxDelay] - Maximum delay in ms
   * @param {Function} [options.shouldRetry] - Function to determine if error is retryable
   * @returns {Promise<any>} Result of the function
   */
  async retryWithBackoff(fn, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const initialDelay = options.initialDelay || this.initialRetryDelay;
    const maxDelay = options.maxDelay || this.maxRetryDelay;
    const shouldRetry = options.shouldRetry || this.isRetryableError;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[ErrorHandler] Attempt ${attempt + 1}/${maxRetries + 1}`);
        }
        
        const result = await fn();
        
        if (attempt > 0 && process.env.NODE_ENV !== 'test') {
          console.log(`[ErrorHandler] Succeeded after ${attempt} retries`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        if (process.env.NODE_ENV !== 'test') {
          console.error(`[ErrorHandler] Attempt ${attempt + 1} failed: ${error.message}`);
        }
        
        // Check if we should retry
        if (attempt >= maxRetries || !shouldRetry(error)) {
          if (process.env.NODE_ENV !== 'test') {
            console.log('[ErrorHandler] Not retrying');
          }
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[ErrorHandler] Retrying in ${delay}ms...`);
        }
        
        // In test environment, use minimal delay to speed up tests
        const actualDelay = process.env.NODE_ENV === 'test' ? 1 : delay;
        await this.sleep(actualDelay);
      }
    }
    
    // All retries exhausted
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[ErrorHandler] All ${maxRetries + 1} attempts failed`);
    }
    throw lastError;
  }

  /**
   * Determine if an error is retryable
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    const message = error.message.toLowerCase();
    
    // Retry on network errors, timeouts, rate limits
    const retryablePatterns = [
      'timeout',
      'econnrefused',
      'enotfound',
      'rate limit',
      'too many requests',
      '429',
      '503',
      '504',
      'network',
      'socket'
    ];
    
    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Create a minimal error response
   * 
   * @param {string} userQuestion - User's question
   * @param {Object} context - Context information
   * @param {string} errorMessage - Error message
   * @returns {Object} Error response
   */
  createErrorResponse(userQuestion, context, errorMessage) {
    return {
      text: `I apologize, but I'm experiencing technical difficulties processing your question. Please try again in a moment.`,
      audio: null,
      references: [],
      metadata: {
        requestId: context.requestId || this.generateRequestId(),
        processingMode: 'error',
        timing: {
          thinker: 0,
          speaker: 0,
          tts: 0,
          total: 0
        },
        models: {
          thinker: null,
          speaker: null,
          tts: null
        },
        emotion: { primary: 'neutral', intensity: 0.5, tone: 'balanced' },
        confidence: 0,
        fallbackUsed: true,
        error: errorMessage,
        originalQuestion: userQuestion,
        deityId: context.deityId,
        language: context.language
      }
    };
  }

  /**
   * Calculate confidence score based on Thinker output
   * 
   * @param {Object} thinkerOutput - Thinker output
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(thinkerOutput) {
    if (!thinkerOutput.scriptureQuotes || thinkerOutput.scriptureQuotes.length === 0) {
      return 0.3; // Low confidence if no passages found
    }
    
    const topScore = thinkerOutput.metadata.topScore || 0;
    const resultsCount = thinkerOutput.metadata.resultsCount || 0;
    
    // Confidence based on top score and number of results
    let confidence = topScore * 0.7; // Top score contributes 70%
    
    // Number of results contributes 30%
    if (resultsCount >= 3) {
      confidence += 0.3;
    } else if (resultsCount >= 1) {
      confidence += 0.15;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Sleep for a specified duration
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique request ID
   * 
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

module.exports = ErrorHandler;
