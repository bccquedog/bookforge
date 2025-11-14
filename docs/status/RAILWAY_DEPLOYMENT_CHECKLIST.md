# Railway Deployment Checklist

## ⚠️ Current Issue
Railway URL exists but no app is running. Need to deploy code.

## ✅ What To Check in Railway Dashboard

Go to: https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576

### Check Service Configuration

Look for your "bookforge" service:

1. **Is there a deployment?**
   - Should see: "Deploying" or "Active" 
   - If not: Look for "Deploy" button or "Connect to GitHub"

2. **Root Directory**
   - Should be: `api` (not blank or `/`)
   - Check in: Settings → Source

3. **Build Command**
   - Should be: `pip install -r requirements.txt`
   - Or auto-detected

4. **Start Command**
   - Should be: `python server.py`
   - Or auto-detected

### Add Environment Variables

Go to: Settings → Variables

Add these:
```
GEMINI_API_KEY=AIzaSyD9WYDv4J558hyj3BiM9J15cJSHr9woVcg
PORT=8000
FLASK_ENV=production
```

Optional:
```
OPENAI_API_KEY=your_key
FIREBASE_CONFIG_JSON={your_json}
```

### Trigger Deployment

After configuration:
1. Click "Redeploy" if available
2. OR push code to GitHub (Railway watches main branch)
3. OR wait for auto-deploy

## 🔍 How To Know It's Working

Check logs in Railway dashboard:
```
Starting BookForge API server on port 8000
Gemini AI configured successfully
Firebase Storage configured successfully
```

Then test:
```bash
curl https://bookforge-production-2a1d.up.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "BookForge API"
}
```

## 🆘 Common Issues

**"No deployments"**
- Click "Deploy" or "Connect GitHub repo"
- Make sure main branch is selected

**"Build failed"**
- Check Python version (should be 3.11)
- Check requirements.txt exists
- Check Procfile or start command

**"Application error"**
- Check logs for missing environment variables
- Check if PORT is set
- Check if server.py is in root directory

**"404 Application not found"**
- Service exists but code isn't deployed
- Trigger deployment

---

## 🎯 Quick Fix

If you see "Connect GitHub":
1. Click "Connect GitHub"
2. Select repository: `bccquedog/bookforge`
3. Select root directory: `api`
4. Click "Deploy"

That's it! 🚀

