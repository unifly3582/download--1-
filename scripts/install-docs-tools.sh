#!/bin/bash

echo "🔧 Installing documentation tools..."

# Core documentation tools
npm install -D glob madge dependency-cruiser ts-unused-exports

# Optional: Advanced analysis tools
npm install -D webpack-bundle-analyzer nodemon http-server

# Global tools (optional)
echo "📦 Installing global tools (optional)..."
echo "Run these manually if you want global access:"
echo "npm install -g madge"
echo "npm install -g dependency-cruiser" 
echo "npm install -g ts-unused-exports"

echo "✅ Documentation tools installed!"
echo ""
echo "🚀 Quick start:"
echo "npm run docs:generate    # Generate documentation"
echo "npm run docs:serve      # Serve docs on http://localhost:3001"
echo "npm run docs:watch      # Auto-regenerate on file changes"