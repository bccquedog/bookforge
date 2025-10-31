#!/bin/bash
# Super simple deployment script

echo "🚀 BookForge - Simplest Deployment Ever"
echo "========================================"
echo ""

# Step 1: Login
echo "Step 1: Login to Railway..."
railway login

echo ""
echo "✅ Logged in! Now deploying..."
echo ""

# Step 2: Init and Deploy
echo "Step 2: Initializing project..."
railway init

echo ""
echo "Step 3: Deploying..."
railway up

echo ""
echo "Step 4: Getting your URL..."
URL=$(railway domain | tail -1)

echo ""
echo "✅ DEPLOYED! Your backend is at: $URL"
echo ""
echo "📝 Next: Add your API keys in Railway dashboard"
echo "   Then update frontend:"
echo "   VITE_API_BASE=$URL"
echo ""

