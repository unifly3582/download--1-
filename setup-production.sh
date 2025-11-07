#!/bin/bash

# Production Setup Script
# Run this to set up all production configurations

echo "🚀 Production Configuration Setup"
echo "=================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js and npm are installed"
echo ""

# Step 1: Install Sentry
echo "📦 Step 1: Installing Sentry..."
read -p "Install Sentry? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install @sentry/nextjs
    echo "✓ Sentry installed"
    echo ""
    
    echo "🔧 Running Sentry wizard..."
    npx @sentry/wizard@latest -i nextjs
    echo ""
else
    echo "⏭️  Skipping Sentry installation"
    echo ""
fi

# Step 2: Environment Variables
echo "📝 Step 2: Environment Variables"
echo "Please set up the following environment variables:"
echo ""
echo "Required:"
echo "  - NEXT_PUBLIC_SENTRY_DSN"
echo "  - NEXT_PUBLIC_GA_MEASUREMENT_ID"
echo "  - NEXT_PUBLIC_PRODUCTION_URL"
echo "  - ALLOWED_ORIGINS"
echo ""
echo "See .env.production.example for complete list"
echo ""
read -p "Press Enter to continue..."

# Step 3: Verify files
echo ""
echo "✓ Step 3: Verifying configuration files..."
files=(
    "src/middleware.ts"
    "src/lib/monitoring/sentry.ts"
    "src/lib/monitoring/analytics.ts"
    "src/lib/monitoring/performance.ts"
    "src/lib/middleware/rateLimit.ts"
    "instrumentation.ts"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ $file (missing)"
        all_exist=false
    fi
done

if [ "$all_exist" = true ]; then
    echo ""
    echo "✓ All configuration files present"
else
    echo ""
    echo "❌ Some files are missing. Please check the setup."
    exit 1
fi

# Step 4: Build test
echo ""
echo "🔨 Step 4: Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Summary
echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Set environment variables in your hosting platform"
echo "2. Uncomment Sentry configuration files"
echo "3. Add AnalyticsProvider to your layout"
echo "4. Deploy to staging for testing"
echo "5. Monitor Sentry and GA4 dashboards"
echo ""
echo "See PRODUCTION_CONFIGURATIONS_COMPLETE.md for detailed instructions"
echo ""
