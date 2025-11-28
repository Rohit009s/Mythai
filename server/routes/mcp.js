const express = require('express');
const router = express.Router();
const { getMCPClient } = require('../lib/mcpClient');

/**
 * GET /api/mcp/status
 * Check MCP server status
 */
router.get('/status', async (req, res) => {
  try {
    const mcpClient = await getMCPClient();
    
    res.json({
      success: true,
      available: mcpClient.isAvailable(),
      initialized: mcpClient.initialized,
      servers: {
        sacredTexts: !!mcpClient.sacredTextsClient,
        deityPersonas: !!mcpClient.deityPersonasClient,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      available: false,
    });
  }
});

/**
 * POST /api/mcp/search-texts
 * Search sacred texts via MCP
 */
router.post('/search-texts', async (req, res) => {
  try {
    const { query, tradition = 'all', language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const mcpClient = await getMCPClient();
    const results = await mcpClient.searchSacredTexts(query, tradition, language);
    
    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/mcp/deities/:tradition
 * List deities by tradition via MCP
 */
router.get('/deities/:tradition', async (req, res) => {
  try {
    const { tradition } = req.params;
    
    const mcpClient = await getMCPClient();
    const deities = await mcpClient.listDeitiesByTradition(tradition);
    
    res.json({
      success: true,
      tradition,
      deities,
      count: deities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/mcp/persona/:deity
 * Get deity persona via MCP
 */
router.get('/persona/:deity', async (req, res) => {
  try {
    const { deity } = req.params;
    const { language = 'en' } = req.query;
    
    const mcpClient = await getMCPClient();
    const persona = await mcpClient.getDeityPersona(deity, language);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      });
    }
    
    res.json({
      success: true,
      persona,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/mcp/texts
 * List available texts via MCP
 */
router.get('/texts', async (req, res) => {
  try {
    const { tradition = 'all' } = req.query;
    
    const mcpClient = await getMCPClient();
    const texts = await mcpClient.listAvailableTexts(tradition);
    
    res.json({
      success: true,
      ...texts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
