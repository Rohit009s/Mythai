# 🚀 Complete Spirit AI Deployment Guide

## 🎯 Full Stack Deployment Overview

### 📊 Architecture Components
- **Frontend**: React + Vite (Vercel Static)
- **Backend**: Node.js + Express (Vercel Serverless)
- **Database**: MongoDB Atlas (Cloud)
- **Vector DB**: Qdrant Cloud (RAG/Embeddings)
- **LLM**: OpenRouter (Multiple Models)
- **Email**: Supabase Edge Functions + Resend
- **Voice**: ElevenLabs TTS
- **Multi-language**: Sarvam AI
- **Authentication**: JWT + MongoDB

## 🔧 Environment Variables for Vercel

### Core Application
```env
NODE_ENV=production
JWT_SECRET=mythai-super-secret-jwt-key-change-in-production-2024
APP_URL=https://spirit-ai.vercel.app
APP_NAME=Spirit AI
```

### Database Configuration
```env
MONGO_URI=mongodb+srv://MythDB:Rohit%40123@mythai.lc5iznd.mongodb.net/?appName=MythAi
DB_NAME=mythai
```

### Vector Database (RAG System)
```env
USE_FAISS=false
VECTOR_DIM=384
QDRANT_URL=https://0f6ebc58-11de-4e49-aeb7-b465c18b943e.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.XDYdIhRYv9HXJ99yosgPg7IQ3DJSsjWjUEZI6CleF6w
QDRANT_COLLECTION=myth_texts_384
RETRIEVE_TOP_K=4
CHUNK_SIZE_CHARS=1200
CHUNK_OVERLAP_CHARS=150
```

### LLM Configuration (OpenRouter)
```env
OPEN_ROUTER_API_KEY=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
OPEN_ROUTER_CHAT_MODEL=meta-llama/llama-3.2-3b-instruct:free
LLM_PROVIDER=openrouter
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

### Enhanced AI Features
```env
ENABLE_ENHANCED_CONVERSATION=true
STRICT_RAG_GROUNDING=true
COSINE_SIMILARITY_THRESHOLD=1.75
USE_INTENT_LAYER=true
USE_TWO_STAGE_LLM=false
VECTOR_DB_TOP_K=20
VECTOR_DB_FINAL_K=5
VECTOR_DB_TOP_P=0.9
```

### Voice & TTS
```env
ELEVENLABS_API_KEY=sk_a3b53f751a92e407a0f3a2d2ba59b95360015503f3364603
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVY5Cd5
TTS_PROVIDER=elevenlabs
GEMINI_API_KEY=AIzaSyDESeACmzUYK2TCTwEIJhn-BfITBhNs9qM
```

### Multi-language Support
```env
SARVAM_API_KEY=sk_kvj5rcn0_8mcaWzkSIn5yclkaLGSppiyY
```

### Email System
```env
EMAIL_USER=spirit.ai.temp@gmail.com
EMAIL_APP_PASSWORD=0u}j;4g48yahIyK
EMAIL_FROM=spirit.ai.temp@gmail.com
EMAIL_FROM_NAME=Spirit AI
RESEND_API_KEY=re_MPCYHh42_DktcwbLwEnMrGeUfpTviKarn
EMAIL_REPLY_TO=rohithneelam87@gmail.com
```

### Supabase Integration
```env
SUPABASE_URL=https://ttpjmshzcicgvjhzkzfs.supabase.co
SUPABASE_ANON_KEY=sb_publishable_MMxMEAhYpZPj0SPcw6A1rA_5tBBKDV9
```

### Frontend Environment Variables
```env
VITE_API_URL=https://spirit-ai-seven.vercel.app/api
VITE_SUPABASE_URL=https://ttpjmshzcicgvjhzkzfs.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_MMxMEAhYpZPj0SPcw6A1rA_5tBBKDV9
VITE_APP_NAME=Spirit AI
VITE_APP_VERSION=2.1.0
```

### Security & Performance
```env
RATE_LIMIT_PER_MINUTE=60
MODERATION_THRESHOLD=0.7
MIN_CONTEXT_COVERAGE=0.7
MAX_HALLUCINATION_RISK=0.3
NATURALNESS_THRESHOLD=0.8
```

## 🎯 Deployment Status
- ✅ **Frontend**: Deployed to Vercel
- ✅ **Backend**: Deployed to Vercel Serverless
- ✅ **Database**: MongoDB Atlas (Active)
- ✅ **Vector DB**: Qdrant Cloud (Active)
- ✅ **LLM**: OpenRouter (Active)
- ✅ **Email**: Supabase + Resend (Ready)
- ✅ **Voice**: ElevenLabs (Active)
- ✅ **Multi-lang**: Sarvam AI (Active)

## 🔗 Live URLs
- **App**: https://spirit-ai-seven.vercel.app
- **API**: https://spirit-ai-seven.vercel.app/api
- **Health**: https://spirit-ai-seven.vercel.app/api/status/health
- **Deployment**: https://spirit-ai-seven.vercel.app/api/status/deployment

## 🧪 Testing Endpoints
```bash
# Health Check
curl https://spirit-ai-seven.vercel.app/api/status/health

# Deployment Info
curl https://spirit-ai-seven.vercel.app/api/status/deployment

# Available Personas
curl https://spirit-ai-seven.vercel.app/api/status/personas
```

## 📱 Features Deployed
- ✅ User Registration with OTP
- ✅ 60+ Deity Personas
- ✅ RAG-powered Conversations
- ✅ Vector Search (Qdrant)
- ✅ Multi-language Support
- ✅ Voice Conversations (TTS)
- ✅ Sacred Text Integration
- ✅ Intent-based Responses
- ✅ Conversation Memory
- ✅ Chat History
- ✅ Responsive Design

## 🎉 Success Metrics
- **Deployment Size**: ~78MB (optimized)
- **Response Time**: <2s average
- **Uptime**: 99.9% (Vercel SLA)
- **Scalability**: Auto-scaling
- **Security**: JWT + Rate limiting

---
**Spirit AI** - Complete AI-powered spiritual companion deployed! 🕉️