# BookForge Deployment Guide

Complete guide for deploying BookForge frontend and backend.

## 🚀 Quick Start

### Frontend (Vercel) - Already Done ✅
Your frontend is deployed at: https://bookforge-[hash]-vercel.app

### Backend (Railway) - Deploy Now
We'll deploy the backend to Railway for free.

---

## 📦 Method 1: Railway (Recommended)

Railway is the easiest and fastest way to deploy Python backends.

### Step 1: Create Railway Account
1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project"

### Step 2: Connect Repository
1. Select "Deploy from GitHub repo"
2. Choose your `bookforge` repository
3. Select the `api` directory as the root

### Step 3: Add Environment Variables
In Railway dashboard, go to "Variables" and add:

```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_from_.env.local

# Firebase Storage (use JSON string format)
FIREBASE_CONFIG_JSON={"type":"service_account","project_id":"your-project",...}
# OR upload the JSON file and reference it

# OpenAI (optional, for covers)
OPENAI_API_KEY=your_openai_key

# Flask
FLASK_ENV=production
PORT=8000

# Optional
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
```

### Step 4: Deploy
1. Railway auto-detects Python
2. Runs `pip install -r requirements.txt`
3. Starts with `python server.py`
4. Your backend will be live at `https://your-app.up.railway.app`

### Step 5: Update Frontend
Update `.env.local` (or Vercel environment variables):

```bash
VITE_API_BASE=https://your-app.up.railway.app
VITE_USE_MOCK_API=false
```

Redeploy frontend to Vercel.

**Done!** ✅

---

## 🐳 Method 2: Docker (Alternative)

If you prefer Docker, we can containerize the backend.

### Dockerfile
Create `api/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "server.py"]
```

Deploy to:
- **Google Cloud Run**: Free tier, serverless
- **AWS ECS**: Enterprise-grade
- **DigitalOcean App Platform**: Simple pricing

---

## 🌐 Method 3: Google Cloud Run (Serverless)

Great for scalable, pay-per-use deployment.

### Step 1: Install gcloud CLI
```bash
# macOS
brew install google-cloud-sdk

# Or download from https://cloud.google.com/sdk
```

### Step 2: Setup Project
```bash
gcloud init
gcloud config set project your-project-id
```

### Step 3: Build and Deploy
```bash
cd api

# Build container
gcloud builds submit --tag gcr.io/YOUR-PROJECT/bookforge-api

# Deploy to Cloud Run
gcloud run deploy bookforge-api \
  --image gcr.io/YOUR-PROJECT/bookforge-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=...,FIREBASE_CONFIG_JSON=..."
```

### Step 4: Get URL
```bash
gcloud run services describe bookforge-api
```
Copy the URL and update frontend.

---

## 🚂 Method 4: Railway Command Line (Fastest)

If you have the Railway CLI installed:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd api
railway init

# Add environment variables
railway variables set GEMINI_API_KEY=your_key
railway variables set FIREBASE_CONFIG_JSON='{"type":"service_account",...}'

# Deploy
railway up

# Get URL
railway domain
```

**Copy the URL** and update frontend environment variables.

---

## 🔗 Connecting Frontend to Backend

After deploying the backend, update your frontend:

### Option A: Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your `bookforge` project
3. Settings → Environment Variables
4. Add:
   - `VITE_API_BASE` = your backend URL
   - `VITE_USE_MOCK_API` = `false`
5. Redeploy

### Option B: Local `.env.local`

```bash
# In project root
VITE_API_BASE=https://your-backend.railway.app
VITE_USE_MOCK_API=false
```

---

## ✅ Verification

Test your deployment:

```bash
# Test health endpoint
curl https://your-backend.railway.app/api/health

# Should return:
{
  "status": "healthy",
  "service": "BookForge API"
}
```

### Test Frontend
1. Visit your Vercel URL
2. Upload a manuscript
3. Check browser console for API calls
4. Should see successful API responses

---

## 🔧 Troubleshooting

### CORS Errors
**Solution**: Backend has CORS enabled, but verify:
```python
CORS(app)  # In server.py
```

### 404 Errors
**Check**:
- Frontend `VITE_API_BASE` points to correct backend
- Backend is running and accessible
- No trailing slash in URLs

### Firebase Errors
**Check**:
- `FIREBASE_CONFIG_JSON` is properly escaped
- Service account has storage permissions
- Bucket name is correct

### Gemini Errors
**Check**:
- API key is valid
- Quota not exceeded
- Key is correctly set in environment

---

## 📊 Recommended Setup

### Production
- **Frontend**: Vercel (already done ✅)
- **Backend**: Railway (recommended) or Cloud Run
- **Storage**: Firebase Storage
- **Database**: Upstash Redis (optional, for caching)

### Development
- Frontend: `npm run dev` → `localhost:5173`
- Backend: `python api/server.py` → `localhost:8000`

---

## 🎯 Quick Deploy (Railway)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Deploy
cd api
railway init
railway up

# 4. Set environment variables
railway variables set GEMINI_API_KEY=$GEMINI_API_KEY
railway variables set FIREBASE_CONFIG_JSON="$(cat ../service-account.json)"

# 5. Get URL
railway domain

# 6. Update frontend .env.local
echo "VITE_API_BASE=$(railway domain)" >> ../.env.local
```

**Total time**: ~5 minutes ⚡

---

## 📝 Environment Variables Reference

### Backend (.env or Railway)

```bash
# Required
GEMINI_API_KEY=...
FIREBASE_CONFIG_JSON=...  # OR FIREBASE_SERVICE_ACCOUNT=/path/to/file.json
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# Optional
OPENAI_API_KEY=...
PORT=8000
FLASK_ENV=production
```

### Frontend (.env.local or Vercel)

```bash
VITE_API_BASE=https://your-backend.com
VITE_USE_MOCK_API=false
```

---

## 🎉 Success Checklist

- [ ] Backend deployed and accessible
- [ ] Health check returns 200
- [ ] Environment variables set correctly
- [ ] Frontend connects to backend
- [ ] Can upload files
- [ ] Can analyze manuscripts
- [ ] Can generate books
- [ ] No CORS errors
- [ ] No 404 errors

---

## 💰 Cost Estimates

- **Railway**: Free tier includes generous usage
- **Vercel**: Free for frontend
- **Firebase Storage**: Free tier (5GB)
- **Gemini API**: Free tier available
- **Total**: **FREE** for MVP usage!

---

**Need help?** Check the logs in your hosting platform dashboard.

