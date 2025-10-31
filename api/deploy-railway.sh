#!/bin/bash
# Quick deploy script for Railway
# Usage: ./deploy-railway.sh

echo "🚀 BookForge Backend Deployment to Railway"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

# Login check
echo "Checking Railway login..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway..."
    railway login
fi

# Initialize project
echo ""
echo "📦 Initializing Railway project..."
railway init

# Set up environment variables
echo ""
echo "🔐 Setting up environment variables..."

# Check for .env.local
if [ -f "../.env.local" ]; then
    echo "Found .env.local, extracting API keys..."
    
    # Extract GEMINI_API_KEY
    GEMINI_KEY=$(grep GEMINI_API_KEY ../.env.local | cut -d '=' -f2 | tr -d '"')
    if [ ! -z "$GEMINI_KEY" ]; then
        railway variables set GEMINI_API_KEY="$GEMINI_KEY"
        echo "✅ GEMINI_API_KEY set"
    fi
    
    # Extract OPENAI_API_KEY
    OPENAI_KEY=$(grep OPENAI_API_KEY ../.env.local | cut -d '=' -f2 | tr -d '"')
    if [ ! -z "$OPENAI_KEY" ]; then
        railway variables set OPENAI_API_KEY="$OPENAI_KEY"
        echo "✅ OPENAI_API_KEY set"
    fi
else
    echo "⚠️  No .env.local found. Please set variables manually:"
    echo "   railway variables set GEMINI_API_KEY=your_key"
    echo "   railway variables set OPENAI_API_KEY=your_key"
    echo "   railway variables set FIREBASE_CONFIG_JSON='{...}'"
fi

# Ask about Firebase
echo ""
read -p "Do you have Firebase credentials to upload? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Path to Firebase service account JSON: " firebase_path
    if [ -f "$firebase_path" ]; then
        railway variables set FIREBASE_CONFIG_JSON="$(cat $firebase_path)"
        echo "✅ FIREBASE_CONFIG_JSON set"
    else
        echo "⚠️  File not found: $firebase_path"
    fi
fi

# Deploy
echo ""
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "Getting deployment URL..."
DEPLOY_URL=$(railway domain | tail -1)
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Your backend is live at: $DEPLOY_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend .env.local:"
echo "   VITE_API_BASE=$DEPLOY_URL"
echo "   VITE_USE_MOCK_API=false"
echo ""
echo "2. Test the API:"
echo "   curl $DEPLOY_URL/api/health"
echo ""
echo "3. Redeploy frontend to Vercel"
echo ""

