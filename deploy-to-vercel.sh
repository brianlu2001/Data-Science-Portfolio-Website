#!/bin/bash

# Deploy to Vercel script
echo "🚀 Preparing for Vercel deployment..."

# Check if required files exist
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found"
    exit 1
fi

if [ ! -f "api/index.ts" ]; then
    echo "❌ api/index.ts not found"
    exit 1
fi

# Test build locally
echo "🔨 Testing build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Remember to set this in Vercel dashboard."
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  SESSION_SECRET not set. Remember to set this in Vercel dashboard."
fi

echo "📋 Deployment checklist:"
echo "  1. ✅ Build files created"
echo "  2. ✅ Vercel configuration ready" 
echo "  3. ✅ API routes configured"
echo "  4. ⚠️  Set environment variables in Vercel dashboard"
echo "  5. ⚠️  Push to GitHub and import in Vercel"

echo ""
echo "🎯 Next steps:"
echo "  1. Push your code to GitHub"
echo "  2. Import your repository in Vercel dashboard"
echo "  3. Set environment variables:"
echo "     - DATABASE_URL=your_postgresql_connection_string"
echo "     - SESSION_SECRET=your_secret_key"
echo "     - NODE_ENV=production"
echo "  4. Deploy!"

echo ""
echo "📖 For detailed instructions, see README-VERCEL.md"