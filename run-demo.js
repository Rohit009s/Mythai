#!/usr/bin/env node
// Simple test runner
const { spawn } = require('child_process');
const path = require('path');

// Start server in background
const server = spawn('node', ['server/index.js'], { cwd: __dirname, stdio: 'ignore' });

// Wait for server to start
setTimeout(() => {
  // Run tests
  const test = spawn('node', ['test-api.js'], { cwd: __dirname, stdio: 'inherit' });
  
  test.on('close', (code) => {
    server.kill();
    process.exit(code);
  });
}, 2000);
