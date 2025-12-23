#!/usr/bin/env node
/**
 * Unified MythAI MCP Server
 * 
 * This is the central MCP server that acts as the "wiring standard"
 * connecting all components:
 * - HuggingFace Models (MiniLM, Mistral, Llama)
 * - Qdrant (Vector Search)
 * - MongoDB (User Data & Conversations)
 * - ElevenLabs (TTS)
 * - Two-Stage Pipeline (Thinker + Speaker)
 * 
 * Categories:
 * A. Core Data Tools (MongoDB)
 * B. Retrieval & RAG Tools (MiniLM + Qdrant)
 * C. LLM Tools (Mistral + Llama)
 * D. TTS Tools (ElevenLabs)
 * E. Persona & Context Tools
 * F. Two-Stage Pipeline Tools
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const { MongoClient } = require('mongodb');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import Pipeline Orchestrator
const PipelineOrchestrator = require('../server/lib/pipelineOrchestrator');
const config = require('../server/config/multiModelPipeline');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'mythai';
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

class UnifiedMythAIServer {
  constructor() {
    this.mongoClient = null;
    this.db = null;
    
    // Initialize Pipeline Orchestrator
    this.pipelineOrchestrator = null;
    this.initializePipeline();
    
    this.server = new Server(
      {
        name: 'mythai-unified',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Initialize Pipeline Orchestrator
   */
  initializePipeline() {
    try {
      // Check if two-stage pipeline is enabled
      if (config.pipeline.enableTwoStage) {
        this.pipelineOrchestrator = new PipelineOrchestrator({
          enableTTS: config.tts.enabled,
          enableFallback: config.pipeline.enableFallback,
          timeout: config.pipeline.totalTimeout,
          maxRetries: config.pipeline.maxRetries,
          initialRetryDelay: config.pipeline.retryDelay,
          thinkerOptions: {
            model: config.thinker.model,
            maxTokens: config.thinker.maxTokens,
            temperature: config.thinker.temperature,
            timeout: config.thinker.timeout
          },
          speakerOptions: {
            model: config.speaker.model,
            maxTokens: config.speaker.maxTokens,
            temperature: config.speaker.temperature,
            timeout: config.speaker.timeout
          }
        });
        console.error('[MCP] Pipeline Orchestrator initialized');
      } else {
        console.error('[MCP] Two-stage pipeline disabled via configuration');
      }
    } catch (error) {
      console.error('[MCP] Failed to initialize Pipeline Orchestrator:', error.message);
      this.pipelineOrchestrator = null;
    }
  }

  async setupToolHandlers() {
    // Initialize MongoDB connection
    await this.connectMongo();

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ===== CATEGORY A: CORE DATA TOOLS (MongoDB) =====
        {
          name: 'get_user_profile',
          description: 'Get user profile from MongoDB',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: { type: 'string', description: 'User ID' },
            },
            required: ['user_id'],
          },
        },
        {
          name: 'save_message',
          description: 'Save a message to conversation history',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string' },
              role: { type: 'string', enum: ['user', 'assistant'] },
              persona: { type: 'string' },
              text: { type: 'string' },
              emotion: { type: 'string' },
              sources: { type: 'array', items: { type: 'object' } },
              timestamp: { type: 'string' },
            },
            required: ['conversation_id', 'role', 'text'],
          },
        },
        {
          name: 'get_conversation_context',
          description: 'Get recent conversation history',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string' },
              max_messages: { type: 'number', default: 10 },
            },
            required: ['conversation_id'],
          },
        },

        // ===== CATEGORY B: RETRIEVAL & RAG TOOLS =====
        {
          name: 'embed_text_minilm',
          description: 'Generate embeddings using MiniLM-L6-v2 via HuggingFace',
          inputSchema: {
            type: 'object',
            properties: {
              inputs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Text(s) to embed',
              },
              model: {
                type: 'string',
                default: 'sentence-transformers/all-MiniLM-L6-v2',
              },
            },
            required: ['inputs'],
          },
        },
        {
          name: 'search_scriptures_qdrant',
          description: 'Search sacred texts in Qdrant using embedding',
          inputSchema: {
            type: 'object',
            properties: {
              embedding: {
                type: 'array',
                items: { type: 'number' },
                description: '384-dim embedding vector',
              },
              top_k: { type: 'number', default: 5 },
              persona: { type: 'string', description: 'Deity persona filter' },
              religion: { type: 'string', description: 'Religion filter' },
              books: { type: 'string', description: 'Specific books filter' },
            },
            required: ['embedding'],
          },
        },
        {
          name: 'search_scriptures_by_text',
          description: 'Search sacred texts by text query (embed + search combined)',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              top_k: { type: 'number', default: 5 },
              persona: { type: 'string' },
              religion: { type: 'string' },
              books: { type: 'string' },
            },
            required: ['query'],
          },
        },

        // ===== CATEGORY C: LLM TOOLS =====
        {
          name: 'generate_with_mistral',
          description: 'Generate text with Mistral 7B (reasoning/scholar)',
          inputSchema: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                    content: { type: 'string' },
                  },
                },
              },
              temperature: { type: 'number', default: 0.3 },
              max_tokens: { type: 'number', default: 500 },
            },
            required: ['messages'],
          },
        },
        {
          name: 'generate_with_llama',
          description: 'Generate text with Llama 3.1 8B (humanizing/counselor)',
          inputSchema: {
            type: 'object',
            properties: {
              messages: { type: 'array' },
              temperature: { type: 'number', default: 0.7 },
              max_tokens: { type: 'number', default: 500 },
            },
            required: ['messages'],
          },
        },
        {
          name: 'classify_intent',
          description: 'Classify user intent and emotion',
          inputSchema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              conversation_history: { type: 'array', default: [] },
            },
            required: ['message'],
          },
        },

        // ===== CATEGORY D: TTS TOOLS =====
        {
          name: 'generate_speech',
          description: 'Generate speech with ElevenLabs TTS',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              persona: { type: 'string', default: 'krishna' },
              emotion: {
                type: 'string',
                enum: ['neutral', 'sad', 'angry', 'anxious', 'motivated', 'joyful'],
                default: 'neutral',
              },
              output_format: {
                type: 'string',
                enum: ['base64', 'file'],
                default: 'base64',
              },
            },
            required: ['text'],
          },
        },
        
        // ===== CATEGORY E: PERSONA & CONTEXT TOOLS =====
        {
          name: 'get_deity_persona',
          description: 'Get deity persona configuration',
          inputSchema: {
            type: 'object',
            properties: {
              deity: { type: 'string' },
              language: { type: 'string', default: 'en' },
            },
            required: ['deity'],
          },
        },
        {
          name: 'get_emotional_response_template',
          description: 'Get how deity responds to specific emotion',
          inputSchema: {
            type: 'object',
            properties: {
              deity: { type: 'string' },
              emotion: { type: 'string' },
            },
            required: ['deity', 'emotion'],
          },
        },

        // ===== CATEGORY F: TWO-STAGE PIPELINE TOOLS =====
        {
          name: 'process_two_stage_pipeline',
          description: 'Process user question through two-stage pipeline (Thinker + Speaker)',
          inputSchema: {
            type: 'object',
            properties: {
              userQuestion: { 
                type: 'string', 
                description: 'User question to process' 
              },
              deityId: { 
                type: 'string', 
                description: 'Deity identifier (e.g., "krishna", "shiva")' 
              },
              userId: { 
                type: 'string', 
                description: 'User identifier' 
              },
              language: { 
                type: 'string', 
                default: 'en',
                description: 'Language code (e.g., "en", "hi", "te")' 
              },
              religion: { 
                type: 'string', 
                description: 'Religion identifier (optional)' 
              },
              conversationHistory: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string' },
                    content: { type: 'string' }
                  }
                },
                description: 'Recent conversation history (optional)' 
              },
              enableTTS: { 
                type: 'boolean', 
                default: true,
                description: 'Enable TTS audio generation' 
              }
            },
            required: ['userQuestion', 'deityId', 'userId', 'language'],
          },
        },
        {
          name: 'get_pipeline_status',
          description: 'Get status of the two-stage pipeline',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Category A: Core Data
          case 'get_user_profile':
            return await this.getUserProfile(args);
          case 'save_message':
            return await this.saveMessage(args);
          case 'get_conversation_context':
            return await this.getConversationContext(args);
          
          // Category B: Retrieval & RAG
          case 'embed_text_minilm':
            return await this.embedTextMiniLM(args);
          case 'search_scriptures_qdrant':
            return await this.searchScripturesQdrant(args);
          case 'search_scriptures_by_text':
            return await this.searchScripturesByText(args);
          
          // Category C: LLM
          case 'generate_with_mistral':
            return await this.generateWithMistral(args);
          case 'generate_with_llama':
            return await this.generateWithLlama(args);
          case 'classify_intent':
            return await this.classifyIntent(args);
          
          // Category D: TTS
          case 'generate_speech':
            return await this.generateSpeech(args);
          
          // Category E: Persona & Context
          case 'get_deity_persona':
            return await this.getDeityPersona(args);
          case 'get_emotional_response_template':
            return await this.getEmotionalResponseTemplate(args);
          
          // Category F: Two-Stage Pipeline
          case 'process_two_stage_pipeline':
            return await this.processTwoStagePipeline(args);
          case 'get_pipeline_status':
            return await this.getPipelineStatus(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // MongoDB connection
  async connectMongo() {
    if (this.mongoClient) return;
    
    try {
      this.mongoClient = new MongoClient(MONGO_URI);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(DB_NAME);
      console.error('[MCP] MongoDB connected');
    } catch (error) {
      console.error('[MCP] MongoDB connection failed:', error.message);
    }
  }

  // ===== CATEGORY F: TWO-STAGE PIPELINE TOOLS =====

  /**
   * Process user question through two-stage pipeline
   */
  async processTwoStagePipeline(args) {
    const { userQuestion, deityId, userId, language, religion, conversationHistory, enableTTS } = args;

    // Check if pipeline is available
    if (!this.pipelineOrchestrator) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Two-stage pipeline not available',
            reason: 'Pipeline orchestrator not initialized or disabled in configuration'
          })
        }],
        isError: true
      };
    }

    try {
      // Build context
      const context = {
        deityId,
        userId,
        language,
        religion,
        conversationHistory: conversationHistory || [],
        enableTTS: enableTTS !== false,
        requestId: `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`
      };

      console.error(`[MCP] Processing two-stage pipeline for deity: ${deityId}, language: ${language}`);

      // Process through pipeline
      const result = await this.pipelineOrchestrator.processTwoStage(userQuestion, context);

      // Format response
      const response = {
        text: result.text,
        audio: result.audio ? result.audio.toString('base64') : null,
        references: result.references,
        metadata: result.metadata
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response)
        }]
      };

    } catch (error) {
      console.error('[MCP] Two-stage pipeline error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus(args) {
    try {
      if (!this.pipelineOrchestrator) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              available: false,
              reason: 'Pipeline orchestrator not initialized',
              configuration: {
                enableTwoStage: config.pipeline.enableTwoStage,
                enableFallback: config.pipeline.enableFallback,
                ttsEnabled: config.tts.enabled
              }
            })
          }]
        };
      }

      const status = this.pipelineOrchestrator.getStatus();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            available: status.available,
            thinker: status.thinker,
            speaker: status.speaker,
            tts: status.tts,
            fallback: status.fallback,
            configuration: {
              enableTwoStage: config.pipeline.enableTwoStage,
              enableFallback: config.pipeline.enableFallback,
              maxRetries: config.pipeline.maxRetries,
              totalTimeout: config.pipeline.totalTimeout,
              thinkerModel: config.thinker.model,
              speakerModel: config.speaker.model
            }
          })
        }]
      };

    } catch (error) {
      console.error('[MCP] Get pipeline status error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error.message
          })
        }],
        isError: true
      };
    }
  }

  // Placeholder implementations for other tools (to be implemented)
  async getUserProfile(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async saveMessage(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async getConversationContext(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async embedTextMiniLM(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async searchScripturesQdrant(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async searchScripturesByText(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async generateWithMistral(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async generateWithLlama(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async classifyIntent(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async generateSpeech(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async getDeityPersona(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  async getEmotionalResponseTemplate(args) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not implemented' }) }] };
  }

  // Cleanup
  async cleanup() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    await this.server.close();
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Unified MythAI Server running on stdio');
    console.error('Tools available: 15 (6 categories)');
  }
}

const server = new UnifiedMythAIServer();
server.run().catch(console.error);
