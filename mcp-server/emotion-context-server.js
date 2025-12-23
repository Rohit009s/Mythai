#!/usr/bin/env node
/**
 * MCP Server for Emotion & Context Detection
 * Provides tools for detecting user emotions and determining response strategies
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class EmotionContextServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mythai-emotion-context',
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
      await this.server.close();
      process.exit(0);
    });

    // Emotion keywords database
    this.emotionKeywords = {
      sad: {
        keywords: ['suffering', 'pain', 'hurt', 'lost', 'alone', 'depressed', 'cry', 'tears', 'grief', 'sorrow', 'heartbroken', 'miserable'],
        intensity_modifiers: ['very', 'extremely', 'so', 'really', 'deeply']
      },
      angry: {
        keywords: ['angry', 'frustrated', 'unfair', 'hate', 'mad', 'furious', 'rage', 'annoyed', 'irritated'],
        intensity_modifiers: ['very', 'extremely', 'so', 'really']
      },
      confused: {
        keywords: ['confused', 'don\'t understand', 'why', 'how', 'lost', 'unclear', 'puzzled', 'bewildered'],
        intensity_modifiers: ['very', 'completely', 'totally', 'so']
      },
      grateful: {
        keywords: ['thank', 'grateful', 'appreciate', 'blessed', 'thankful', 'gratitude'],
        intensity_modifiers: ['very', 'so', 'deeply', 'truly']
      },
      motivated: {
        keywords: ['inspire', 'motivate', 'strength', 'courage', 'determined', 'ready', 'excited'],
        intensity_modifiers: ['very', 'so', 'really']
      },
      fearful: {
        keywords: ['afraid', 'scared', 'fear', 'worried', 'anxious', 'terrified', 'nervous', 'panic'],
        intensity_modifiers: ['very', 'so', 'extremely', 'really']
      },
      hopeful: {
        keywords: ['hope', 'hopeful', 'optimistic', 'looking forward', 'positive', 'better'],
        intensity_modifiers: ['very', 'so', 'really']
      }
    };

    // Response strategies
    this.responseStrategies = {
      sad: {
        approach: 'comfort_first',
        tone: 'gentle and reassuring',
        structure: 'acknowledge → comfort → teach → encourage',
        avoid: ['harsh truths', 'complex philosophy', 'dismissive language'],
        key_phrases: ['I see your pain', 'You are not alone', 'This too shall pass']
      },
      angry: {
        approach: 'validate_then_calm',
        tone: 'understanding and calming',
        structure: 'validate → perspective → wisdom → peace',
        avoid: ['dismissing feelings', 'telling them to calm down', 'being preachy'],
        key_phrases: ['Your feelings are valid', 'Let us find peace together']
      },
      confused: {
        approach: 'clarify_gently',
        tone: 'patient and clear',
        structure: 'acknowledge → simplify → explain → guide',
        avoid: ['complex jargon', 'overwhelming information', 'condescension'],
        key_phrases: ['Let me help you understand', 'It\'s okay to be confused']
      },
      grateful: {
        approach: 'acknowledge_warmly',
        tone: 'warm and encouraging',
        structure: 'acknowledge → encourage → inspire',
        avoid: ['being dismissive', 'making it about yourself'],
        key_phrases: ['Your gratitude warms my heart', 'Continue on this path']
      },
      motivated: {
        approach: 'inspire_and_guide',
        tone: 'energetic and supportive',
        structure: 'acknowledge → inspire → guide → empower',
        avoid: ['dampening enthusiasm', 'being overly cautious'],
        key_phrases: ['Your spirit is strong', 'Let me guide you forward']
      },
      fearful: {
        approach: 'reassure_and_strengthen',
        tone: 'calm and protective',
        structure: 'reassure → strengthen → guide → empower',
        avoid: ['dismissing fears', 'being overly optimistic', 'minimizing'],
        key_phrases: ['You are safe', 'I am with you', 'Fear is natural']
      },
      neutral: {
        approach: 'balanced',
        tone: 'warm and informative',
        structure: 'understand → inform → guide',
        avoid: ['being cold', 'over-explaining'],
        key_phrases: ['Let me help you', 'I am here for you']
      }
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'detect_emotion',
          description: 'Detect user\'s emotional state from their message',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'User\'s message text',
              },
              context: {
                type: 'array',
                description: 'Previous messages for context (optional)',
                items: { type: 'string' },
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'get_response_strategy',
          description: 'Get optimal response strategy based on emotion and intent',
          inputSchema: {
            type: 'object',
            properties: {
              emotion: {
                type: 'string',
                description: 'Detected emotion',
                enum: ['sad', 'angry', 'confused', 'grateful', 'motivated', 'fearful', 'neutral'],
              },
              intent: {
                type: 'string',
                description: 'User intent type',
              },
              persona: {
                type: 'string',
                description: 'Deity persona name',
              },
            },
            required: ['emotion'],
          },
        },
        {
          name: 'analyze_emotional_needs',
          description: 'Analyze what the user needs based on their emotional state',
          inputSchema: {
            type: 'object',
            properties: {
              emotion: {
                type: 'string',
                description: 'Primary emotion',
              },
              intensity: {
                type: 'number',
                description: 'Emotion intensity (0-1)',
              },
              message: {
                type: 'string',
                description: 'User message',
              },
            },
            required: ['emotion', 'intensity'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'detect_emotion':
            return await this.detectEmotion(args);
          case 'get_response_strategy':
            return await this.getResponseStrategy(args);
          case 'analyze_emotional_needs':
            return await this.analyzeEmotionalNeeds(args);
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

  async detectEmotion(args) {
    const { message, context = [] } = args;
    const messageLower = message.toLowerCase();
    
    const detected = {};
    let maxScore = 0;
    let primaryEmotion = 'neutral';

    // Analyze message for emotion keywords
    for (const [emotion, data] of Object.entries(this.emotionKeywords)) {
      let score = 0;
      
      // Count keyword matches
      for (const keyword of data.keywords) {
        if (messageLower.includes(keyword)) {
          score += 1;
          
          // Check for intensity modifiers
          for (const modifier of data.intensity_modifiers) {
            if (messageLower.includes(`${modifier} ${keyword}`) || 
                messageLower.includes(`${keyword} ${modifier}`)) {
              score += 0.5;
            }
          }
        }
      }

      if (score > 0) {
        detected[emotion] = score;
        if (score > maxScore) {
          maxScore = score;
          primaryEmotion = emotion;
        }
      }
    }

    // Calculate intensity
    const intensity = Math.min(maxScore / 3, 1.0);

    // Determine secondary emotion
    const sortedEmotions = Object.entries(detected)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion]) => emotion);
    
    const secondaryEmotion = sortedEmotions.length > 1 ? sortedEmotions[1] : null;

    // Determine needs
    const needs = this.getNeedsFromEmotion(primaryEmotion, intensity);

    const result = {
      primary_emotion: primaryEmotion,
      secondary_emotion: secondaryEmotion,
      intensity: intensity,
      confidence: maxScore > 0 ? 'high' : 'low',
      needs: needs,
      detected_emotions: detected
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getResponseStrategy(args) {
    const { emotion, intent = 'general', persona = 'guide' } = args;
    
    const strategy = this.responseStrategies[emotion] || this.responseStrategies.neutral;
    
    // Customize based on intent
    let customStrategy = { ...strategy };
    
    if (intent === 'SPIRITUAL_GUIDANCE') {
      customStrategy.structure = strategy.structure + ' → spiritual wisdom';
    } else if (intent === 'EMOTIONAL_SUPPORT') {
      customStrategy.structure = 'comfort → support → gentle guidance';
    }

    const result = {
      emotion: emotion,
      intent: intent,
      persona: persona,
      strategy: customStrategy
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async analyzeEmotionalNeeds(args) {
    const { emotion, intensity, message = '' } = args;
    
    const needs = this.getNeedsFromEmotion(emotion, intensity);
    
    // Add specific needs based on message content
    const specificNeeds = [];
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('why') || messageLower.includes('how')) {
      specificNeeds.push('explanation');
    }
    if (messageLower.includes('help') || messageLower.includes('guide')) {
      specificNeeds.push('guidance');
    }
    if (messageLower.includes('what should i') || messageLower.includes('what do i')) {
      specificNeeds.push('direction');
    }

    const result = {
      emotion: emotion,
      intensity: intensity,
      primary_needs: needs,
      specific_needs: specificNeeds,
      urgency: intensity > 0.7 ? 'high' : intensity > 0.4 ? 'medium' : 'low',
      recommended_approach: this.responseStrategies[emotion]?.approach || 'balanced'
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  getNeedsFromEmotion(emotion, intensity = 0.5) {
    const needsMap = {
      sad: intensity > 0.6 
        ? ['immediate comfort', 'understanding', 'hope', 'companionship']
        : ['comfort', 'understanding', 'perspective'],
      angry: intensity > 0.6
        ? ['validation', 'calm', 'perspective', 'release']
        : ['validation', 'perspective', 'understanding'],
      confused: ['clarity', 'explanation', 'guidance', 'patience'],
      grateful: ['acknowledgment', 'encouragement', 'inspiration'],
      motivated: ['inspiration', 'direction', 'support', 'empowerment'],
      fearful: intensity > 0.6
        ? ['reassurance', 'safety', 'courage', 'protection']
        : ['reassurance', 'perspective', 'strength'],
      hopeful: ['encouragement', 'guidance', 'inspiration'],
      neutral: ['information', 'guidance', 'wisdom']
    };
    
    return needsMap[emotion] || needsMap.neutral;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Emotion Context Server running on stdio');
  }
}

const server = new EmotionContextServer();
server.run().catch(console.error);
