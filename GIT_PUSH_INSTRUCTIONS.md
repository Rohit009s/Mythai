# Git Push Instructions

## Issue
GitHub is blocking the push because an old commit (6c9f21b6) contains an API key in STATUS.md file.

## Solution Options

### Option 1: Allow the Secret (Easiest)
Click this link to allow the secret:
https://github.com/Rohit009s/Mythai/security/secret-scanning/unblock-secret/366alnKFZESoY8DTkeOn4ZU3VqD

Then run:
```bash
git push origin main --force
```

### Option 2: Clean Git History (Recommended for Production)
Remove the problematic commit from history:

```bash
# Create a new branch without history
git checkout --orphan clean-main

# Add all current files
git add .

# Commit everything fresh
git commit -m "Initial commit: Complete MythAI system with religion-based access control"

# Delete old main branch
git branch -D main

# Rename clean-main to main
git branch -m main

# Force push to GitHub
git push origin main --force
```

## What's Being Pushed

✅ **199 files changed**
- 575,138 insertions
- 11,492 deletions

### Key Features
- 55+ deity personas across 9 religious traditions
- Religion-based access control
- 28,482 embeddings (English, Hindi, Telugu)
- Complete authentication system
- Intent-based smart responses
- Multilingual support
- MCP integration
- TTS service

### Files Excluded (via .gitignore)
- ❌ `data/embeddings/*.json` (164MB+ - too large for Git)
- ❌ `.env` (contains API keys)
- ❌ `node_modules/`
- ❌ Audio files

## After Successful Push

Your repository will be available at:
https://github.com/Rohit009s/Mythai

## Note for Collaborators

After cloning, they will need to:
1. Run `npm install` in root and frontend directories
2. Create `.env` file with their own API keys
3. Generate embeddings by running `node embed-all-english-texts.js`

---

**Current Status**: Ready to push (just need to allow the secret or clean history)
