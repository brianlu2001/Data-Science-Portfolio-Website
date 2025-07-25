#!/bin/bash
# Robust Vercel build script with multiple fallbacks

# Try different build methods in order of preference
if command -v vite >/dev/null 2>&1; then
    echo "Using global vite command"
    vite build
elif [ -f "./node_modules/.bin/vite" ]; then
    echo "Using local vite binary"
    ./node_modules/.bin/vite build
elif command -v npx >/dev/null 2>&1; then
    echo "Using npx vite build"
    npx vite build
else
    echo "Error: Could not find vite command"
    exit 1
fi

# Verify build output
if [ -f "dist/public/index.html" ]; then
    echo "Build successful - index.html created"
else
    echo "Build failed - index.html not found"
    exit 1
fi