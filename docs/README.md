# MythAI Multi-Model Pipeline Documentation

Welcome to the comprehensive documentation for the MythAI Multi-Model Pipeline system. This documentation covers everything you need to know about deploying, configuring, and maintaining the system.

## 📚 Documentation Overview

### Core Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [API Documentation](./API_DOCUMENTATION.md) | Complete API reference with endpoints, request/response formats, and examples | Developers, Integrators |
| [Developer Guide](./DEVELOPER_GUIDE.md) | Comprehensive development guide covering architecture, setup, and contribution | Developers, Contributors |
| [Configuration Guide](./CONFIGURATION_GUIDE.md) | Complete configuration reference with all environment variables and settings | DevOps, System Administrators |
| [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment checklist for production environments | DevOps, Release Managers |
| [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md) | Visual system architecture diagrams and flow charts | Architects, Developers |

### Quick Start Guides

| Guide | Description | Time Required |
|-------|-------------|---------------|
| [Quick Start](../QUICK_START_MCP.md) | Get the system running locally in minutes | 15 minutes |
| [MCP Quick Reference](../MCP_QUICK_REFERENCE.md) | Quick reference for MCP tools and usage | 5 minutes |
| [Smart Pipeline Guide](../SMART_PIPELINE_GUIDE.md) | Understanding the intelligent routing system | 10 minutes |

## 🏗️ System Architecture

The MythAI Multi-Model Pipeline implements a sophisticated two-stage LLM processing system:

```
User Question → Intent Classification → Thinker Model → Speaker Model → Response
                                    ↓                ↓
                              Vector Search    Humanization
                              Scripture Analysis  Emotion Intelligence
```

### Key Components

1. **Thinker Model (Mistral 7B)**: Handles data retrieval and factual analysis
2. **Speaker Model (Llama 3.1 8B)**: Provides humanization and emotional intelligence
3. **Vector Database (Qdrant)**: Stores and searches sacred text embeddings
4. **MCP Server**: Provides modular access to all system capabilities
5. **TTS Integration**: Converts responses to natural-sounding speech

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Qdrant (local or cloud)
- Hugging Face API token
- ElevenLabs API key (optional, for TTS)

### Quick Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd mythai
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database URLs
   ```

3. **Start the system**:
   ```bash
   npm run dev
   ```

4. **Test the API**:
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"text": "What is dharma?", "persona": "krishna"}'
   ```

For detailed setup instructions, see the [Developer Guide](./DEVELOPER_GUIDE.md).

## 📖 API Usage

### Basic Chat Request

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-token>'
  },
  body: JSON.stringify({
    text: "What does the Gita say about duty?",
    persona: "krishna",
    audio: true,
    useTwoStage: true
  })
});

const result = await response.json();
console.log(result.reply.text);
console.log(`Processing time: ${result.reply.pipeline.timing.total}ms`);
```


```

For complete API documentation, see [API Documentation](./API_DOCUMENTATION.md).

## ⚙️ Configuration

### Essential Environment Variables

```bash
# Core Configuration
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/mythai
QDRANT_URL=https://your-cluster.qdrant.tech
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Pipeline Settings
ENABLE_TWO_STAGE_PIPELINE=true
THINKER_MODEL=mistralai/Mistral-7B-Instruct-v0.2
SPEAKER_MODEL=meta-llama/Llama-3.1-8B-Instruct

# TTS Configuration
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_your_key_here
```

For complete configuration options, see [Configuration Guide](./CONFIGURATION_GUIDE.md).




## 🚀 Deployment

### Production Deployment

1. **Prepare environment**:
   ```bash
   NODE_ENV=production
   # Set all production environment variables
   ```

2. **Deploy application**:
   ```bash
   npm run build
   npm start
   ```

3. **Verify deployment**:
   ```bash
   curl http://your-domain.com/health
   curl http://your-domain.com/api/chat/status
   ```

For complete deployment instructions, see [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md).

## 📊 Monitoring

### Key Metrics to Monitor

- **Response Times**: < 10 seconds for 90% of requests
- **Error Rates**: < 5% overall error rate
- **Pipeline Usage**: Two-stage vs single-stage usage
- **Fallback Rate**: < 10% fallback usage
- **Resource Usage**: CPU, memory, database connections

### Health Check Endpoints

```bash
# Application health
GET /health

# Pipeline status
GET /api/chat/status

# MCP server status
GET /api/mcp/status
```

## 🔧 Troubleshooting

### Common Issues

1. **Pipeline not working**:
   - Check `ENABLE_TWO_STAGE_PIPELINE=true`
   - Verify Hugging Face API token
   - Check model availability

2. **Slow responses**:
   - Increase timeout values
   - Check network connectivity
   - Monitor API rate limits

3. **High error rates**:
   - Check API quotas
   - Verify database connections
   - Review error logs

### Debug Mode

```bash
LOG_DEBUG=true npm start
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Run the test suite
5. Submit a pull request

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run all checks
npm run check
```

For detailed contribution guidelines, see [Developer Guide](./DEVELOPER_GUIDE.md).

## 📋 Feature Comparison

### Processing Modes

| Feature | Single-Stage | Two-Stage | Benefits |
|---------|-------------|-----------|----------|
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡ Moderate | Single-stage is faster |
| **Accuracy** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | Two-stage more accurate |
| **Emotional Intelligence** | ⭐⭐ Basic | ⭐⭐⭐⭐⭐ Advanced | Two-stage more empathetic |
| **Cost** | $ Lower | $$ Higher | Single-stage more economical |
| **Complexity** | Simple | Advanced | Two-stage more sophisticated |

### TTS Providers

| Provider | Quality | Cost | Languages | Emotions |
|----------|---------|------|-----------|----------|
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | $$$ | 29+ | ✅ Advanced |
| **Google TTS** | ⭐⭐⭐⭐ | $ | 40+ | ⭐ Basic |
| **Coqui TTS** | ⭐⭐⭐ | Free | 10+ | ⭐ Basic |

## 📈 Performance Benchmarks

### Response Times (90th percentile)

- **Small Talk**: 1.5 seconds
- **Scripture Questions**: 8-10 seconds
- **Personal Support**: 7-9 seconds
- **TTS Generation**: +2-3 seconds

### Throughput

- **Single Instance**: 10-20 requests/minute
- **Load Balanced**: 100+ requests/minute
- **With Caching**: 200+ requests/minute

## 🔐 Security

### Security Features

- JWT-based authentication
- Rate limiting (60 requests/minute)
- Input validation and sanitization
- HTTPS enforcement
- API key encryption
- Audit logging

### Security Best Practices

1. Use strong JWT secrets
2. Rotate API keys regularly
3. Enable HTTPS in production
4. Monitor for suspicious activity
5. Keep dependencies updated

## 📞 Support

### Getting Help

1. **Documentation**: Check this documentation first
2. **GitHub Issues**: Report bugs and request features
3. **Discussions**: Ask questions and share ideas
4. **Discord**: Real-time community support

### Reporting Issues

When reporting issues, please include:

- System information (OS, Node.js version)
- Configuration details (sanitized)
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

## 📄 License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- **Hugging Face** for providing excellent model inference APIs
- **Qdrant** for the powerful vector database
- **ElevenLabs** for high-quality text-to-speech
- **MongoDB** for reliable data storage
- **Open Source Community** for the amazing tools and libraries

---


---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Maintainers**: MythAI Development Team

For the most up-to-date information, please check the [GitHub repository](https://github.com/your-repo).
