#!/usr/bin/env node

const https = require('https');

const BACKEND_URL = 'https://spirit-ai-backend.onrender.com';
const FRONTEND_URL = 'https://spirit-ai-frontend.onrender.com';

console.log('🔍 Checking Spirit AI v2.1.0 Deployment Status...\n');

function checkUrl(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      
      if (status >= 200 && status < 300) {
        console.log(`✅ ${name}: Online (${status}) - ${responseTime}ms`);
        resolve(true);
      } else {
        console.log(`⚠️  ${name}: Issues (${status}) - ${responseTime}ms`);
        resolve(false);
      }
    }).on('error', (err) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${name}: Offline - ${responseTime}ms - ${err.message}`);
      resolve(false);
    });
  });
}

async function checkDeployment() {
  console.log('🌐 Checking Frontend...');
  const frontendStatus = await checkUrl(FRONTEND_URL, 'Frontend App');
  
  console.log('\n🔧 Checking Backend API...');
  const backendStatus = await checkUrl(`${BACKEND_URL}/api/health`, 'Backend Health');
  
  console.log('\n📊 Deployment Status Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (frontendStatus && backendStatus) {
    console.log('🎉 Status: FULLY OPERATIONAL');
    console.log('✨ New Features: GlowingShadow animations active');
    console.log('🚀 Ready for users!');
  } else if (frontendStatus || backendStatus) {
    console.log('⚠️  Status: PARTIALLY OPERATIONAL');
    console.log('🔄 Some services may still be starting up...');
  } else {
    console.log('❌ Status: DEPLOYMENT IN PROGRESS');
    console.log('⏳ Services are still deploying, please wait...');
  }
  
  console.log('\n🔗 Access URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend:  ${BACKEND_URL}`);
  console.log(`   API Docs: ${BACKEND_URL}/api`);
  
  console.log('\n📱 Features Available:');
  console.log('   • User Authentication & Registration');
  console.log('   • Multi-deity AI Conversations');
  console.log('   • Voice Interactions');
  console.log('   • Conversation Memory');
  console.log('   • Settings with GlowingShadow Animations');
  console.log('   • EtherealShadows Background Effects');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkDeployment().catch(console.error);