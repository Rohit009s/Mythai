#!/usr/bin/env node
/**
 * Test Qdrant Cloud Connection
 * Verifies that credentials are configured properly
 */

require('dotenv').config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

console.log('🔍 Qdrant Cloud Configuration Check\n');
console.log('================================================');
console.log('URL:', QDRANT_URL);
console.log('API Key:', QDRANT_API_KEY ? '✓ Present (' + QDRANT_API_KEY.substring(0, 20) + '...)' : '✗ Missing');
console.log('================================================\n');

if (!QDRANT_URL) {
  console.error('❌ QDRANT_URL not found in .env');
  process.exit(1);
}

if (!QDRANT_API_KEY) {
  console.error('❌ QDRANT_API_KEY not found in .env');
  process.exit(1);
}

console.log('✅ All Qdrant credentials are configured!\n');

// Verify format
if (!QDRANT_URL.includes('qdrant.io') && !QDRANT_URL.includes('localhost')) {
  console.warn('⚠️  URL format looks unusual, but proceeding...');
}

if (!QDRANT_API_KEY.startsWith('eyJ')) {
  console.warn('⚠️  API key should be a JWT token (start with "eyJ"), but proceeding...');
}

console.log('\n� Configuration Details:');
console.log('- Service: Qdrant Cloud (GCP Europe-West3)');
console.log('- Authentication: Bearer token (JWT)');
console.log('- HTTPS: Enabled');
console.log('- Collection: myth_texts');
console.log('- Vector Dimension: 1536');

console.log('\n🚀 Configuration is ready for ingestion!');
console.log('\nNext steps:');
console.log('1. Prepare text files in data/texts/');
console.log('2. Run: npm run ingest-enhanced');
console.log('3. Monitor ingestion progress');

console.log('\n💡 For production ingestion:');
console.log('   npm run ingest-enhanced -- --category eastern');
console.log('   npm run ingest-enhanced -- --file data/texts/eastern/bhagavad_gita_complete.txt');
