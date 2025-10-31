# Environment Variables Setup

This document describes all required API keys and environment variables for BookForge.

## Required API Keys

### 1. Google Gemini API Key
**Purpose**: Manuscript analysis, content suggestions, and AI-powered features

**How to get it**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new project or select existing one
4. Copy the API key

**Environment Variable**: `GEMINI_API_KEY`

### 2. OpenAI API Key
**Purpose**: Book cover generation using DALL-E

**How to get it**:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (you can only see it once)

**Environment Variable**: `OPENAI_API_KEY`

### 3. Firebase Service Account
**Purpose**: File storage for manuscripts and generated books

**How to get it**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select a project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the JSON file

**Environment Variable**: `FIREBASE_SERVICE_ACCOUNT` (path to JSON file)
**Or use**: Direct JSON content in `FIREBASE_CONFIG_JSON`

## Environment Variables

Create a `.env` file in the `api/` directory or set these in your deployment platform:

```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration (choose one method)
# Method 1: Path to service account JSON file
FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json

# Method 2: JSON content as string (escaped)
FIREBASE_CONFIG_JSON='{"type":"service_account",...}'

# Optional: Custom configurations
PORT=8000
DEBUG=True
API_TIMEOUT=30000
MAX_FILE_SIZE=52428800  # 50MB in bytes
```

## Additional Recommended Services

### Optional but Recommended

#### 1. SendGrid (Email notifications)
**Purpose**: Send email confirmations and sharing links

**How to get it**:
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for free account
3. Create API key in Settings > API Keys

**Environment Variable**: `SENDGRID_API_KEY`

#### 2. Stripe (Payment processing)
**Purpose**: Enable premium features and subscriptions

**How to get it**:
1. Go to [Stripe](https://stripe.com/)
2. Sign up for account
3. Get API keys from Dashboard > Developers > API Keys

**Environment Variables**: 
- `STRIPE_SECRET_KEY` (server-side)
- `STRIPE_PUBLISHABLE_KEY` (client-side)

#### 3. AWS S3 (Alternative file storage)
**Purpose**: Store files in AWS instead of Firebase

**How to get it**:
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Create S3 bucket
3. Get credentials from IAM

**Environment Variables**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

#### 4. Cloudflare R2 (CDN for files)
**Purpose**: Fast file delivery and edge caching

**How to get it**:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Enable R2 in Storage section
3. Create bucket and get credentials

**Environment Variables**:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

#### 5. Upstash Redis (Caching and rate limiting)
**Purpose**: Cache results and implement rate limiting

**How to get it**:
1. Go to [Upstash](https://upstash.com/)
2. Create free Redis database
3. Get REST API endpoint and token

**Environment Variables**:
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`

## Setup Instructions

### For Local Development

1. Create a `.env` file in the `api/` directory:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API keys:
```bash
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json
```

3. Install dependencies:
```bash
cd api
pip install -r requirements.txt
```

4. Run the server:
```bash
python server.py
```

### For Production Deployment

Set environment variables in your hosting platform:

**Vercel**: Add in Project Settings > Environment Variables
**Heroku**: Use `heroku config:set KEY=value`
**AWS/GCP**: Use secrets manager or environment configuration

## Testing

To verify your API keys are working:

```bash
# Test Gemini API
python -c "import os; from google.generativeai import configure; configure(api_key=os.getenv('GEMINI_API_KEY')); print('Gemini OK')"

# Test OpenAI API
python -c "import os; from openai import OpenAI; client = OpenAI(api_key=os.getenv('OPENAI_API_KEY')); print('OpenAI OK')"

# Test Firebase
python -c "import firebase_admin; firebase_admin.initialize_app(); print('Firebase OK')"
```

## Security Notes

- **Never commit API keys to version control**
- Use `.env` files for local development
- Use environment variables or secrets manager for production
- Rotate keys regularly
- Use different keys for development and production

## Cost Estimates

- **Gemini API**: Free tier includes generous usage
- **OpenAI**: Pay per image generated (~$0.04 per cover)
- **Firebase Storage**: Free tier (5GB storage, 1GB/day transfer)
- **SendGrid**: Free tier (100 emails/day)

