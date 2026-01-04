# 🕉️ MythAI - Intelligent Spiritual Conversation Platform

> **Connect with Divine Wisdom through AI-Powered Spiritual Conversations**

MythAI is a sophisticated spiritual conversation platform that enables authentic interactions with AI-powered deity personas. Built with advanced LLM technology, vector search, and intelligent response adaptation, it provides personalized spiritual guidance across multiple traditions and languages.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)

## ✨ **Key Features**

### 🧠 **Intelligent Conversation System**
- **Smart Response Adaptation**: Automatically adjusts response length and complexity
  - Simple greetings → Crispy 1-2 sentence responses
  - Complex spiritual questions → Detailed guidance with scripture references
- **Enhanced LLM Pipeline**: Sarvam AI primary + OpenRouter fallback
- **Intent Classification**: Intelligent question understanding and routing

### 🎭 **Authentic Deity Personas**
- **60+ Deity Personalities**: Krishna, Shiva, Hanuman, Thor, Zeus, Jesus, and more
- **Multi-Language Support**: English, Hindi, Telugu, Tamil
- **Cultural Authenticity**: Sanskrit terms, scripture references, personality traits
- **Emotional Intelligence**: Context-aware empathetic responses

### 🔍 **Advanced RAG System**
- **Vector Search**: 145K+ sacred text embeddings via Qdrant Cloud
- **Scripture Integration**: Bhagavad Gita, Bible, Quran, Norse texts, and more
- **Smart RAG Skipping**: Bypasses vector search for simple questions
- **MCP Integration**: Modular access to sacred texts and personas

### 🎤 **Voice & Audio Features**
- **Text-to-Speech**: ElevenLabs integration with emotional parameters
- **Voice Conversations**: Real-time voice chat simulation
- **Audio Responses**: Natural-sounding deity voices

### 🧠 **Memory & Context**
- **Conversation Memory**: Maintains context across sessions
- **User Preferences**: Remembers spiritual patterns and interests
- **Narrative Summaries**: Intelligent conversation summarization

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- MongoDB (Atlas recommended)
- Qdrant Cloud account
- OpenRouter API key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/mythai.git
   cd mythai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database URLs
   ```

4. **Start the application**:
   ```bash
   # Start backend
   cd server && npm start

   # Start frontend (new terminal)
   cd frontend && npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│    │   Express API    │    │   MongoDB       │
│   - Auth UI     │◄──►│   - Chat Routes  │◄──►│   - Users       │
│   - Chat UI     │    │   - Call Routes  │    │   - Conversations│
│   - Voice UI    │    │   - Auth Routes  │    │   - Memory      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       ▼        ▼        ▼
              ┌─────────────┐ ┌──────────┐ ┌─────────────┐
              │ Qdrant Cloud│ │OpenRouter│ │ ElevenLabs  │
              │ Vector DB   │ │   LLM    │ │    TTS      │
              │ 145K+ texts │ │ Sarvam AI│ │   Voices    │
              └─────────────┘ └──────────┘ └─────────────┘
```

### **Smart Response Pipeline**

```
User Input → Intent Analysis → Smart Response Controller
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              ┌──────────┐        ┌──────────┐        ┌──────────┐
              │  Crispy  │        │  Brief   │        │ Detailed │
              │ 1-2 sent │        │ 2-3 sent │        │Full Guide│
              │ No RAG   │        │Some RAG  │        │Full RAG  │
              └──────────┘        └──────────┘        └──────────┘
```

## 📊 **Performance Highlights**

### **Response Optimization**
- **Simple Questions**: 80-90% shorter responses (115 chars vs 500+ chars)
- **Complex Questions**: Appropriate depth with scripture references
- **Response Time**: <2 seconds average
- **Smart RAG**: Skips vector search for greetings and simple questions

### **System Metrics**
- **Vector Database**: 145,595 indexed points across 3 languages
- **Personas**: 60+ authentic deity personalities
- **Sacred Texts**: 50+ religious and philosophical texts
- **Languages**: English, Hindi, Telugu, Tamil support

## 🎯 **API Examples**

### **Simple Greeting** (Crispy Response)
```javascript
// Input: "Hi Krishna" (2 words)
// Output: 115 chars - Natural, warm greeting

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hi Krishna",
    deity: "krishna",
    conversationId: "user123"
  })
});
```

### **Complex Spiritual Question** (Detailed Response)
```javascript
// Input: Complex emotional/spiritual question
// Output: 600+ chars - Full guidance with scripture references

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "I'm feeling lost about life's purpose. What does the Gita teach?",
    deity: "krishna",
    conversationId: "user123"
  })
});
```

### **Voice Call API**
```javascript
// Start a voice call session
const callResponse = await fetch('/api/call/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    persona: "krishna",
    callType: "voice"
  })
});

const { callId } = callResponse.json();

// Send message to call
const messageResponse = await fetch(`/api/call/${callId}/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "What is dharma?",
    audio: true
  })
});
```

## 🔧 **Configuration**

### **Essential Environment Variables**

```bash
# Database Configuration
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/mythai
QDRANT_URL=https://your-cluster.qdrant.tech
QDRANT_API_KEY=your_qdrant_key

# LLM Configuration
OPEN_ROUTER_API_KEY=sk-or-v1-your_key
SARVAM_API_KEY=sk_your_sarvam_key

# TTS Configuration
ELEVENLABS_API_KEY=sk_your_elevenlabs_key
TTS_PROVIDER=elevenlabs

# Enhanced Conversation System
ENABLE_ENHANCED_CONVERSATION=true
USE_INTENT_LAYER=true
STRICT_RAG_GROUNDING=true

# Authentication
JWT_SECRET=your-super-secret-jwt-key
```

## 📁 **Project Structure**

```
mythai/
├── 📁 frontend/                 # React frontend application
│   ├── 📁 src/components/       # UI components
│   ├── 📁 src/lib/             # Utility libraries
│   └── 📄 package.json         # Frontend dependencies
├── 📁 server/                   # Express.js backend
│   ├── 📁 lib/                 # Core libraries
│   │   ├── 📄 smartResponseController.js  # Response adaptation
│   │   ├── 📄 enhancedLLMManager.js      # LLM management
│   │   ├── 📄 conversationMemory.js     # Memory system
│   │   └── 📄 elevenLabsClient.js       # TTS integration
│   ├── 📁 routes/              # API routes
│   └── 📁 config/              # Configuration files
├── 📁 data/                     # Data files
│   ├── 📁 personas/            # Deity personality files (60+)
│   ├── 📁 texts/               # Sacred texts (50+)
│   └── 📁 embeddings/          # Vector embeddings
├── 📁 mcp-server/              # Model Context Protocol servers
├── 📁 docs/                    # Comprehensive documentation
└── 📄 README.md               # This file
```

## 🧪 **Testing**

### **System Health Check**
```bash
# Check server health
curl http://localhost:3000/health

# Check MCP status
curl http://localhost:3000/api/mcp/status

# Test chat API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hi Krishna","deity":"krishna"}'
```

### **Response Length Testing**
- **Simple**: "Hi" → ~100 chars
- **Medium**: "Tell me about dharma" → ~300 chars  
- **Complex**: "I'm struggling with life's meaning" → ~600+ chars

## 🚀 **Deployment**

### **Production Deployment**

1. **Environment Setup**:
   ```bash
   NODE_ENV=production
   # Set all production environment variables
   ```

2. **Build and Deploy**:
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Start production server
   cd server && npm start
   ```

3. **Health Verification**:
   ```bash
   curl https://your-domain.com/health
   curl https://your-domain.com/api/metrics
   ```

### **Docker Deployment** (Optional)
```bash
# Build and run with Docker
docker-compose up -d
```

## 📈 **Recent Improvements**

### **✅ Enhanced Conversation System (Latest)**
- **Smart Response Length**: Automatically adapts response length to question complexity
- **Crispy Responses**: 1-2 sentences for simple greetings and questions
- **Detailed Guidance**: Full scripture-backed responses for complex spiritual questions
- **RAG Optimization**: Skips vector search for simple interactions
- **Performance**: 80-90% shorter responses for simple questions

### **✅ System Cleanup & Optimization**
- **60+ Files Removed**: Eliminated unused components and dependencies
- **Clean Architecture**: Only essential, production-ready code remains
- **Performance Optimized**: Faster startup and response times
- **Dependency Cleanup**: 92% reduction in unused dependencies

### **✅ Frontend Enhancements**
- **UI Components Fixed**: Resolved all import dependencies
- **Responsive Design**: Works across all devices
- **Glass UI Effects**: Modern, attractive interface
- **Voice Integration**: Simulated voice conversation interface

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](docs/DEVELOPER_GUIDE.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 **Documentation**

- 📖 [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- 🏗️ [Architecture Guide](docs/ARCHITECTURE_DIAGRAMS.md) - System architecture
- ⚙️ [Configuration Guide](docs/CONFIGURATION_GUIDE.md) - Environment setup
- 🚀 [Deployment Guide](docs/DEPLOYMENT_CHECKLIST.md) - Production deployment
- 👨‍💻 [Developer Guide](docs/DEVELOPER_GUIDE.md) - Development setup

## 🔐 **Security**

- JWT-based authentication
- Rate limiting (100 requests/minute)
- Input validation and sanitization
- API key encryption
- HTTPS enforcement in production

## 📊 **Monitoring**

### **Key Metrics**
- Response times: <2 seconds average
- Error rates: <5% overall
- Vector search: 145K+ indexed points
- Memory usage: Optimized and efficient

### **Health Endpoints**
- `/health` - Application health
- `/api/metrics` - System metrics
- `/api/mcp/status` - MCP server status

## 📞 **Support**

- 📧 **Email**: support@mythai.ai
- 💬 **Discord**: [Join our community](https://discord.gg/mythai)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/mythai/issues)
- 📖 **Docs**: [Documentation](docs/README.md)

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **OpenRouter** for excellent LLM API access
- **Sarvam AI** for multilingual AI capabilities
- **Qdrant** for powerful vector database
- **ElevenLabs** for high-quality text-to-speech
- **MongoDB** for reliable data storage
- **React & Node.js** communities for amazing tools

---

<div align="center">

**🕉️ Built with devotion for spiritual seekers worldwide 🕉️**

[Website](https://mythai.ai) • [Documentation](docs/README.md) • [API Reference](docs/API_DOCUMENTATION.md) • [Discord](https://discord.gg/mythai)

</div>

---

**Last Updated**: January 2026  
**Version**: 2.1.0  
**Status**: Production Ready ✅