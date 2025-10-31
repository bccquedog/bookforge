#!/bin/bash
# Setup Railway domain for BookForge API

echo "🌐 Setting up Railway domain for BookForge API"
echo "=============================================="
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway..."
    railway login
    echo ""
fi

# Link to project if not already linked
echo "Linking to Railway project..."
railway link --project 3c1f7c63-4930-48a7-9b01-077d12073576

# Link to service
echo "Linking to service..."
railway link --service ca8e1242-55b8-4f9a-b348-503af588b792

# Generate domain
echo ""
echo "Generating public domain..."
railway domain

echo ""
echo "✅ Done! Your Railway URL should be displayed above."
echo ""
echo "If you don't see a URL, Railway might have already generated one."
echo "Check your Railway dashboard or run: railway status"
echo ""
