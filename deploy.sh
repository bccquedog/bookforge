#!/bin/bash

# BookForge Deployment Script
echo "🚀 Deploying BookForge to Vercel..."

# Build the project
echo "📦 Building React application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🌐 Deploying to Vercel..."
    npx vercel --prod
    
    echo "🎉 Deployment complete!"
    echo "📱 Your BookForge app is now live!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi



