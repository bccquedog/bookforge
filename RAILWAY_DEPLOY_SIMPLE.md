# Railway Deployment - Simple Steps

Railway is the SIMPLEST option. Here's exactly what to do:

## 🎯 Simple 3-Step Deployment

### Step 1: Login to Railway
Open a new terminal and run:
```bash
railway login
```

This will open a browser window. Sign in with GitHub.

### Step 2: Deploy
```bash
cd api
railway init
railway up
```

Railway will give you a URL like: `https://your-app.up.railway.app`

### Step 3: Add Your API Keys
```bash
# Open Railway dashboard or use CLI
railway variables set GEMINI_API_KEY=your_key_from_.env.local
railway variables set OPENAI_API_KEY=your_key_from_.env.local
railway variables set FIREBASE_CONFIG_JSON='{paste your JSON here}'
```

## 🔗 Connect Frontend

Update your `.env.local`:
```bash
VITE_API_BASE=https://your-app.up.railway.app
VITE_USE_MOCK_API=false
```

Then push to Vercel:
```bash
git push
```

## ✅ Done!

That's it! Your backend is live.

**Total time**: 3 minutes 🚀

---

## 🆘 Need Your API Keys?

From your `.env.local`, you need:
1. `GEMINI_API_KEY` - from Google AI Studio
2. `OPENAI_API_KEY` - from OpenAI Platform
3. `FIREBASE_CONFIG_JSON` - from Firebase Console

**Want me to create a simpler script?** I can make one that copies keys from `.env.local` automatically!

