#!/usr/bin/env node
/**
 * PDF Text Extraction Tool
 * Converts religious text PDFs to formatted text files for ingestion
 * 
 * Usage:
 *   node scripts/extract_pdf.js --file bhagavad_gita.pdf --category eastern
 *   node scripts/extract_pdf.js --url https://... --output gita.txt
 * 
 * Requirements:
 *   npm install pdfplumber pdf-parse pdfjs-dist
 */

const fs = require('fs');
const path = require('path');

console.log('📄 PDF Extraction Utility for Religious Texts\n');

// Check if dependencies are installed
try {
  require('pdf-parse');
  console.log('✅ pdf-parse available\n');
} catch (e) {
  console.log('ℹ️  pdf-parse not installed. Install with:');
  console.log('   npm install pdf-parse\n');
  console.log('Or use online converters:\n');
  console.log('   🔗 https://pdf2go.com/pdf-to-txt');
  console.log('   🔗 https://smallpdf.com/pdf-to-text');
  console.log('   🔗 https://ilovepdf.com/pdf-to-text\n');
}

// Show available online sources
console.log('📚 Download Religious Texts:\n');

const sources = {
  'Bhagavad Gita': {
    url: 'https://sacred-texts.com/hin/gita/gita.txt',
    command: 'curl https://sacred-texts.com/hin/gita/gita.txt > data/texts/eastern/bhagavad_gita_complete.txt'
  },
  'Bible (KJV)': {
    url: 'https://www.gutenberg.org/cache/epub/10/pg10.txt',
    command: 'curl https://www.gutenberg.org/cache/epub/10/pg10.txt > data/texts/abrahamic/bible_kjv_complete.txt'
  },
  'Mahabharata': {
    url: 'https://sacred-texts.com/hin/maha/maha.txt',
    command: 'curl https://sacred-texts.com/hin/maha/maha.txt > data/texts/eastern/mahabharata_complete.txt'
  },
  'Ramayana': {
    url: 'https://sacred-texts.com/hin/rama/rama.txt',
    command: 'curl https://sacred-texts.com/hin/rama/rama.txt > data/texts/eastern/ramayana_complete.txt'
  },
  'Upanishads': {
    url: 'https://sacred-texts.com/hin/upan.txt',
    command: 'curl https://sacred-texts.com/hin/upan.txt > data/texts/eastern/upanishads_complete.txt'
  },
  'Tao Te Ching': {
    url: 'https://sacred-texts.com/tao/ttc.txt',
    command: 'curl https://sacred-texts.com/tao/ttc.txt > data/texts/philosophy/tao_te_ching.txt'
  },
  'Buddhist Sutras': {
    url: 'https://sacred-texts.com/bud/index.htm',
    command: 'See website for individual sutras'
  }
};

Object.entries(sources).forEach(([name, info]) => {
  console.log(`📖 ${name}`);
  console.log(`   ${info.command}\n`);
});

// Function to format downloaded text
function formatText(title, content, category = 'general', translator = 'Unknown') {
  const formatted = `METADATA
========
Title: ${title}
Category: ${category}
Language: English
Translator: ${translator}
Source: Sacred Texts Archive / Project Gutenberg
---

${content}`;
  
  return formatted;
}

// Helper for manual formatting
console.log('📝 Format Converter\n');
console.log('After downloading, format your text file like this:\n');
console.log('METADATA');
console.log('========');
console.log('Title: [Book Name]');
console.log('Category: eastern|abrahamic|philosophy|other');
console.log('Translator: [Author/Translator Name]');
console.log('Language: English');
console.log('---');
console.log('[Book content here]\n');

console.log('Then place in: data/texts/[category]/[book_name].txt\n');

module.exports = { formatText };
