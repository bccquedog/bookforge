# Railway Setup - Copy These Commands

Since Railway requires browser login, please run these commands in YOUR terminal:

## 📋 Run These Commands (Copy/Paste)

```bash
cd /Users/brianproctor/bookforge

# 1. Login to Railway (will open browser)
railway login

# 2. Link to your project
cd api
railway link --project 3c1f7c63-4930-48a7-9b01-077d12073576

# 3. Generate/Show domain
railway domain

# 4. Add environment variables
railway variables set GEMINI_API_KEY="your_key_here"
railway variables set OPENAI_API_KEY="your_key_here"
railway variables set FIREBASE_CONFIG_JSON='{paste your JSON}'
```

After you get the Railway URL from `railway domain`, come back here!

## 🔗 Then I'll Update Frontend

Once you share the Railway URL, I'll:
1. Update your `.env.local`
2. Push to git
3. Redeploy to Vercel
4. Connect everything!

---

**Just run those commands and paste the URL here!** 🚀

