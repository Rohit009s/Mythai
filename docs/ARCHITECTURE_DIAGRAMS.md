# MythAI System Architecture Diagrams

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Frontend]
        API_CLIENT[API Client]
        MOBILE[Mobile App]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx Load Balancer]
        AUTH[Authentication Middleware]
        RATE[Rate Limiting]
    end
    
    subgraph "Application Layer"
        CHAT[Chat API]
        MCP_API[MCP API]
        CONV[Conversations API]
    end
    
    subgraph "Multi-Model Pipeline"
        ORCHESTRATOR[Pipeline Orchestrator]
        THINKER[Thinker Model<br/>Mistral 7B]
        SPEAKER[Speaker Model<br/>Llama 3.1 8B]
        EMBEDDINGS[Embeddings Generator<br/>MiniLM-L6-v2]
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB<br/>User Data & Conversations)]
        QDRANT[(Qdrant<br/>Vector Database)]
        TEXTS[Sacred Texts<br/>File System]
    end
    
    subgraph "External Services"
        HF[Hugging Face<br/>Inference API]
        ELEVENLABS[ElevenLabs<br/>TTS Service]
        TTS_LOCAL[Local TTS<br/>Service]
    end
    
    WEB --> NGINX
    API_CLIENT --> NGINX
    MOBILE --> NGINX
    
    NGINX --> AUTH
    AUTH --> RATE
    RATE --> CHAT
    RATE --> MCP_API
    RATE --> CONV
    
    CHAT --> ORCHESTRATOR
    MCP_API --> ORCHESTRATOR
    
    ORCHESTRATOR --> THINKER
    ORCHESTRATOR --> SPEAKER
    ORCHESTRATOR --> EMBEDDINGS
    
    THINKER --> HF
    SPEAKER --> HF
    EMBEDDINGS --> HF
    
    ORCHESTRATOR --> ELEVENLABS
    ORCHESTRATOR --> TTS_LOCAL
    
    CHAT --> MONGO
    CONV --> MONGO
    
    EMBEDDINGS --> QDRANT
    THINKER --> QDRANT
    
    QDRANT --> TEXTS
```

## Two-Stage Pipeline Flow

```mermaid
sequenceDiagram
    participant User
    participant API as Chat API
    participant Orch as Pipeline Orchestrator
    participant Think as Thinker Model
    participant Embed as Embeddings Generator
    participant VDB as Vector Database
    participant Speak as Speaker Model
    participant TTS as TTS Service
    
    User->>API: POST /api/chat
    API->>Orch: processTwoStage(question, context)
    
    Note over Orch: Stage 1: Thinker Processing
    Orch->>Think: process(question, context)
    Think->>Embed: generate(question)
    Embed-->>Think: embeddings[384]
    Think->>VDB: search(embeddings, filters)
    VDB-->>Think: passages[]
    Think->>Think: analyzeRelevance(passages)
    Think->>Think: extractReferences(passages)
    Think-->>Orch: ThinkerOutput{factual, quotes, refs}
    
    Note over Orch: Stage 2: Speaker Processing
    Orch->>Speak: process(thinkerOutput, context)
    Speak->>Speak: loadPersonality(deityId)
    Speak->>Speak: analyzeEmotion(question)
    Speak->>Speak: simplifyText(quotes)
    Speak->>Speak: humanizeResponse(factual)
    Speak-->>Orch: SpeakerOutput{response, emotion}
    
    Note over Orch: Stage 3: TTS (Optional)
    Orch->>TTS: generateSpeech(response, emotion)
    TTS-->>Orch: audioBuffer
    
    Orch-->>API: PipelineResult{text, audio, metadata}
    API-->>User: Response with timing & metadata
```## C
omponent Architecture

```mermaid
graph LR
    subgraph "Pipeline Orchestrator"
        PO[Pipeline Orchestrator]
        EH[Error Handler]
        FB[Fallback Logic]
        METRICS[Metrics Collector]
    end
    
    subgraph "Thinker Stage"
        TM[Thinker Model]
        EG[Embeddings Generator]
        QC[Qdrant Client]
        RE[Reference Extractor]
    end
    
    subgraph "Speaker Stage"
        SM[Speaker Model]
        PM[Personality Matcher]
        TC[Text Complexity Analyzer]
        FE[Fact Extractor]
    end
    
    subgraph "Support Services"
        CM[Configuration Manager]
        RQ[Request Queue]
        CC[Cache Manager]
        SP[Streaming Pipeline]
    end
    
    PO --> TM
    PO --> SM
    PO --> EH
    PO --> METRICS
    
    TM --> EG
    TM --> QC
    TM --> RE
    
    SM --> PM
    SM --> TC
    SM --> FE
    
    PO --> CM
    PO --> RQ
    EG --> CC
    PO --> SP
    
    EH --> FB
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Input Processing"
        UQ[User Question]
        IC[Intent Classification]
        EC[Emotion Classification]
    end
    
    subgraph "Context Building"
        UP[User Profile]
        CH[Conversation History]
        DP[Deity Personality]
        BM[Book Mapping]
    end
    
    subgraph "Vector Search"
        EMB[Generate Embeddings]
        VS[Vector Search]
        RF[Result Filtering]
        RR[Result Ranking]
    end
    
    subgraph "Response Generation"
        FA[Factual Analysis]
        RG[Response Generation]
        HU[Humanization]
        PA[Personality Application]
    end
    
    subgraph "Output Processing"
        TR[Text Response]
        AR[Audio Response]
        MR[Metadata Response]
        PS[Persistence]
    end
    
    UQ --> IC
    IC --> EC
    
    UP --> BM
    CH --> DP
    
    UQ --> EMB
    EMB --> VS
    VS --> RF
    RF --> RR
    
    RR --> FA
    FA --> RG
    RG --> HU
    HU --> PA
    
    PA --> TR
    TR --> AR
    AR --> MR
    MR --> PS
    
    DP --> PA
    BM --> RF
```

## MCP Server Architecture

```mermaid
graph TB
    subgraph "MCP Server"
        MCP[MCP Server Core]
        TH[Tool Handlers]
        SC[Schema Validation]
        ER[Error Handling]
    end
    
    subgraph "Tool Categories"
        subgraph "Category A: Data"
            GUP[get_user_profile]
            SM[save_message]
            GCC[get_conversation_context]
        end
        
        subgraph "Category B: RAG"
            ETM[embed_text_minilm]
            SSQ[search_scriptures_qdrant]
            SSBT[search_scriptures_by_text]
        end
        
        subgraph "Category C: Classification"
            CIAE[classify_intent_and_emotion]
        end
        
        subgraph "Category D: Generation"
            DAM[draft_answer_mistral]
            HWL[humanize_with_llama]
        end
        
        subgraph "Category E: Simple"
            STL[small_talk_llm]
        end
        
        subgraph "Category F: TTS"
            TTE[tts_elevenlabs]
        end
    end
    
    subgraph "External Connections"
        MONGO[(MongoDB)]
        QDRANT[(Qdrant)]
        HF[Hugging Face API]
        EL[ElevenLabs API]
    end
    
    MCP --> TH
    TH --> SC
    SC --> ER
    
    TH --> GUP
    TH --> SM
    TH --> GCC
    TH --> ETM
    TH --> SSQ
    TH --> SSBT
    TH --> CIAE
    TH --> DAM
    TH --> HWL
    TH --> STL
    TH --> TTE
    
    GUP --> MONGO
    SM --> MONGO
    GCC --> MONGO
    
    ETM --> HF
    DAM --> HF
    HWL --> HF
    STL --> HF
    
    SSQ --> QDRANT
    SSBT --> QDRANT
    
    TTE --> EL
```

## Error Handling & Fallback Flow

```mermaid
graph TD
    START[Request Start]
    
    subgraph "Pipeline Execution"
        THINKER[Thinker Stage]
        SPEAKER[Speaker Stage]
        TTS[TTS Stage]
    end
    
    subgraph "Error Detection"
        TE[Thinker Error?]
        SE[Speaker Error?]
        TTSE[TTS Error?]
    end
    
    subgraph "Fallback Strategies"
        SINGLE[Single-Stage Fallback]
        THINKER_ONLY[Thinker-Only Response]
        TEXT_ONLY[Text-Only Response]
    end
    
    subgraph "Recovery Actions"
        RETRY[Retry with Backoff]
        CACHE[Use Cached Response]
        DEFAULT[Default Response]
    end
    
    START --> THINKER
    THINKER --> TE
    
    TE -->|No Error| SPEAKER
    TE -->|Error| RETRY
    RETRY -->|Max Retries| SINGLE
    RETRY -->|Success| SPEAKER
    
    SPEAKER --> SE
    SE -->|No Error| TTS
    SE -->|Error| THINKER_ONLY
    
    TTS --> TTSE
    TTSE -->|No Error| SUCCESS[Success Response]
    TTSE -->|Error| TEXT_ONLY
    
    SINGLE --> SUCCESS
    THINKER_ONLY --> SUCCESS
    TEXT_ONLY --> SUCCESS
    
    CACHE --> SUCCESS
    DEFAULT --> SUCCESS
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx Load Balancer]
        SSL[SSL Termination]
    end
    
    subgraph "Application Instances"
        APP1[App Instance 1<br/>Port 3000]
        APP2[App Instance 2<br/>Port 3001]
        APP3[App Instance 3<br/>Port 3002]
    end
    
    subgraph "MCP Servers"
        MCP1[MCP Server 1]
        MCP2[MCP Server 2]
    end
    
    subgraph "Databases"
        MONGO_PRIMARY[(MongoDB Primary)]
        MONGO_SECONDARY[(MongoDB Secondary)]
        QDRANT_CLUSTER[(Qdrant Cluster)]
    end
    
    subgraph "External Services"
        HF_API[Hugging Face API]
        ELEVENLABS_API[ElevenLabs API]
        CDN[CDN for Static Assets]
    end
    
    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ALERTS[Alert Manager]
    end
    
    LB --> SSL
    SSL --> APP1
    SSL --> APP2
    SSL --> APP3
    
    APP1 --> MCP1
    APP2 --> MCP1
    APP3 --> MCP2
    
    APP1 --> MONGO_PRIMARY
    APP2 --> MONGO_PRIMARY
    APP3 --> MONGO_PRIMARY
    
    MONGO_PRIMARY --> MONGO_SECONDARY
    
    MCP1 --> QDRANT_CLUSTER
    MCP2 --> QDRANT_CLUSTER
    
    MCP1 --> HF_API
    MCP2 --> HF_API
    
    MCP1 --> ELEVENLABS_API
    MCP2 --> ELEVENLABS_API
    
    APP1 --> PROMETHEUS
    APP2 --> PROMETHEUS
    APP3 --> PROMETHEUS
    
    PROMETHEUS --> GRAFANA
    PROMETHEUS --> ALERTS
```

## Performance Monitoring Flow

```mermaid
graph LR
    subgraph "Request Processing"
        REQ[Incoming Request]
        TIMER[Start Timer]
        PROCESS[Process Request]
        RESPONSE[Send Response]
    end
    
    subgraph "Metrics Collection"
        TIMING[Timing Metrics]
        ERRORS[Error Metrics]
        USAGE[Usage Metrics]
        PERFORMANCE[Performance Metrics]
    end
    
    subgraph "Storage & Analysis"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana Dashboard]
        ALERTS[Alert Rules]
    end
    
    subgraph "Actions"
        SCALE[Auto Scaling]
        FALLBACK[Fallback Activation]
        NOTIFICATION[Admin Notification]
    end
    
    REQ --> TIMER
    TIMER --> PROCESS
    PROCESS --> RESPONSE
    
    PROCESS --> TIMING
    PROCESS --> ERRORS
    PROCESS --> USAGE
    PROCESS --> PERFORMANCE
    
    TIMING --> PROMETHEUS
    ERRORS --> PROMETHEUS
    USAGE --> PROMETHEUS
    PERFORMANCE --> PROMETHEUS
    
    PROMETHEUS --> GRAFANA
    PROMETHEUS --> ALERTS
    
    ALERTS --> SCALE
    ALERTS --> FALLBACK
    ALERTS --> NOTIFICATION
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[HTTPS/TLS 1.3]
        CORS[CORS Policy]
        CSP[Content Security Policy]
    end
    
    subgraph "API Security"
        JWT[JWT Authentication]
        RATE_LIMIT[Rate Limiting]
        INPUT_VAL[Input Validation]
        SANITIZE[Data Sanitization]
    end
    
    subgraph "Data Security"
        ENCRYPT[Data Encryption at Rest]
        TRANSIT[Encryption in Transit]
        BACKUP[Encrypted Backups]
        ACCESS[Access Controls]
    end
    
    subgraph "Infrastructure Security"
        FIREWALL[Firewall Rules]
        VPC[Virtual Private Cloud]
        SECRETS[Secret Management]
        AUDIT[Audit Logging]
    end
    
    subgraph "Monitoring Security"
        INTRUSION[Intrusion Detection]
        ANOMALY[Anomaly Detection]
        THREAT[Threat Intelligence]
        INCIDENT[Incident Response]
    end
    
    HTTPS --> JWT
    CORS --> RATE_LIMIT
    CSP --> INPUT_VAL
    
    JWT --> ENCRYPT
    RATE_LIMIT --> TRANSIT
    INPUT_VAL --> BACKUP
    SANITIZE --> ACCESS
    
    ENCRYPT --> FIREWALL
    TRANSIT --> VPC
    BACKUP --> SECRETS
    ACCESS --> AUDIT
    
    FIREWALL --> INTRUSION
    VPC --> ANOMALY
    SECRETS --> THREAT
    AUDIT --> INCIDENT
```

## Configuration Management

```mermaid
graph TD
    subgraph "Configuration Sources"
        ENV[Environment Variables]
        CONFIG_FILES[Configuration Files]
        SECRETS[Secret Store]
        DEFAULTS[Default Values]
    end
    
    subgraph "Configuration Manager"
        LOADER[Config Loader]
        VALIDATOR[Config Validator]
        MERGER[Config Merger]
        WATCHER[Config Watcher]
    end
    
    subgraph "Application Components"
        PIPELINE[Pipeline Config]
        DATABASE[Database Config]
        TTS_CONFIG[TTS Config]
        MONITORING_CONFIG[Monitoring Config]
    end
    
    subgraph "Hot Reload"
        CHANGE_DETECT[Change Detection]
        VALIDATION[Validation]
        APPLY[Apply Changes]
        NOTIFY[Notify Components]
    end
    
    ENV --> LOADER
    CONFIG_FILES --> LOADER
    SECRETS --> LOADER
    DEFAULTS --> LOADER
    
    LOADER --> VALIDATOR
    VALIDATOR --> MERGER
    MERGER --> WATCHER
    
    MERGER --> PIPELINE
    MERGER --> DATABASE
    MERGER --> TTS_CONFIG
    MERGER --> MONITORING_CONFIG
    
    WATCHER --> CHANGE_DETECT
    CHANGE_DETECT --> VALIDATION
    VALIDATION --> APPLY
    APPLY --> NOTIFY
    
    NOTIFY --> PIPELINE
    NOTIFY --> DATABASE
    NOTIFY --> TTS_CONFIG
    NOTIFY --> MONITORING_CONFIG
```

## Legend

- **Rectangles**: Services/Components
- **Cylinders**: Databases/Storage
- **Diamonds**: Decision Points
- **Circles**: Start/End Points
- **Arrows**: Data/Control Flow
- **Subgraphs**: Logical Groupings

## Notes

1. **Scalability**: The architecture supports horizontal scaling of application instances
2. **Reliability**: Multiple fallback mechanisms ensure system availability
3. **Performance**: Caching and streaming optimize response times
4. **Security**: Multiple layers of security protect data and access
5. **Monitoring**: Comprehensive monitoring enables proactive issue resolution
6. **Flexibility**: Modular design allows easy component replacement and updates