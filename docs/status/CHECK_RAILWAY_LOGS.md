# Check Railway Logs for 500 Error

## 🔍 The Error

Cover generation is failing with a 500 error from Railway backend.

## 📊 What To Check

### Go to Railway Dashboard
https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576

### Check Logs

1. Click on your **bookforge** service
2. Click **"Deployments"** tab
3. Click on the **latest deployment**
4. Click **"View logs"** or scroll down
5. Look for **ERROR** messages

### Common Causes

#### 1. Missing OPENAI_API_KEY
**Error**: "OpenAI API key not configured"

**Fix**: Add `OPENAI_API_KEY` to Railway variables

#### 2. Module Import Error
**Error**: "No module named 'openai'" or similar

**Fix**: Requirements.txt needs updating

#### 3. Network Error
**Error**: Connection refused / timeout

**Fix**: Check that OpenAI API is accessible

## 🔍 Quick Diagnostic

Run this to check:
```bash
curl -X POST https://bookforge-production-2a1d.up.railway.app/api/projects/test/generate-cover \
  -H "Content-Type: application/json" \
  -d '{"style":"modern"}'
```

Will show the actual error.

---

**Share the error from Railway logs here and I'll fix it!** 🔍

