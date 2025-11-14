# How to Get Firebase Config JSON

## 🎯 What You Need

You need the Firebase **Service Account** JSON file for server-side access (uploading files, etc).

## 📋 Step-by-Step Instructions

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Sign in with your Google account

### Step 2: Select or Create Project
1. If you see "community-gaming-quest", select it
2. OR click "Add project" to create a new one

### Step 3: Go to Project Settings
1. Click the **gear icon** ⚙️ (top left)
2. Select **"Project settings"**

### Step 4: Service Accounts Tab
1. In Project Settings, click **"Service accounts"** tab
2. You'll see "Firebase Admin SDK"

### Step 5: Generate New Private Key
1. Click **"Generate new private key"** button
2. A popup will warn you - click **"Generate key"**

### Step 6: Download JSON File
1. A JSON file will download (e.g., `community-gaming-quest-firebase-adminsdk-xxxxx.json`)
2. Open this file in a text editor

### Step 7: Copy JSON Content
1. Copy **ALL** the JSON content
2. It will look like this:
```json
{
  "type": "service_account",
  "project_id": "community-gaming-quest",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "...",
  "universe_domain": "googleapis.com"
}
```

## 🔑 Add to Railway

1. Go to Railway: https://railway.com/project/3c1f7c63-4930-48a7-9b01-077d12073576
2. Click on your `bookforge` service
3. Go to **"Variables"** tab
4. Click **"+ New Variable"**
5. Name: `FIREBASE_CONFIG_JSON`
6. Value: **Paste the entire JSON** (all in one line, or wrapped)
7. Click **"Add"**

## 📝 Important Notes

⚠️ **Security**: This JSON contains sensitive credentials!
- Never commit it to GitHub ✅ (already in .gitignore)
- Only use in Railway environment variables ✅
- Don't share publicly

✅ **Format**: The JSON needs to be valid
- Either paste on one line
- OR escape newlines properly in Railway

## 🆘 Alternative: Using File Path (Not for Railway)

If you were running locally, you could:
```bash
FIREBASE_SERVICE_ACCOUNT=/path/to/your-firebase-key.json
```

But Railway doesn't support file uploads directly, so you must use the JSON content.

## ✅ Example Railway Value

When pasting into Railway, it should look like:
```
{"type":"service_account","project_id":"community-gaming-quest","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@community-gaming-quest.iam.gserviceaccount.com",...}
```

All on one line or properly escaped.

## 🔍 Find Your Current Firebase Project

Based on your `.env.local`, you're using:
- **Project ID**: `community-gaming-quest`

Use that same project!

---

**Questions?** The JSON is just the content of the downloaded Firebase service account file! 🔑

