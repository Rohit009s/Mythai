# 🚀 MythAI - Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB connection (already configured in .env)
- Embeddings files in `data/embeddings/` folder

## Start the Application

### 1. Start Backend Server
```bash
node server/index.js
```
This will:
- Load 28,482 embeddings (English, Hindi, Telugu)
- Connect to MongoDB
- Start server on port 3000
- Initialize MCP servers
- Load all 55+ deity personas

### 2. Start Frontend (in a new terminal)
```bash
cd frontend
npm run dev
```
This will:
- Start Vite development server
- Open on http://localhost:5173

## That's It! 🎉

Open your browser to: **http://localhost:5173**

## Features Available

✅ **Religion-Based Access Control**
- Hindu users → Hindu deities only
- Muslim users → Prophet Muhammad only
- Christian users → Jesus, Mary only
- Guest users → All deities

✅ **55+ Deity Personas**
- Hindu: Krishna, Shiva, Vishnu, Rama, Hanuman, Ganesha, Lakshmi, Saraswati, Durga
- Muslim: Prophet Muhammad
- Christian: Jesus, Mary
- Greek: Zeus, Athena, Apollo, Poseidon, Hera
- Norse: Odin, Thor, Loki, Freyja
- Egyptian: Ra, Isis, Anubis
- And more...

✅ **28,482 Embeddings**
- 14,088 English chunks (including Quran 8,085 chunks)
- 11,014 Hindi chunks
- 3,380 Telugu chunks

✅ **Smart Features**
- Intent-based responses
- Sacred text references
- Multilingual support
- Authentication system
- Guest mode

## Troubleshooting

### Backend won't start?
- Check if MongoDB connection string is correct in `.env`
- Ensure embeddings files exist in `data/embeddings/`

### Frontend won't start?
- Run `npm install` in the frontend directory first
- Check if port 5173 is available

### No responses from deities?
- Check if backend is running on port 3000
- Look at backend console for errors

## Environment Variables

The `.env` file contains:
- MongoDB connection
- OpenRouter API key (FREE)
- Qdrant Cloud credentials
- Other configuration

**Note**: Never commit `.env` to Git (it's in .gitignore)

---

**That's all you need! Just two commands and you're running!** 🚀
