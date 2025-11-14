# Add API Keys to Railway - Quick Guide

## 🎯 Step-by-Step: Add Firebase JSON to Railway

### 1. Get Firebase JSON
1. Go to: https://console.firebase.google.com/project/community-gaming-quest/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download the JSON file
4. Open it in a text editor
5. **Copy ALL the content**

### 2. Add to Railway
1. Go to: https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576
2. Click on your **bookforge** service
3. Click **"Variables"** tab
4. Click **"+ New Variable"**
5. Fill in:
   - **Name**: `FIREBASE_CONFIG_JSON`
   - **Value**: Paste the entire JSON
   - **Apply to**: All environments
6. Click **"Add"**

### 3. Add Gemini Key (Same Way)
Click **"+ New Variable"** again:
- **Name**: `GEMINI_API_KEY`
- **Value**: `AIzaSyD9WYDv4J558hyj3BiM9J15cJSHr9woVcg` (from .env.local)
- **Apply to**: All environments

### 4. Add OpenAI Key (Same Way)
Click **"+ New Variable"** again:
- **Name**: `OPENAI_API_KEY`
- **Value**: (copy from your .env.local)
- **Apply to**: All environments

### 5. Redeploy
Railway will auto-redeploy when you save variables!

## ✅ After Adding Keys

Test the backend:
```bash
curl https://bookforge-production-2a1d.up.railway.app/api/health
```

Should show:
```json
{
  "gemini_available": true,
  "firebase_available": true,
  "openai_available": true
}
```

---

**Go to Railway now and add those 3 variables!** 🚀

