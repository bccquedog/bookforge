# How to Get OpenAI API Key (For Book Covers)

## 🎯 What You Need

An OpenAI API key to generate book covers using DALL-E.

## 📋 Step-by-Step Instructions

### Step 1: Go to OpenAI Platform
1. Visit: https://platform.openai.com/api-keys
2. Sign in or create an OpenAI account

### Step 2: Create API Key
1. Click **"Create new secret key"** button
2. Give it a name (e.g., "BookForge")
3. Click **"Create secret key"**

### Step 3: Copy the Key
1. **Copy the key immediately!** You can only see it once
2. It looks like: `sk-proj-XXXXXXXXXXXXXXXXXXXX...`

### Step 4: Add to Railway
1. Go to: https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576
2. Click **bookforge** service → **Variables** tab
3. Click **"+ New Variable"**
4. **Name**: `OPENAI_API_KEY`
5. **Value**: Paste your copied key
6. **Apply to**: All environments
7. Click **"Add"**

## 💰 Cost

**Pricing**: ~$0.04 per image generated (DALL-E 3)

**Free Tier**: $5 free credits when you sign up

**For Your App**: 
- One cover per book = $0.04
- Very affordable for users!

## 🔒 Security

- Never commit the key to GitHub ✅ (already protected)
- Only use in Railway environment variables ✅
- Keep it secret!

## ✅ After Adding

Railway will auto-redeploy and cover generation will work!

---

**Sign up at OpenAI and get your key!** 🚀

