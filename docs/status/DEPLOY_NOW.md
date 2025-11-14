# Deploy BookForge Now - Railway (Simplest) 🚀

## Why Railway?
- ✅ Free tier (more than enough)
- ✅ Automatic deployments
- ✅ No configuration needed
- ✅ Works in 2 minutes

## Exact Steps

### 1️⃣ Login
```bash
railway login
```
Sign in with GitHub when browser opens.

### 2️⃣ Deploy Backend
```bash
cd api
railway init
railway up
```
Wait for URL: `https://your-app.up.railway.app`

### 3️⃣ Add API Keys
Go to https://railway.app and:
- Find your project
- Click "Variables"
- Add these from your `.env.local`:

```
GEMINI_API_KEY = (copy from .env.local)
OPENAI_API_KEY = (copy from .env.local)
FIREBASE_CONFIG_JSON = (paste JSON here)
```

### 4️⃣ Update Frontend
In `.env.local`:
```bash
VITE_API_BASE=https://your-app.up.railway.app
VITE_USE_MOCK_API=false
```

### 5️⃣ Deploy Frontend
```bash
git add .env.local
git commit -m "Connect to backend"
git push
```

## ✅ Done!

Your app is LIVE with:
- Real Gemini AI analysis
- Firebase storage
- Professional PDF/EPUB generation

**Total time**: 5 minutes

## 🎯 That's It!

No complex setup. No Docker. No config files.
Just: login → deploy → add keys → done.

Need help? The Railway dashboard has great docs at railway.app/docs

