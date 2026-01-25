#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Render Deployment for Spirit AI v2.1.0');
console.log('📦 Enhanced with GlowingShadow animations and EtherealShadows background');

// Check if render.yaml exists
if (!fs.existsSync('render.yaml')) {
  console.error('❌ render.yaml not found. Please ensure the configuration file exists.');
  process.exit(1);
}

try {
  // Step 1: Install dependencies
  console.log('\n📋 Step 1: Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Step 2: Install server dependencies
  console.log('\n🔧 Step 2: Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  // Step 3: Install frontend dependencies
  console.log('\n🎨 Step 3: Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  // Step 4: Build frontend
  console.log('\n🏗️  Step 4: Building frontend with new animations...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  
  // Step 5: Verify build
  console.log('\n✅ Step 5: Verifying build...');
  const distPath = path.join(__dirname, 'frontend', 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Frontend build failed - dist directory not found');
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Frontend build failed - index.html not found');
  }
  
  console.log('✅ Build verification successful!');
  
  // Step 6: Display deployment information
  console.log('\n🌟 Deployment Ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 Application: Spirit AI v2.1.0');
  console.log('🎨 New Features:');
  console.log('   • GlowingShadow animations for Settings cards');
  console.log('   • EtherealShadows background with black/grey theme');
  console.log('   • Advanced CSS custom properties animations');
  console.log('   • Orbital glow effects with hue cycling');
  console.log('   • Enhanced liquid glass morphism');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n📋 Render Configuration:');
  console.log('   Backend: spirit-ai-backend (Node.js)');
  console.log('   Frontend: spirit-ai-frontend (Static Site)');
  console.log('   Build Command: cd frontend && npm install && npm run build');
  console.log('   Start Command: cd server && npm start');
  
  console.log('\n🔗 Next Steps:');
  console.log('1. Commit and push your changes to your Git repository');
  console.log('2. Go to https://render.com and connect your repository');
  console.log('3. Use the render.yaml file for automatic configuration');
  console.log('4. Deploy both backend and frontend services');
  
  console.log('\n🌐 Expected URLs after deployment:');
  console.log('   Backend API: https://spirit-ai-backend.onrender.com');
  console.log('   Frontend App: https://spirit-ai-frontend.onrender.com');
  
  console.log('\n✨ Deployment preparation completed successfully!');
  
} catch (error) {
  console.error('\n❌ Deployment preparation failed:', error.message);
  process.exit(1);
}