/**
 * MCP Client for MythAI
 * Connects to MCP servers for sacred texts and deity personas
 */

const path = require('path');

// Try to load MCP SDK, fallback if not available
let Client, StdioClientTransport;
try {
  Client = require('@modelcontextprotocol/sdk/client/index.js').Client;
  StdioClientTransport = require('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport;
} catch (error) {
  console.warn('[MCP] SDK not available, MCP features disabled');
  Client = null;
  StdioClientTransport = null;
}

class MCPClient {
  constructor() {
    this.sacredTextsClient = null;
    this.deityPersonasClient = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    if (!Client || !StdioClientTransport) {
      console.warn('[MCP] SDK not available, skipping initialization');
      return;
    }

    try {
      // Initialize Sacred Texts Server
      await this.initializeSacredTextsServer();
      
      // Initialize Deity Personas Server
      await this.initializeDeityPersonasServer();

      this.initialized = true;
      console.log('[MCP] All servers initialized successfully');
    } catch (error) {
      console.error('[MCP] Initialization error:', error.message);
      // Continue without MCP if initialization fails
    }
  }

  async initializeSacredTextsServer() {
    try {
      const serverPath = path.join(__dirname, '..', '..', 'mcp-server', 'sacred-texts-server.js');
      
      const transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
      });

      this.sacredTextsClient = new Client(
        {
          name: 'mythai-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.sacredTextsClient.connect(transport);
      console.log('[MCP] Sacred Texts Server connected');
    } catch (error) {
      console.warn('[MCP] Sacred Texts Server not available:', error.message);
    }
  }

  async initializeDeityPersonasServer() {
    try {
      const serverPath = path.join(__dirname, '..', '..', 'mcp-server', 'deity-personas-server.js');
      
      const transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
      });

      this.deityPersonasClient = new Client(
        {
          name: 'mythai-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.deityPersonasClient.connect(transport);
      console.log('[MCP] Deity Personas Server connected');
    } catch (error) {
      console.warn('[MCP] Deity Personas Server not available:', error.message);
    }
  }

  async searchSacredTexts(query, tradition = 'all', language = 'en') {
    if (!this.sacredTextsClient) {
      throw new Error('Sacred Texts Server not available');
    }

    try {
      const result = await this.sacredTextsClient.callTool({
        name: 'search_sacred_texts',
        arguments: { query, tradition, language },
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('[MCP] Search error:', error.message);
      return [];
    }
  }

  async getDeityPersona(deity, language = 'en') {
    if (!this.deityPersonasClient) {
      throw new Error('Deity Personas Server not available');
    }

    try {
      const result = await this.deityPersonasClient.callTool({
        name: 'get_deity_persona',
        arguments: { deity, language },
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('[MCP] Get persona error:', error.message);
      return null;
    }
  }

  async listDeitiesByTradition(tradition) {
    if (!this.deityPersonasClient) {
      throw new Error('Deity Personas Server not available');
    }

    try {
      const result = await this.deityPersonasClient.callTool({
        name: 'list_deities_by_tradition',
        arguments: { tradition },
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('[MCP] List deities error:', error.message);
      return [];
    }
  }

  async listAvailableTexts(tradition = 'all') {
    if (!this.sacredTextsClient) {
      throw new Error('Sacred Texts Server not available');
    }

    try {
      const result = await this.sacredTextsClient.callTool({
        name: 'list_available_texts',
        arguments: { tradition },
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('[MCP] List texts error:', error.message);
      return { texts: [] };
    }
  }

  isAvailable() {
    return this.initialized && (this.sacredTextsClient || this.deityPersonasClient);
  }

  async close() {
    if (this.sacredTextsClient) {
      await this.sacredTextsClient.close();
    }
    if (this.deityPersonasClient) {
      await this.deityPersonasClient.close();
    }
    this.initialized = false;
  }
}

// Singleton instance
let mcpClientInstance = null;

async function getMCPClient() {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
    await mcpClientInstance.initialize();
  }
  return mcpClientInstance;
}

module.exports = {
  getMCPClient,
  MCPClient,
};
