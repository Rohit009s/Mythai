# MythAI Multi-Model Pipeline Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Pipeline Components](#pipeline-components)
3. [Development Setup](#development-setup)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)

## Architecture Overview

The MythAI Multi-Model Pipeline implements a sophisticated two-stage LLM processing system that separates concerns between factual accuracy (Thinker) and emotional intelligence (Speaker).

### Key Design Principles

1. **Separation of Concerns**: Thinker handles data retrieval and analysis; Speaker handles humanization
2. **Context Preservation**: All relevant context flows through the pipeline without loss
3. **Graceful Degradation**: System falls back to single-stage processing if any component fails
4. **Performance Optimization**: Streaming and parallel processing where possible
5. **Modularity**: Each component can be tested, updated, or replaced independently

### System Flow

```
User Question
    ↓
[Intent Classification]
    ↓
[Thinker Model - Mistral 7B]
    ├─ Generate Embeddings
    ├─ Query Vector DB (Qdrant)
    ├─ Retrieve Sacred Texts
    ├─ Analyze & Extract References
    └─ Output Structured Data
    ↓
[Speaker Model - Llama 3.1 8B]
    ├─ Receive Structured Data
    ├─ Convert Complex → Simple
    ├─ Add Emotional Intelligence
    ├─ Apply Deity Personality
    └─ Output Humanized Response
    ↓
[ElevenLabs TTS]
    ├─ Apply Voice Settings
    ├─ Add Emotional Tone
    └─ Generate Audio
    ↓
Final Response (Text + Audio)
```

## Pipeline Components

### 1. Pipeline Orchestrator

**Location**: `server/lib/pipelineOrchestrator.js`

The main coordinator that manages the two-stage pipeline flow.

```javascript
const PipelineOrchestrator = require('../lib/pipelineOrchestrator');

const orchestrator = new PipelineOrchestrator({
  enableTTS: true,
  enableFallback: true,
  timeout: 30000,
  fallbackPipeline: customFallback
});

const result = await orchestrator.processTwoStage(userQuestion, context);
```

**Key Methods**:
- `processTwoStage(question, context)`: Main pipeline execution
- `runThinker(question, context)`: Execute Thinker stage
- `runSpeaker(thinkerOutput, context)`: Execute Speaker stage
- `generateTTS(text, context)`: Generate audio output
- `isAvailable()`: Check pipeline health
- `getStatus()`: Get detailed status information

### 2. Thinker Model Handler

**Location**: `server/lib/thinkerModel.js`

Handles the first stage of processing - data retrieval and analysis.

```javascript
const ThinkerModel = require('../lib/thinkerModel');

const thinker = new ThinkerModel({
  model: 'mistralai/Mistral-7B-Instruct-v0.2',
  temperature: 0.3,
  maxTokens: 1000
});

const result = await thinker.process(question, context);
```

**Responsibilities**:
- Generate embeddings for user questions
- Query Qdrant vector database
- Retrieve and rank sacred text passages
- Extract references (book, chapter, verse)
- Analyze scriptural relevance
- Output structured data for Speaker

### 3. Speaker Model Handler

**Location**: `server/lib/speakerModel.js`

Handles the second stage - humanization and emotional intelligence.

```javascript
const SpeakerModel = require('../lib/speakerModel');

const speaker = new SpeakerModel({
  model: 'meta-llama/Llama-3.1-8B-Instruct',
  temperature: 0.7,
  maxTokens: 1500
});

const result = await speaker.process(thinkerOutput, context);
```

**Responsibilities**:
- Convert complex scriptural language to simple terms
- Add emotional intelligence and warmth
- Apply deity personality traits
- Ensure perfect meaning preservation
- Generate final humanized response

### 4. Embeddings Generator

**Location**: `server/lib/embeddingsGenerator.js`

Generates consistent embeddings for text queries.

```javascript
const EmbeddingsGenerator = require('../lib/embeddingsGenerator');

const generator = new EmbeddingsGenerator({
  model: 'sentence-transformers/all-MiniLM-L6-v2',
  cacheSize: 1000
});

const embeddings = await generator.generate(text);
```

### 5. Enhanced Qdrant Client

**Location**: `server/lib/qdrantClient.js`

Provides advanced vector search capabilities with filtering.

```javascript
const { QdrantClient } = require('../lib/qdrantClient');

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});

const results = await client.searchSacredTexts(embeddings, {
  deityId: 'krishna',
  religion: 'hindu',
  language: 'en',
  topK: 5
});
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Qdrant (local or cloud)
- Python 3.8+ (for TTS services)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd mythai
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start required services**:
```bash
# MongoDB (if running locally)
mongod

# Qdrant (if running locally)
docker run -p 6333:6333 qdrant/qdrant

# TTS Service (optional)
cd tts-service
python app.py
```

5. **Initialize the database**:
```bash
npm run setup:db
```

6. **Start the development server**:
```bash
npm run dev
```

### Project Structure

```
mythai/
├── server/
│   ├── lib/
│   │   ├── pipelineOrchestrator.js    # Main pipeline coordinator
│   │   ├── thinkerModel.js            # Thinker stage handler
│   │   ├── speakerModel.js            # Speaker stage handler
│   │   ├── embeddingsGenerator.js     # Embedding generation
│   │   ├── qdrantClient.js            # Vector database client
│   │   ├── errorHandler.js            # Error handling
│   │   └── ...
│   ├── config/
│   │   ├── multiModelPipeline.js      # Pipeline configuration
│   │   ├── deityPersonalities.js     # Deity configurations
│   │   └── ...
│   ├── routes/
│   │   ├── chat-personalized.js      # Main chat endpoint
│   │   ├── mcp.js                     # MCP API routes
│   │   └── ...
│   └── __tests__/                     # Test files
├── mcp-server/
│   └── unified-mythai-server-complete.js  # MCP server
├── docs/                              # Documentation
├── data/                              # Sacred texts and personas
└── frontend/                          # React frontend
```

## Configuration

### Environment Variables

The system uses environment variables for configuration. Key variables include:

```bash
# Core Database
MONGO_URI=mongodb://localhost:27017/mythai
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key

# Model Configuration
HUGGINGFACE_API_TOKEN=your-hf-token
THINKER_MODEL=mistralai/Mistral-7B-Instruct-v0.2
SPEAKER_MODEL=meta-llama/Llama-3.1-8B-Instruct
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Pipeline Settings
ENABLE_TWO_STAGE_PIPELINE=true
PIPELINE_TOTAL_TIMEOUT=10000
MAX_CONCURRENT_REQUESTS=10

# TTS Configuration
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-elevenlabs-key

# Performance
EMBEDDING_CACHE_SIZE=1000
VECTOR_DB_TOP_K=5
```

### Pipeline Configuration

Edit `server/config/multiModelPipeline.js` to customize pipeline behavior:

```javascript
module.exports = {
  thinker: {
    model: 'mistralai/Mistral-7B-Instruct-v0.2',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 5000
  },
  speaker: {
    model: 'meta-llama/Llama-3.1-8B-Instruct',
    temperature: 0.7,
    maxTokens: 1500,
    timeout: 5000
  },
  pipeline: {
    enableTwoStage: true,
    enableFallback: true,
    maxRetries: 3,
    totalTimeout: 10000
  }
};
```

### Deity Configuration

Add new deities in `server/config/deityPersonalities.js`:

```javascript
module.exports = {
  newDeity: {
    name: "New Deity",
    tradition: "tradition_name",
    personality: {
      tone: "wise",
      style: "formal",
      traits: ["compassionate", "knowledgeable"]
    },
    voiceSettings: {
      voiceId: "voice_id",
      stability: 0.5,
      similarity: 0.75
    },
    books: ["Primary Book", "Secondary Book"]
  }
};
```

## Testing

### Unit Tests

Run unit tests for individual components:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- thinkerModel.test.js

# Run with coverage
npm run test:coverage
```

### Property-Based Tests

The system includes property-based tests for correctness validation:

```bash
# Run property tests
npm test -- --testNamePattern="Property"

# Run specific property test
npm test -- --testNamePattern="Two-Stage Pipeline Execution"
```

### Integration Tests

Test the complete pipeline flow:

```bash
# Run integration tests
npm test -- integration/

# Run end-to-end tests
npm test -- e2e/
```

### Manual Testing

Use the test scripts for manual validation:

```bash
# Test MCP server
node test-mcp-complete.js

# Test smart pipeline
node test-smart-pipeline.js

# Test error handling
node test-error-handler.js
```

## Deployment

### Production Environment

1. **Set production environment variables**:
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://...
QDRANT_URL=https://your-qdrant-cloud.com
```

2. **Build the application**:
```bash
npm run build
```

3. **Start the production server**:
```bash
npm start
```

### Docker Deployment

Use the provided Docker configuration:

```bash
# Build the image
docker build -t mythai .

# Run the container
docker run -p 3000:3000 --env-file .env mythai
```

### Cloud Deployment

#### AWS Deployment

1. **Deploy to AWS Lambda**:
```bash
npm run deploy:aws
```

2. **Set up API Gateway**:
- Configure routes for `/api/*`
- Enable CORS
- Set up authentication

#### Google Cloud Deployment

1. **Deploy to Cloud Run**:
```bash
gcloud run deploy mythai --source .
```

2. **Configure environment variables**:
```bash
gcloud run services update mythai --set-env-vars="MONGO_URI=..."
```

### Database Setup

#### MongoDB Atlas

1. Create a new cluster
2. Set up database user
3. Configure network access
4. Get connection string

#### Qdrant Cloud

1. Create a free account at qdrant.tech
2. Create a new collection
3. Get API key and URL
4. Upload embeddings

### Load Balancing

For high-traffic deployments:

```nginx
upstream mythai_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://mythai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Performance Metrics

The system tracks key performance indicators:

```javascript
// Access metrics via API
GET /api/metrics

// Response
{
  "pipeline": {
    "totalRequests": 1000,
    "averageResponseTime": 2500,
    "twoStageUsage": 0.75,
    "fallbackRate": 0.05
  },
  "models": {
    "thinker": {
      "averageTime": 1200,
      "successRate": 0.98
    },
    "speaker": {
      "averageTime": 1300,
      "successRate": 0.97
    }
  }
}
```

### Logging

Configure structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Checks

Implement comprehensive health checks:

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date(),
    services: {
      mongodb: await checkMongoDB(),
      qdrant: await checkQdrant(),
      pipeline: await checkPipeline(),
      tts: await checkTTS()
    }
  };
  
  const allHealthy = Object.values(health.services).every(s => s.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
});
```

### Alerting

Set up alerts for critical issues:

```javascript
// Alert on high error rate
if (errorRate > 0.05) {
  await sendAlert('High error rate detected', {
    errorRate,
    timestamp: new Date()
  });
}

// Alert on slow response times
if (averageResponseTime > 5000) {
  await sendAlert('Slow response times detected', {
    averageResponseTime,
    timestamp: new Date()
  });
}
```

## Troubleshooting

### Common Issues

#### Pipeline Failures

**Symptom**: Requests falling back to single-stage processing

**Diagnosis**:
```bash
# Check pipeline status
curl http://localhost:3000/api/chat/status

# Check logs
tail -f logs/combined.log | grep "Pipeline"
```

**Solutions**:
1. Verify Hugging Face API token
2. Check model availability
3. Increase timeout values
4. Monitor rate limits

#### Vector Search Issues

**Symptom**: No relevant results returned

**Diagnosis**:
```bash
# Test Qdrant connection
curl http://localhost:6333/collections/myth_texts_384

# Check embeddings
node scripts/test-embeddings.js
```

**Solutions**:
1. Verify Qdrant collection exists
2. Check embedding model consistency
3. Validate data ingestion
4. Adjust score thresholds

#### TTS Failures

**Symptom**: Audio generation fails

**Diagnosis**:
```bash
# Test TTS service
curl http://localhost:8000/health

# Check ElevenLabs API
curl -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices
```

**Solutions**:
1. Verify API keys
2. Check service availability
3. Validate voice IDs
4. Monitor usage limits

### Debug Mode

Enable debug logging:

```bash
LOG_DEBUG=true npm start
```

### Performance Profiling

Use built-in profiling tools:

```javascript
// Enable profiling
const profiler = require('./lib/profiler');

profiler.start('pipeline-execution');
const result = await orchestrator.processTwoStage(question, context);
profiler.end('pipeline-execution');
```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
```bash
git checkout -b feature/new-feature
```

3. **Make changes and add tests**
4. **Run the test suite**:
```bash
npm test
```

5. **Submit a pull request**

### Code Style

Follow the established code style:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Adding New Models

To add support for a new LLM:

1. **Create model handler**:
```javascript
// server/lib/newModel.js
class NewModel {
  constructor(config) {
    this.config = config;
  }
  
  async process(input, context) {
    // Implementation
  }
}
```

2. **Add configuration**:
```javascript
// server/config/multiModelPipeline.js
module.exports = {
  newModel: {
    model: 'provider/model-name',
    temperature: 0.5,
    maxTokens: 1000
  }
};
```

3. **Update orchestrator**:
```javascript
// server/lib/pipelineOrchestrator.js
const NewModel = require('./newModel');

// Add to constructor
this.newModel = new NewModel(config.newModel);
```

4. **Add tests**:
```javascript
// server/__tests__/newModel.test.js
describe('NewModel', () => {
  test('should process input correctly', async () => {
    // Test implementation
  });
});
```

### Documentation

Update documentation when making changes:

1. **API changes**: Update `docs/API_DOCUMENTATION.md`
2. **Configuration changes**: Update this guide
3. **New features**: Add to README.md
4. **Breaking changes**: Update CHANGELOG.md

### Testing Guidelines

1. **Write tests for new features**
2. **Maintain test coverage above 80%**
3. **Include property-based tests for correctness**
4. **Add integration tests for new endpoints**
5. **Update test documentation**

## Resources

### Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)

### External Resources
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [ElevenLabs API](https://docs.elevenlabs.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Server](https://discord.gg/your-server)
- [Developer Forum](https://forum.your-domain.com)

---

For additional help, please refer to the [troubleshooting guide](./TROUBLESHOOTING.md) or open an issue on GitHub.