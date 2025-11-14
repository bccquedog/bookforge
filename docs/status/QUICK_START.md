# BookForge Quick Start

Get BookForge up and running in 5 minutes.

## ⚡ Fastest Way: Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Deploy backend
cd api
railway login
railway init
railway up

# 3. Set your API keys
railway variables set GEMINI_API_KEY=your_key
railway variables set FIREBASE_CONFIG_JSON='{"type":"service_account",...}'

# 4. Get your backend URL
railway domain
```

Copy the URL, then:

```bash
# 5. Update frontend
cd ..
echo "VITE_API_BASE=https://your-url.railway.app" >> .env.local
echo "VITE_USE_MOCK_API=false" >> .env.local

# 6. Redeploy to Vercel
git add .env.local
git commit -m "Configure backend URL"
git push
```

**Done!** ✅

---

## 🐳 Alternative: Docker

```bash
cd api
docker build -t bookforge-api .
docker run -p 8000:8000 \
  -e GEMINI_API_KEY=your_key \
  bookforge-api
```

Deploy to Google Cloud Run:
```bash
gcloud run deploy bookforge-api --source .
```

---

## 🔧 Manual Setup

### Backend
```bash
cd api
pip install -r requirements.txt
export GEMINI_API_KEY=your_key
python server.py
```

### Frontend
```bash
npm install
npm run dev
```

---

## ✅ Verify

```bash
# Test backend
curl http://localhost:8000/api/health

# Test with real file
curl -X POST http://localhost:8000/api/projects/test/upload \
  -F "file=@your-manuscript.txt"
```

---

## 🆘 Need Help?

- [Full Deployment Guide](DEPLOYMENT_GUIDE.md)
- [API Setup](api/ENV_SETUP.md)
- [API Integration Guide](api/API_INTEGRATION_GUIDE.md)

---

**Time to Production**: ~5 minutes with Railway 🚀

