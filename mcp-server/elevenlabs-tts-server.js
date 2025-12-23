#!/usr/bin/env node
/**
 * MCP Server for ElevenLabs TTS
 * Provides text-to-speech tools with emotion and persona support
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const https = require('https');
const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_BASE = 'api.elevenlabs.io';

// Voice mapping for deities
const DEITY_VOICES = {
  krishna: 'JBFqnCBsd6RMkjVY5Cd5',
  rama: 'pNInz6obpgDQGcFmaJgB',
  shiva: 'VR6AewLTigWG4xSOukaG',
  vishnu: 'EXAVITQu4vr4xnSDxMaL',
  ganesha: 'ErXwobaYiN019PkySvjV',
  hanuman: 'MF3mGyEYCl7XYWbV9V6O',
  lakshmi: 'ThT5KcBeYPX3keUQqHPh',
  zeus: 'VR6AewLTigWG4xSOukaG',
  athena: 'EXAVITQu4vr4xnSDxMaL',
  apollo: 'pNInz6obpgDQGcFmaJgB',
  odin: 'VR6AewLTigWG4xSOukaG',
  thor: 'MF3mGyEYCl7XYWbV9V6O',
  loki: 'ErXwobaYiN019PkySvjV',
  default: 'JBFqnCBsd6RMkjVY5Cd5'
};

class ElevenLabsTTSServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mythai-elevenlabs-tts',
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
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_speech',
          description: 'Generate speech from text using ElevenLabs TTS with persona-specific voices',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Text to convert to speech',
              },
              persona: {
                type: 'string',
                description: 'Deity persona name (krishna, zeus, odin, etc.)',
                default: 'krishna',
              },
              emotion: {
                type: 'string',
                description: 'Emotion to convey in speech',
                enum: ['neutral', 'sad', 'angry', 'anxious', 'motivated', 'joyful', 'confused'],
                default: 'neutral',
              },
              output_format: {
                type: 'string',
                description: 'Audio output format',
                enum: ['mp3', 'base64'],
                default: 'base64',
              },
            },
            required: ['text'],
          },
        },
        {
          name: 'list_voices',
          description: 'List available ElevenLabs voices',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_voice_settings',
          description: 'Get voice settings for a specific emotion',
          inputSchema: {
            type: 'object',
            properties: {
              emotion: {
                type: 'string',
                description: 'Emotion type',
                enum: ['neutral', 'sad', 'angry', 'anxious', 'motivated', 'joyful', 'confused'],
              },
            },
            required: ['emotion'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_speech':
            return await this.generateSpeech(args);
          case 'list_voices':
            return await this.listVoices();
          case 'get_voice_settings':
            return await this.getVoiceSettings(args);
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

  async generateSpeech(args) {
    const { text, persona = 'krishna', emotion = 'neutral', output_format = 'base64' } = args;

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = DEITY_VOICES[persona.toLowerCase()] || DEITY_VOICES.default;
    const voiceSettings = this.getVoiceSettingsForEmotion(emotion);

    const audioBuffer = await this.callElevenLabsAPI(voiceId, text, voiceSettings);

    if (output_format === 'base64') {
      const base64Audio = audioBuffer.toString('base64');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              audio_base64: base64Audio,
              format: 'mp3',
              persona,
              emotion,
              text_length: text.length,
            }, null, 2),
          },
        ],
      };
    } else {
      // Save to file
      const filename = `speech_${Date.now()}.mp3`;
      const filepath = path.join(__dirname, '..', 'temp', filename);
      fs.writeFileSync(filepath, audioBuffer);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              file_path: filepath,
              format: 'mp3',
              persona,
              emotion,
            }, null, 2),
          },
        ],
      };
    }
  }

  async listVoices() {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voices = await this.getAvailableVoices();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            voices: voices.map(v => ({
              voice_id: v.voice_id,
              name: v.name,
              category: v.category,
            })),
            deity_mappings: DEITY_VOICES,
          }, null, 2),
        },
      ],
    };
  }

  async getVoiceSettings(args) {
    const { emotion } = args;
    const settings = this.getVoiceSettingsForEmotion(emotion);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            emotion,
            settings,
          }, null, 2),
        },
      ],
    };
  }

  getVoiceSettingsForEmotion(emotion) {
    const settings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    };

    switch (emotion) {
      case 'sad':
        settings.stability = 0.7;
        settings.style = 0.3;
        break;
      case 'angry':
        settings.stability = 0.3;
        settings.style = 0.5;
        break;
      case 'anxious':
        settings.stability = 0.4;
        settings.style = 0.4;
        break;
      case 'motivated':
        settings.stability = 0.5;
        settings.style = 0.6;
        break;
      case 'joyful':
        settings.stability = 0.4;
        settings.style = 0.5;
        break;
    }

    return settings;
  }

  callElevenLabsAPI(voiceId, text, voiceSettings) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: voiceSettings,
      });

      const options = {
        hostname: ELEVENLABS_API_BASE,
        port: 443,
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Length': data.length,
        },
      };

      const req = https.request(options, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(Buffer.concat(chunks));
          } else {
            const errorBody = Buffer.concat(chunks).toString();
            reject(new Error(`ElevenLabs API error: ${res.statusCode} - ${errorBody}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  getAvailableVoices() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: ELEVENLABS_API_BASE,
        port: 443,
        path: '/v1/voices',
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve(parsed.voices || []);
          } else {
            reject(new Error(`Failed to get voices: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP ElevenLabs TTS Server running on stdio');
  }
}

const server = new ElevenLabsTTSServer();
server.run().catch(console.error);
