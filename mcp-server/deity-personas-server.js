#!/usr/bin/env node
/**
 * MCP Server for Deity Personas
 * Provides tools for managing and querying deity personas
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fs = require('fs');
const path = require('path');

const PERSONAS_DIR = path.join(__dirname, '..', 'data', 'personas');

class DeityPersonasServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mythai-deity-personas',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_deity_persona',
          description: 'Get detailed persona information for a specific deity',
          inputSchema: {
            type: 'object',
            properties: {
              deity: {
                type: 'string',
                description: 'Deity name (e.g., krishna, zeus, odin)',
              },
              language: {
                type: 'string',
                description: 'Language variant (en, hi, te, ta)',
                default: 'en',
              },
            },
            required: ['deity'],
          },
        },
        {
          name: 'list_deities_by_tradition',
          description: 'List all deities for a specific religious tradition',
          inputSchema: {
            type: 'object',
            properties: {
              tradition: {
                type: 'string',
                description: 'Religious tradition',
                enum: ['hindu', 'greek', 'norse', 'christian', 'egyptian', 'mayan', 'japanese', 'all'],
              },
            },
            required: ['tradition'],
          },
        },
        {
          name: 'get_deity_voice_config',
          description: 'Get voice configuration for a deity',
          inputSchema: {
            type: 'object',
            properties: {
              deity: {
                type: 'string',
                description: 'Deity name',
              },
            },
            required: ['deity'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_deity_persona':
            return await this.getDeityPersona(args);
          case 'list_deities_by_tradition':
            return await this.listDeitiesByTradition(args);
          case 'get_deity_voice_config':
            return await this.getDeityVoiceConfig(args);
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

    // Resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const personas = fs.readdirSync(PERSONAS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          uri: `persona://${f.replace('.json', '')}`,
          name: f.replace('.json', '').replace(/_/g, ' '),
          mimeType: 'application/json',
          description: `Persona configuration for ${f.replace('.json', '')}`,
        }));

      return { resources: personas };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const personaName = uri.replace('persona://', '');
      const filePath = path.join(PERSONAS_DIR, `${personaName}.json`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Persona not found: ${personaName}`);
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: content,
          },
        ],
      };
    });
  }

  async getDeityPersona(args) {
    const { deity, language = 'en' } = args;
    const fileName = language === 'en' ? `${deity}.json` : `${deity}_${language}.json`;
    const filePath = path.join(PERSONAS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      // Try base version
      const basePath = path.join(PERSONAS_DIR, `${deity}.json`);
      if (!fs.existsSync(basePath)) {
        throw new Error(`Persona not found: ${deity}`);
      }
      const content = fs.readFileSync(basePath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  async listDeitiesByTradition(args) {
    const { tradition } = args;
    const personas = fs.readdirSync(PERSONAS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = JSON.parse(fs.readFileSync(path.join(PERSONAS_DIR, f), 'utf-8'));
        return {
          id: f.replace('.json', ''),
          name: content.name,
          tradition: content.tradition || 'unknown',
          description: content.description,
        };
      });

    const filtered = tradition === 'all' 
      ? personas 
      : personas.filter(p => p.tradition === tradition);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  }

  async getDeityVoiceConfig(args) {
    const { deity } = args;
    const persona = await this.getDeityPersona({ deity });
    const data = JSON.parse(persona.content[0].text);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            deity,
            voice: data.voice || 'default',
            pitch: data.pitch || 0,
            speed: data.speed || 1.0,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Deity Personas Server running on stdio');
  }
}

const server = new DeityPersonasServer();
server.run().catch(console.error);
