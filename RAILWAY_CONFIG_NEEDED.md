# Railway Configuration Needed

## ⚠️ Backend Not Running Yet

The Railway backend URL exists but the app isn't deployed yet.

## 🔧 What You Need To Do

### 1. Go to Railway Dashboard
https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576

### 2. Check Service Configuration
Look for:
- Is there code deployed?
- Is the root directory set correctly?
- Are environment variables set?

### 3. Make Sure Railway Can Find Your Code

Railway needs to know:
- **Root Directory**: Should be `api` or blank for root
- **Start Command**: `python server.py`
- **Build Command**: `pip install -r requirements.txt`

### 4. Add Environment Variables

In Railway dashboard, add:
```
GEMINI_API_KEY=AIzaSyD9WYDv4J558hyj3BiM9J15cJSHr9woVcg
OPENAI_API_KEY=(your key)
FIREBASE_CONFIG_JSON={your JSON}
PORT=8000
FLASK_ENV=production
```

### 5. Redeploy

After configuring, trigger a redeploy or Railway will auto-deploy.

## ✅ Test When Deployed

Once deployed, test:
```bash
curl https://bookforge-production-2a1d.up.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "BookForge API",
  "version": "1.0.0"
}
```

## 🆘 Common Issues

**No code deployed?**
- Check if Railway is connected to your GitHub repo
- Make sure it's watching the right branch (main)

**Wrong directory?**
- Set root directory to `api` in settings

**Environment variables missing?**
- Add them in Railway dashboard under your service

---

**Check the Railway dashboard now!** 🚀

