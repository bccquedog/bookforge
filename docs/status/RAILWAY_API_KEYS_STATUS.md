# API Keys Status in Railway

## ⚠️ Current Issue

Railway backend is running but missing API keys.

## 🔑 Add These 3 Keys to Railway

Go to: https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576

### Service: bookforge → Variables Tab

#### 1. OpenAI Key (for covers)
- **Name**: `OPENAI_API_KEY`
- **Value**: Get from your `.env.local`

#### 2. Gemini Key (for manuscript analysis)
- **Name**: `GEMINI_API_KEY`
- **Value**: `AIzaSyD9WYDv4J558hyj3BiM9J15cJSHr9woVcg` (from .env.local)

#### 3. Firebase (for file storage)
- **Name**: `FIREBASE_CONFIG_JSON`
- **Value**: Download from Firebase Console (see `HOW_TO_GET_FIREBASE_JSON.md`)

## 🔄 After Adding Keys

Railway will auto-redeploy and the keys will be available!

## 🎯 Current Status

Without keys:
- ✅ Server runs
- ✅ Health check works
- ❌ Cover generation fails (needs OpenAI)
- ❌ Manuscript analysis fails (needs Gemini)
- ❌ File upload to cloud fails (needs Firebase)

**Add the keys and everything will work!** 🚀

