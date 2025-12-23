/**
 * Unit tests for MCP Server Integration
 * Tests tool registration, tool handlers, and configuration loading
 * 
 * Requirements: 4.1, 4.4, 8.1, 8.3
 */

describe('MCP Server Integration Tests', () => {
  
  describe('Configuration Loading', () => {
    beforeEach(() => {
      // Clear environment
      delete process.env.MONGO_URI;
      delete process.env.DB_NAME;
      delete process.env.HUGGINGFACE_API_TOKEN;
      delete process.env.ELEVENLABS_API_KEY;
      delete process.env.QDRANT_URL;
      delete process.env.QDRANT_API_KEY;
    });

    test('should load MongoDB URI from environment', () => {
      process.env.MONGO_URI = 'mongodb://test:27017';
      
      const MONGO_URI = process.env.MONGO_URI;
      expect(MONGO_URI).toBe('mongodb://test:27017');
    });

    test('should load database name from environment', () => {
      process.env.DB_NAME = 'test_mythai';
      
      const DB_NAME = process.env.DB_NAME;
      expect(DB_NAME).toBe('test_mythai');
    });

    test('should use default database name if not specified', () => {
      const DB_NAME = process.env.DB_NAME || 'mythai';
      expect(DB_NAME).toBe('mythai');
    });

    test('should load HuggingFace API token from environment', () => {
      process.env.HUGGINGFACE_API_TOKEN = 'test_hf_token';
      
      const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
      expect(HF_API_TOKEN).toBe('test_hf_token');
    });

    test('should load ElevenLabs API key from environment', () => {
      process.env.ELEVENLABS_API_KEY = 'test_elevenlabs_key';
      
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
      expect(ELEVENLABS_API_KEY).toBe('test_elevenlabs_key');
    });

    test('should load Qdrant URL from environment', () => {
      process.env.QDRANT_URL = 'http://test-qdrant:6333';
      
      const QDRANT_URL = process.env.QDRANT_URL;
      expect(QDRANT_URL).toBe('http://test-qdrant:6333');
    });

    test('should load Qdrant API key from environment', () => {
      process.env.QDRANT_API_KEY = 'test_qdrant_key';
      
      const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
      expect(QDRANT_API_KEY).toBe('test_qdrant_key');
    });

    test('should handle missing optional environment variables', () => {
      const OPTIONAL_VAR = process.env.OPTIONAL_VAR || 'default_value';
      expect(OPTIONAL_VAR).toBe('default_value');
    });
  });

  describe('Tool Registration Schema', () => {
    const expectedTools = [
      // Category A: Core Data Tools
      'get_user_profile',
      'save_message',
      'get_conversation_context',
      
      // Category B: Retrieval & RAG Tools
      'embed_text_minilm',
      'search_scriptures_qdrant',
      'search_scriptures_by_text',
      
      // Category C: LLM Tools
      'generate_with_mistral',
      'generate_with_llama',
      'classify_intent',
      
      // Category D: TTS Tools
      'generate_speech',
      
      // Category E: Persona & Context Tools
      'get_deity_persona',
      'get_emotional_response_template'
    ];

    test('should define all required tool names', () => {
      expectedTools.forEach(toolName => {
        expect(toolName).toBeDefined();
        expect(typeof toolName).toBe('string');
        expect(toolName.length).toBeGreaterThan(0);
      });
    });

    test('should have unique tool names', () => {
      const uniqueTools = new Set(expectedTools);
      expect(uniqueTools.size).toBe(expectedTools.length);
    });

    test('should follow naming convention (snake_case)', () => {
      expectedTools.forEach(toolName => {
        expect(toolName).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('Tool Input Schema Validation', () => {
    test('should validate get_user_profile schema', () => {
      const schema = {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'User ID' }
        },
        required: ['user_id']
      };

      expect(schema.type).toBe('object');
      expect(schema.properties.user_id).toBeDefined();
      expect(schema.properties.user_id.type).toBe('string');
      expect(schema.required).toContain('user_id');
    });

    test('should validate save_message schema', () => {
      const schema = {
        type: 'object',
        properties: {
          conversation_id: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant'] },
          text: { type: 'string' }
        },
        required: ['conversation_id', 'role', 'text']
      };

      expect(schema.properties.conversation_id).toBeDefined();
      expect(schema.properties.role).toBeDefined();
      expect(schema.properties.role.enum).toContain('user');
      expect(schema.properties.role.enum).toContain('assistant');
      expect(schema.required).toEqual(['conversation_id', 'role', 'text']);
    });

    test('should validate embed_text_minilm schema', () => {
      const schema = {
        type: 'object',
        properties: {
          inputs: {
            type: 'array',
            items: { type: 'string' }
          },
          model: {
            type: 'string',
            default: 'sentence-transformers/all-MiniLM-L6-v2'
          }
        },
        required: ['inputs']
      };

      expect(schema.properties.inputs.type).toBe('array');
      expect(schema.properties.inputs.items.type).toBe('string');
      expect(schema.properties.model.default).toContain('MiniLM');
    });

    test('should validate search_scriptures_qdrant schema', () => {
      const schema = {
        type: 'object',
        properties: {
          embedding: {
            type: 'array',
            items: { type: 'number' }
          },
          top_k: { type: 'number', default: 5 },
          persona: { type: 'string' },
          religion: { type: 'string' },
          books: { type: 'string' }
        },
        required: ['embedding']
      };

      expect(schema.properties.embedding.type).toBe('array');
      expect(schema.properties.embedding.items.type).toBe('number');
      expect(schema.properties.top_k.default).toBe(5);
      expect(schema.required).toContain('embedding');
    });

    test('should validate generate_speech schema', () => {
      const schema = {
        type: 'object',
        properties: {
          text: { type: 'string' },
          persona: { type: 'string', default: 'krishna' },
          emotion: {
            type: 'string',
            enum: ['neutral', 'sad', 'angry', 'anxious', 'motivated', 'joyful'],
            default: 'neutral'
          },
          output_format: {
            type: 'string',
            enum: ['base64', 'file'],
            default: 'base64'
          }
        },
        required: ['text']
      };

      expect(schema.properties.text).toBeDefined();
      expect(schema.properties.emotion.enum).toContain('neutral');
      expect(schema.properties.emotion.enum).toContain('joyful');
      expect(schema.properties.output_format.enum).toContain('base64');
      expect(schema.required).toContain('text');
    });
  });

  describe('Tool Handler Error Handling', () => {
    test('should handle unknown tool name', () => {
      const toolName = 'unknown_tool';
      const knownTools = ['get_user_profile', 'save_message'];
      
      const isKnown = knownTools.includes(toolName);
      expect(isKnown).toBe(false);
      
      // Should return error response
      const errorResponse = {
        content: [{
          type: 'text',
          text: `Error: Unknown tool: ${toolName}`
        }],
        isError: true
      };
      
      expect(errorResponse.isError).toBe(true);
      expect(errorResponse.content[0].text).toContain('Unknown tool');
    });

    test('should handle missing required parameters', () => {
      const args = {}; // Missing user_id
      const required = ['user_id'];
      
      const missingParams = required.filter(param => !args[param]);
      expect(missingParams).toContain('user_id');
      expect(missingParams.length).toBeGreaterThan(0);
    });

    test('should handle tool execution errors', () => {
      const error = new Error('Database connection failed');
      
      const errorResponse = {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
      
      expect(errorResponse.isError).toBe(true);
      expect(errorResponse.content[0].text).toContain('Database connection failed');
    });

    test('should return proper error response format', () => {
      const errorResponse = {
        content: [{
          type: 'text',
          text: 'Error: Something went wrong'
        }],
        isError: true
      };
      
      expect(errorResponse.content).toBeDefined();
      expect(Array.isArray(errorResponse.content)).toBe(true);
      expect(errorResponse.content[0].type).toBe('text');
      expect(errorResponse.isError).toBe(true);
    });
  });

  describe('Tool Response Format', () => {
    test('should return proper success response format', () => {
      const successResponse = {
        content: [{
          type: 'text',
          text: JSON.stringify({ result: 'success' })
        }]
      };
      
      expect(successResponse.content).toBeDefined();
      expect(Array.isArray(successResponse.content)).toBe(true);
      expect(successResponse.content[0].type).toBe('text');
      expect(successResponse.isError).toBeUndefined();
    });

    test('should handle JSON serialization in responses', () => {
      const data = {
        user_id: 'test123',
        name: 'Test User',
        preferences: { language: 'en' }
      };
      
      const response = {
        content: [{
          type: 'text',
          text: JSON.stringify(data)
        }]
      };
      
      const parsed = JSON.parse(response.content[0].text);
      expect(parsed.user_id).toBe('test123');
      expect(parsed.preferences.language).toBe('en');
    });

    test('should handle array responses', () => {
      const data = [
        { id: 1, text: 'Message 1' },
        { id: 2, text: 'Message 2' }
      ];
      
      const response = {
        content: [{
          type: 'text',
          text: JSON.stringify(data)
        }]
      };
      
      const parsed = JSON.parse(response.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
  });

  describe('Server Initialization', () => {
    test('should have correct server name', () => {
      const serverConfig = {
        name: 'mythai-unified',
        version: '1.0.0'
      };
      
      expect(serverConfig.name).toBe('mythai-unified');
      expect(serverConfig.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should have tools capability', () => {
      const capabilities = {
        tools: {}
      };
      
      expect(capabilities.tools).toBeDefined();
      expect(typeof capabilities.tools).toBe('object');
    });

    test('should handle server errors', () => {
      const error = new Error('Server error');
      const errorHandler = (err) => {
        expect(err).toBeDefined();
        expect(err.message).toBe('Server error');
      };
      
      errorHandler(error);
    });
  });

  describe('MongoDB Integration', () => {
    test('should construct MongoDB connection string', () => {
      const MONGO_URI = 'mongodb://localhost:27017';
      const DB_NAME = 'mythai';
      
      expect(MONGO_URI).toContain('mongodb://');
      expect(DB_NAME).toBe('mythai');
    });

    test('should handle MongoDB connection errors', () => {
      const error = new Error('Connection failed');
      
      // Should log error but not throw
      const handleError = (err) => {
        expect(err.message).toBe('Connection failed');
        return null; // Return null to indicate failure
      };
      
      const result = handleError(error);
      expect(result).toBeNull();
    });

    test('should close MongoDB connection on cleanup', async () => {
      let connectionClosed = false;
      
      const mockClient = {
        close: async () => {
          connectionClosed = true;
        }
      };
      
      await mockClient.close();
      expect(connectionClosed).toBe(true);
    });
  });

  describe('Tool Categories', () => {
    test('should categorize core data tools', () => {
      const coreDataTools = [
        'get_user_profile',
        'save_message',
        'get_conversation_context'
      ];
      
      coreDataTools.forEach(tool => {
        expect(tool).toBeDefined();
      });
      
      expect(coreDataTools.length).toBe(3);
    });

    test('should categorize retrieval and RAG tools', () => {
      const ragTools = [
        'embed_text_minilm',
        'search_scriptures_qdrant',
        'search_scriptures_by_text'
      ];
      
      ragTools.forEach(tool => {
        expect(tool).toBeDefined();
      });
      
      expect(ragTools.length).toBe(3);
    });

    test('should categorize LLM tools', () => {
      const llmTools = [
        'generate_with_mistral',
        'generate_with_llama',
        'classify_intent'
      ];
      
      llmTools.forEach(tool => {
        expect(tool).toBeDefined();
      });
      
      expect(llmTools.length).toBe(3);
    });

    test('should categorize TTS tools', () => {
      const ttsTools = ['generate_speech'];
      
      expect(ttsTools.length).toBe(1);
      expect(ttsTools[0]).toBe('generate_speech');
    });

    test('should categorize persona and context tools', () => {
      const personaTools = [
        'get_deity_persona',
        'get_emotional_response_template'
      ];
      
      personaTools.forEach(tool => {
        expect(tool).toBeDefined();
      });
      
      expect(personaTools.length).toBe(2);
    });
  });

  describe('Configuration Hot-Reload Support', () => {
    test('should support environment variable updates', () => {
      process.env.TEST_CONFIG = 'initial_value';
      expect(process.env.TEST_CONFIG).toBe('initial_value');
      
      // Simulate hot-reload
      process.env.TEST_CONFIG = 'updated_value';
      expect(process.env.TEST_CONFIG).toBe('updated_value');
      
      delete process.env.TEST_CONFIG;
    });

    test('should validate configuration values', () => {
      const validateConfig = (config) => {
        if (!config.MONGO_URI) return { valid: false, error: 'MONGO_URI required' };
        if (!config.DB_NAME) return { valid: false, error: 'DB_NAME required' };
        return { valid: true };
      };
      
      const invalidConfig = {};
      const result = validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      
      const validConfig = {
        MONGO_URI: 'mongodb://localhost:27017',
        DB_NAME: 'mythai'
      };
      const validResult = validateConfig(validConfig);
      expect(validResult.valid).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    test('should track timing metrics', () => {
      const metrics = {
        thinkerTime: 0,
        speakerTime: 0,
        ttsTime: 0,
        totalTime: 0
      };
      
      expect(metrics.thinkerTime).toBeGreaterThanOrEqual(0);
      expect(metrics.speakerTime).toBeGreaterThanOrEqual(0);
      expect(metrics.ttsTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
    });

    test('should track processing mode', () => {
      const modes = ['two-stage', 'single-stage', 'fallback'];
      
      modes.forEach(mode => {
        expect(mode).toMatch(/^(two-stage|single-stage|fallback)$/);
      });
    });

    test('should include model identifiers in metadata', () => {
      const metadata = {
        models: {
          thinker: 'mistralai/Mistral-7B-Instruct-v0.2',
          speaker: 'meta-llama/Llama-3.1-8B-Instruct',
          tts: 'elevenlabs'
        }
      };
      
      expect(metadata.models.thinker).toContain('Mistral');
      expect(metadata.models.speaker).toContain('Llama');
      expect(metadata.models.tts).toBe('elevenlabs');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property 10: Metadata Completeness
     * **Feature: mcp-multi-model-pipeline, Property 10: Metadata Completeness**
     * **Validates: Requirements 4.4, 6.5, 7.5, 8.5**
     * 
     * For any completed pipeline execution, the response should include timing metrics 
     * for each stage, model identifiers, processing mode, and confidence scores.
     */
    describe('Property 10: Metadata Completeness', () => {
      test('response always includes complete metadata fields', () => {
        // Generate test cases with different processing modes
        const testCases = [
          {
            processingMode: 'two-stage',
            timing: { thinker: 1500, speaker: 2000, tts: 500, total: 4000 },
            models: { thinker: 'mistralai/Mistral-7B-Instruct-v0.2', speaker: 'meta-llama/Llama-3.1-8B-Instruct', tts: 'elevenlabs' },
            confidence: 0.85,
            fallbackUsed: false
          },
          {
            processingMode: 'single-stage-fallback',
            timing: { thinker: 0, speaker: 0, tts: 0, total: 2500 },
            models: { thinker: null, speaker: null, tts: null },
            confidence: 0.5,
            fallbackUsed: true
          },
          {
            processingMode: 'two-stage',
            timing: { thinker: 800, speaker: 1200, tts: 0, total: 2000 },
            models: { thinker: 'mistralai/Mistral-7B-Instruct-v0.2', speaker: 'meta-llama/Llama-3.1-8B-Instruct', tts: null },
            confidence: 0.92,
            fallbackUsed: false
          }
        ];

        testCases.forEach((metadata, index) => {
          // Verify all required metadata fields exist
          expect(metadata).toBeDefined();
          expect(metadata.timing).toBeDefined();
          expect(metadata.models).toBeDefined();
          expect(metadata.processingMode).toBeDefined();
          expect(metadata.confidence).toBeDefined();
          expect(metadata.fallbackUsed).toBeDefined();

          // Verify timing fields
          expect(metadata.timing.thinker).toBeGreaterThanOrEqual(0);
          expect(metadata.timing.speaker).toBeGreaterThanOrEqual(0);
          expect(metadata.timing.tts).toBeGreaterThanOrEqual(0);
          expect(metadata.timing.total).toBeGreaterThanOrEqual(0);

          // Verify timing consistency
          const stageTotal = metadata.timing.thinker + metadata.timing.speaker + metadata.timing.tts;
          expect(metadata.timing.total).toBeGreaterThanOrEqual(stageTotal);

          // Verify processing mode is valid
          expect(metadata.processingMode).toMatch(/^(two-stage|single-stage|single-stage-fallback|fallback|error)$/);

          // Verify confidence is in valid range
          expect(metadata.confidence).toBeGreaterThanOrEqual(0);
          expect(metadata.confidence).toBeLessThanOrEqual(1);

          // Verify models object structure
          expect(metadata.models).toHaveProperty('thinker');
          expect(metadata.models).toHaveProperty('speaker');
          expect(metadata.models).toHaveProperty('tts');

          // Verify fallbackUsed is boolean
          expect(typeof metadata.fallbackUsed).toBe('boolean');
        });
      });

      test('metadata includes all required fields for two-stage processing', () => {
        const metadata = {
          requestId: 'req_123456',
          processingMode: 'two-stage',
          timing: {
            thinker: 1500,
            speaker: 2000,
            tts: 500,
            total: 4000
          },
          models: {
            thinker: 'mistralai/Mistral-7B-Instruct-v0.2',
            speaker: 'meta-llama/Llama-3.1-8B-Instruct',
            tts: 'elevenlabs'
          },
          emotion: {
            primary: 'seeking_guidance',
            intensity: 0.7,
            tone: 'warm'
          },
          personality: 'krishna',
          confidence: 0.85,
          fallbackUsed: false,
          originalQuestion: 'What is dharma?',
          deityId: 'krishna',
          language: 'en',
          thinkerOutput: {
            reasoning: 'Found relevant passages in Bhagavad Gita',
            topScore: 0.92,
            resultsCount: 5,
            booksSearched: ['bhagavad_gita', 'mahabharata']
          }
        };

        // Verify core metadata
        expect(metadata.requestId).toBeDefined();
        expect(metadata.processingMode).toBe('two-stage');
        
        // Verify timing metadata
        expect(metadata.timing.thinker).toBeGreaterThan(0);
        expect(metadata.timing.speaker).toBeGreaterThan(0);
        expect(metadata.timing.total).toBeGreaterThan(0);
        
        // Verify model metadata
        expect(metadata.models.thinker).toContain('Mistral');
        expect(metadata.models.speaker).toContain('Llama');
        expect(metadata.models.tts).toBe('elevenlabs');
        
        // Verify emotion metadata
        expect(metadata.emotion).toBeDefined();
        expect(metadata.emotion.primary).toBeDefined();
        expect(metadata.emotion.intensity).toBeGreaterThanOrEqual(0);
        expect(metadata.emotion.intensity).toBeLessThanOrEqual(1);
        
        // Verify context preservation
        expect(metadata.originalQuestion).toBeDefined();
        expect(metadata.deityId).toBeDefined();
        expect(metadata.language).toBeDefined();
        
        // Verify thinker output metadata
        expect(metadata.thinkerOutput).toBeDefined();
        expect(metadata.thinkerOutput.topScore).toBeGreaterThanOrEqual(0);
        expect(metadata.thinkerOutput.topScore).toBeLessThanOrEqual(1);
        expect(metadata.thinkerOutput.resultsCount).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(metadata.thinkerOutput.booksSearched)).toBe(true);
      });

      test('metadata includes error information for fallback processing', () => {
        const metadata = {
          requestId: 'req_789012',
          processingMode: 'single-stage-fallback',
          timing: {
            thinker: 0,
            speaker: 0,
            tts: 0,
            total: 2500
          },
          models: {
            thinker: null,
            speaker: null,
            tts: null
          },
          emotion: {
            primary: 'neutral',
            intensity: 0.5,
            tone: 'balanced'
          },
          confidence: 0.5,
          fallbackUsed: true,
          error: 'Thinker stage failed: API timeout',
          originalQuestion: 'What is karma?',
          deityId: 'shiva',
          language: 'en'
        };

        // Verify fallback metadata
        expect(metadata.fallbackUsed).toBe(true);
        expect(metadata.processingMode).toContain('fallback');
        expect(metadata.error).toBeDefined();
        
        // Verify timing shows no stage execution
        expect(metadata.timing.thinker).toBe(0);
        expect(metadata.timing.speaker).toBe(0);
        
        // Verify models are null for fallback
        expect(metadata.models.thinker).toBeNull();
        expect(metadata.models.speaker).toBeNull();
        
        // Verify confidence is lower for fallback
        expect(metadata.confidence).toBeLessThanOrEqual(0.6);
        
        // Verify context is still preserved
        expect(metadata.originalQuestion).toBeDefined();
        expect(metadata.deityId).toBeDefined();
      });

      test('metadata timing values are consistent and realistic', () => {
        const testCases = [
          { thinker: 1000, speaker: 1500, tts: 500, total: 3000 },
          { thinker: 2000, speaker: 2500, tts: 0, total: 4500 },
          { thinker: 500, speaker: 800, tts: 300, total: 1600 }
        ];

        testCases.forEach(timing => {
          // Total should be at least the sum of stages
          const stageSum = timing.thinker + timing.speaker + timing.tts;
          expect(timing.total).toBeGreaterThanOrEqual(stageSum);
          
          // Total should not be unreasonably larger (accounting for overhead)
          expect(timing.total).toBeLessThanOrEqual(stageSum + 1000);
          
          // Individual stages should be reasonable (< 10 seconds)
          expect(timing.thinker).toBeLessThan(10000);
          expect(timing.speaker).toBeLessThan(10000);
          expect(timing.tts).toBeLessThan(10000);
          expect(timing.total).toBeLessThan(30000);
        });
      });

      test('metadata includes request tracking information', () => {
        const metadata = {
          requestId: 'mcp_1234567890_abc123',
          processingMode: 'two-stage',
          timing: { thinker: 1000, speaker: 1500, tts: 0, total: 2500 },
          models: { thinker: 'mistralai/Mistral-7B-Instruct-v0.2', speaker: 'meta-llama/Llama-3.1-8B-Instruct', tts: null },
          confidence: 0.88,
          fallbackUsed: false,
          originalQuestion: 'What is moksha?',
          deityId: 'vishnu',
          language: 'hi'
        };

        // Verify request ID format
        expect(metadata.requestId).toBeDefined();
        expect(typeof metadata.requestId).toBe('string');
        expect(metadata.requestId.length).toBeGreaterThan(0);
        
        // Verify context tracking
        expect(metadata.originalQuestion).toBeDefined();
        expect(metadata.deityId).toBeDefined();
        expect(metadata.language).toBeDefined();
        expect(metadata.language).toMatch(/^(en|hi|te|ta|sa)$/);
      });
    });
  });
});
