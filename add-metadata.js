#!/usr/bin/env node
/**
 * Add METADATA headers to downloaded religious texts
 * Creates files ready for ingestion
 */

const fs = require('fs');
const path = require('path');

// Define all texts with metadata
const texts = [
  {
    input: 'data/texts/en/eastern/bhagavad_gita_raw.txt',
    output: 'data/texts/en/eastern/bhagavad_gita.txt',
    metadata: {
      Title: 'Bhagavad Gita',
      Category: 'eastern',
      Language: 'English',
      Script: 'Devanagari (transliterated)',
      Translator: 'Unknown / Sacred-texts Archive',
      Source: 'https://www.sacred-texts.com/hin/gita/gita.txt',
      Year: '1895',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'hindi-neural'
    }
  },
  {
    input: 'data/texts/en/eastern/upanishads_raw.txt',
    output: 'data/texts/en/eastern/upanishads.txt',
    metadata: {
      Title: 'Upanishads (Selected)',
      Category: 'eastern',
      Language: 'English',
      Script: 'Devanagari (transliterated)',
      Translator: 'Max Müller / Sacred-texts Archive',
      Source: 'https://www.sacred-texts.com/hin/upan.txt',
      Year: '1879',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'sanskrit-neural'
    }
  },
  {
    input: 'data/texts/en/eastern/ramayana_raw.txt',
    output: 'data/texts/en/eastern/ramayana.txt',
    metadata: {
      Title: 'Ramayana',
      Category: 'eastern',
      Language: 'English',
      Script: 'Devanagari (transliterated)',
      Translator: 'Kisari Mohan Ganguli',
      Source: 'https://www.sacred-texts.com/hin/rama/rama.txt',
      Year: '1891',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'hindi-neural'
    }
  },
  {
    input: 'data/texts/en/eastern/tao_te_ching_raw.txt',
    output: 'data/texts/en/eastern/tao_te_ching.txt',
    metadata: {
      Title: 'Tao Te Ching',
      Category: 'eastern',
      Language: 'English',
      Script: 'Chinese (transliterated)',
      Translator: 'James Legge',
      Source: 'https://www.sacred-texts.com/tao/ttc.txt',
      Year: '1891',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'chinese-mandarin'
    }
  },
  {
    input: 'data/texts/en/eastern/dhammapada_raw.txt',
    output: 'data/texts/en/eastern/dhammapada.txt',
    metadata: {
      Title: 'Dhammapada (Buddhist Sutras)',
      Category: 'eastern',
      Language: 'English',
      Script: 'Pali (transliterated)',
      Translator: 'Friedrich Max Müller',
      Source: 'https://www.gutenberg.org/cache/epub/14221/pg14221.txt',
      Year: '1881',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'thai-neural'
    }
  },
  {
    input: 'data/texts/en/eastern/mahabharata_raw.txt',
    output: 'data/texts/en/eastern/mahabharata.txt',
    metadata: {
      Title: 'Mahabharata (Epic)',
      Category: 'eastern',
      Language: 'English',
      Script: 'Devanagari (transliterated)',
      Translator: 'Kisari Mohan Ganguli (KMG)',
      Source: 'https://www.sacred-texts.com/hin/maha/maha.txt',
      Year: '1883-1896',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'hindi-neural'
    }
  },
  {
    input: 'data/texts/en/abrahamic/bible_kjv_raw.txt',
    output: 'data/texts/en/abrahamic/bible_kjv.txt',
    metadata: {
      Title: 'The Holy Bible (King James Version)',
      Category: 'abrahamic',
      Language: 'English',
      Script: 'Latin',
      Translator: 'King James Translators',
      Source: 'https://www.gutenberg.org/cache/epub/10/pg10.txt',
      Year: '1611',
      Copyright: 'Public Domain',
      TTS_Provider: 'polly',
      TTS_Voice: 'english-neural'
    }
  }
];

function createMetadataHeader(meta) {
  let header = 'METADATA\n========\n';
  Object.entries(meta).forEach(([key, value]) => {
    header += `${key}: ${value}\n`;
  });
  header += '---\n\n';
  return header;
}

console.log('\n📚 Adding METADATA Headers to Downloaded Texts\n');

const results = [];
let successCount = 0;
let failCount = 0;

texts.forEach(({ input, output, metadata }) => {
  const fullInputPath = path.resolve(input);
  const fullOutputPath = path.resolve(output);

  if (!fs.existsSync(fullInputPath)) {
    console.log(`⚠️  File not found: ${input}`);
    results.push({ file: path.basename(input), status: '⚠️ NOT FOUND' });
    failCount++;
    return;
  }

  try {
    const content = fs.readFileSync(fullInputPath, 'utf8');
    const header = createMetadataHeader(metadata);
    const combined = header + content;
    fs.writeFileSync(fullOutputPath, combined, 'utf8');
    
    const sizeKB = (combined.length / 1024).toFixed(2);
    console.log(`✓ ${metadata.Title} (${sizeKB} KB)`);
    
    results.push({
      file: path.basename(output),
      title: metadata.Title,
      language: metadata.Language,
      category: metadata.Category,
      translator: metadata.Translator,
      size: `${sizeKB} KB`,
      status: '✓ Ready'
    });
    
    successCount++;
  } catch (error) {
    console.log(`✗ Error processing ${input}: ${error.message}`);
    results.push({ file: path.basename(input), status: `✗ ERROR: ${error.message}` });
    failCount++;
  }
});

console.log(`\n📊 Summary: ${successCount} success, ${failCount} failed\n`);

// Save manifest
const manifest = {
  timestamp: new Date().toISOString(),
  total_texts: results.length,
  successful: successCount,
  texts: results.filter(r => r.status === '✓ Ready'),
  summary: `Downloaded and processed ${successCount} public-domain religious texts across ${new Set(results.map(r => r.language)).size} languages and ${new Set(results.map(r => r.category)).size} categories.`
};

fs.writeFileSync(path.resolve('TEXT_MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('✓ Manifest saved to TEXT_MANIFEST.json\n');

// Print results table
console.log('📋 Prepared Texts:\n');
console.log('Title | Language | Category | Translator | Status');
console.log('-----|----------|----------|------------|---------');
results.filter(r => r.status === '✓ Ready').forEach(r => {
  console.log(`${r.title.substring(0, 20).padEnd(21)} | ${r.language.padEnd(8)} | ${r.category.padEnd(8)} | ${r.translator.substring(0, 15).padEnd(15)} | ${r.status}`);
});

console.log('\n🚀 Next: Run ingest with: npm run ingest-enhanced\n');
