// Status and deployment info endpoint
const express = require('express');
const router = express.Router();
const productionConfig = require('../config/productionConfig');
const externalDataLoader = require('../lib/externalDataLoader');

// Get deployment status
router.get('/deployment', (req, res) => {
  try {
    const deploymentInfo = {
      ...productionConfig.deployment,
      ...externalDataLoader.getDeploymentInfo(),
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      features: productionConfig.features,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      deployment: deploymentInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment status',
      details: error.message
    });
  }
});

// Get available personas
router.get('/personas', (req, res) => {
  try {
    const personas = externalDataLoader.loadPersonas();
    const personaList = Object.keys(personas).map(key => ({
      id: key,
      name: personas[key].name,
      description: personas[key].description,
      language: personas[key].language,
      religion: personas[key].religion
    }));

    res.json({
      success: true,
      count: personaList.length,
      personas: personaList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load personas',
      details: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.1.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;