# BookForge Backend Deployment - Next Steps

## ✅ What's Been Prepared

Your backend is ready to deploy with:
- ✅ Gemini AI integration
- ✅ Firebase Storage integration  
- ✅ Real document processing
- ✅ Production-ready configuration
- ✅ Deployment scripts and guides

## 🚀 Option 1: Railway Deployment (Recommended - 5 minutes)

### Automated Script
```bash
cd api
./deploy-railway.sh
```

This script will:
1. Install Railway CLI if needed
2. Login to Railway
3. Initialize project
4. Extract API keys from `.env.local`
5. Deploy the backend
6. Give you the URL

### Manual Steps
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize & Deploy
cd api
railway init
railway up

# 4. Add environment variables
railway variables set GEMINI_API_KEY=$(grep GEMINI_API_KEY ../.env.local | cut -d '=' -f2)
railway variables set OPENAI_API_KEY=$(grep OPENAI_API_KEY ../.env.local | cut -d '=' -f2)

# For Firebase, paste the JSON content:
railway variables set FIREBASE_CONFIG_JSON='<paste your JSON here>'

# 5. Get your URL
railway domain
```

## 🌐 Option 2: Vercel for Backend (Alternative)

If you want everything on Vercel:

1. Go to Vercel Dashboard
2. Add new project
3. Import your `api` directory
4. Set environment variables
5. Deploy

**Note**: Vercel has cold starts for Python. Railway is faster.

## 🐳 Option 3: Google Cloud Run (Serverless)

```bash
# Install gcloud CLI
brew install google-cloud-sdk  # macOS
# or download from: https://cloud.google.com/sdk

# Login
gcloud auth login

# Create project
gcloud projects create your-project-id

# Build & Deploy
cd api
gcloud run deploy bookforge-api --source .
```

## 🔗 Connect Frontend to Backend

After deploying backend, update frontend:

1. Get backend URL (from Railway/Cloud Run)
2. Update `.env.local`:
```bash
VITE_API_BASE=https://your-backend-url.railway.app
VITE_USE_MOCK_API=false
```

3. Push to Vercel:
```bash
git add .env.local
git commit -m "Connect to production backend"
git push
```

## ✅ Verification

Test your deployment:

```bash
# 1. Health check
curl https://your-backend-url.railway.app/api/health

# 2. Create a test project
curl -X POST https://your-backend-url.railway.app/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Book","author":"Test Author"}'

# 3. Check frontend
# Visit your Vercel URL and try uploading a file
```

## 🎯 What You'll See

### Successful Deployment
```
✅ Backend: https://bookforge-api.railway.app
✅ Frontend: https://bookforge.vercel.app
✅ Health check: Working
✅ File upload: Working
✅ Gemini analysis: Working
```

### Browser Console (no errors)
- API calls succeeding
- Real manuscript content displaying
- AI analysis loading
- Downloads working

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Deployed | Vercel |
| Backend | ⏳ Ready to Deploy | Railway/Cloud Run |
| Gemini API | ✅ Configured | Needs environment |
| Firebase | ✅ Configured | Needs credentials |
| OpenAI | ✅ Configured | For covers |

## 🆘 Troubleshooting

### "Could not connect to backend"
- Check `VITE_API_BASE` is set correctly
- Verify backend is running
- Check CORS headers in backend

### "Gemini API not available"
- Verify `GEMINI_API_KEY` is set
- Check API key is valid
- Review backend logs

### "Firebase upload failed"
- Check Firebase credentials
- Verify bucket permissions
- Review storage logs

## 📚 Documentation

- **Full Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **API Setup**: [api/ENV_SETUP.md](api/ENV_SETUP.md)
- **Integration**: [api/API_INTEGRATION_GUIDE.md](api/API_INTEGRATION_GUIDE.md)

## ⏱️ Estimated Time

- Railway: **5 minutes**
- Cloud Run: **10 minutes**
- Manual setup: **15 minutes**

## 🎉 You're Almost Done!

Once backend is deployed:
1. ✅ Frontend connects to real backend
2. ✅ File uploads go to Firebase
3. ✅ Gemini AI analyzes manuscripts
4. ✅ Real PDF/EPUB generation
5. ✅ Production-ready app!

**Total setup time**: ~10 minutes from zero to production 🚀

