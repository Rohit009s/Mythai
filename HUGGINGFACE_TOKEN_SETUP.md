# Hugging Face Token Setup Guide

## The Issue
Hugging Face has migrated to a new API endpoint (`router.huggingface.co`) that requires specific token permissions.

## Solution: Create a New Token with Correct Permissions

### Step 1: Go to Hugging Face Settings
Visit: https://huggingface.co/settings/tokens

### Step 2: Create New Token
1. Click "Create new token"
2. Give it a name (e.g., "MythAI-Inference")
3. **IMPORTANT:** Select token type as **"Read"** (this gives access to Serverless Inference API)
4. OR ensure these permissions are enabled:
   - ✓ Make calls to the serverless Inference API
   - ✓ Access to Inference Endpoints

### Step 3: Copy the Token
Copy the new token (starts with `hf_...`)

### Step 4: Update .env File
Replace the current token in `.env`:
```
HUGGINGFACE_API_TOKEN=hf_YOUR_NEW_TOKEN_HERE
```

### Step 5: Test
Run: `node test-llm.js`

## Alternative: Use Hugging Face Inference Endpoints (Dedicated)

If the serverless API doesn't work, you can:
1. Create a dedicated Inference Endpoint at https://huggingface.co/inference-endpoints
2. Use the endpoint URL and token
3. Update the code to use your dedicated endpoint

## Current Status
- Old endpoint (`api-inference.huggingface.co`): ❌ Deprecated
- New router endpoint (`router.huggingface.co`): ✓ Active (requires proper token)
- Your current token: May not have the required permissions

## Recommended Action
Create a fresh token with "Read" access which includes Serverless Inference API permissions.
