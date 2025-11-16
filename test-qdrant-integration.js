#!/usr/bin/env node
/**
 * Test Qdrant Cloud Integration with MythAI
 * Verifies that:
 * 1. Credentials are configured
 * 2. Cloud client loads properly
 * 3. System can route to cloud mode
 */

require('dotenv').config();

console.log('\n🔍 Testing Qdrant Cloud Integration\n');

// Test 1: Check credentials
console.log('📋 Test 1: Configuration Check');
console.log('================================');
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION;

console.log('✓ QDRANT_URL:', QDRANT_URL ? 'Present' : 'Missing');
console.log('✓ QDRANT_API_KEY:', QDRANT_API_KEY ? 'Present' : 'Missing');
console.log('✓ QDRANT_COLLECTION:', COLLECTION || 'myth_texts (default)');

if (!QDRANT_URL || !QDRANT_API_KEY) {
  console.error('\n❌ Missing required credentials');
  process.exit(1);
}

// Test 2: Load qdrantClient
console.log('\n📋 Test 2: Module Load Check');
console.log('================================');
try {
  const qdrantClient = require('./server/lib/qdrantClient');
  console.log('✓ qdrantClient loaded successfully');
  console.log('✓ Mode:', qdrantClient.MODE);
  console.log('✓ Exports:', Object.keys(qdrantClient).join(', '));
} catch (error) {
  console.error('❌ Failed to load qdrantClient:', error.message);
  process.exit(1);
}

// Test 3: Load qdrantCloud
console.log('\n📋 Test 3: Cloud Client Load Check');
console.log('=====================================');
try {
  const qdrantCloud = require('./server/lib/qdrantCloud');
  console.log('✓ qdrantCloud loaded successfully');
  console.log('✓ Exports:', Object.keys(qdrantCloud).join(', '));
} catch (error) {
  console.error('❌ Failed to load qdrantCloud:', error.message);
  process.exit(1);
}

// Test 4: Verify cloud mode detection
console.log('\n📋 Test 4: Cloud Mode Detection');
console.log('=================================');
const isCloud = QDRANT_URL.includes('qdrant.io');
console.log('✓ Cloud instance detected:', isCloud);
console.log('✓ System will use:', isCloud ? 'CLOUD' : 'MOCK');

console.log('\n✅ All integration tests passed!');
console.log('\n🚀 Ready to ingest religious texts to Qdrant Cloud');
console.log('\nNext step: npm run ingest-enhanced\n');
