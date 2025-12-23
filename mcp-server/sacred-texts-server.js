#!/usr/bin/env node
/**
 * MCP Server for Sacred Texts
 * Provides tools for searching and retrieving sacred texts
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fs = require('fs');
const path = require('path');

// Sacred texts database
const TEXTS_DIR = path.join(__dirname, '..', 'data', 'texts');

class SacredTextsServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mythai-sacred-texts',
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
          name: 'search_sacred_texts',
          description: 'Search through sacred texts by keyword, deity, or tradition',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query or keyword',
              },
              tradition: {
                type: 'string',
                description: 'Religious tradition (hindu, greek, norse, christian, etc.)',
                enum: ['hindu', 'greek', 'norse', 'christian', 'egyptian', 'mayan', 'all'],
              },
              language: {
                type: 'string',
                description: 'Language code (en, hi, te, ta)',
                enum: ['en', 'hi', 'te', 'ta'],
                default: 'en',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_scripture_verse',
          description: 'Get a specific verse from a sacred text',
          inputSchema: {
            type: 'object',
            properties: {
              book: {
                type: 'string',
                description: 'Name of the sacred book (e.g., "Bhagavad Gita", "Bible")',
              },
              chapter: {
                type: 'number',
                description: 'Chapter number',
              },
              verse: {
                type: 'number',
                description: 'Verse number',
              },
            },
            required: ['book', 'chapter', 'verse'],
          },
        },
        {
          name: 'list_available_texts',
          description: 'List all available sacred texts by tradition',
          inputSchema: {
            type: 'object',
            properties: {
              tradition: {
                type: 'string',
                description: 'Religious tradition to filter by',
                enum: ['hindu', 'greek', 'norse', 'christian', 'egyptian', 'mayan', 'all'],
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_sacred_texts':
            return await this.searchSacredTexts(args);
          case 'get_scripture_verse':
            return await this.getScriptureVerse(args);
          case 'list_available_texts':
            return await this.listAvailableTexts(args);
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

  async searchSacredTexts(args) {
    const { query, tradition = 'all', language = 'en' } = args;
    const results = [];

    // Search through text files
    const searchDir = path.join(TEXTS_DIR, language);
    
    if (!fs.existsSync(searchDir)) {
      return {
        content: [
          {
            type: 'text',
            text: `No texts found for language: ${language}`,
          },
        ],
      };
    }

    const files = this.getAllTextFiles(searchDir);
    const queryLower = query.toLowerCase();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          results.push({
            file: path.basename(file),
            line: i + 1,
            text: lines[i].trim(),
            context: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
          });
          
          if (results.length >= 5) break;
        }
      }
      if (results.length >= 5) break;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async getScriptureVerse(args) {
    const { book, chapter, verse } = args;
    
    // This is a simplified implementation
    // In production, you'd have a structured database
    return {
      content: [
        {
          type: 'text',
          text: `Verse lookup: ${book}, Chapter ${chapter}, Verse ${verse}\n(Implementation would fetch from structured database)`,
        },
      ],
    };
  }

  async listAvailableTexts(args) {
    const { tradition = 'all' } = args;
    const texts = [];

    const enDir = path.join(TEXTS_DIR, 'en');
    if (fs.existsSync(enDir)) {
      const files = this.getAllTextFiles(enDir);
      texts.push(...files.map(f => path.basename(f)));
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ tradition, texts }, null, 2),
        },
      ],
    };
  }

  getAllTextFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith('.txt')) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Sacred Texts Server running on stdio');
  }
}

const server = new SacredTextsServer();
server.run().catch(console.error);
