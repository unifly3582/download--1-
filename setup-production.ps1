# Production Setup Script for Windows PowerShell
# Run this to set up all production configurations

Write-Host "Production Configuration Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "OK: Node.js and npm are installed (npm v$npmVersion)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Step 1: Install Sentry
Write-Host "Step 1: Installing Sentry..." -ForegroundColor Yellow
$installSentry = Read-Host "Install Sentry? (y/n)"
if ($installSentry -eq 'y' -or $installSentry -eq 'Y') {
    Write-Host "Installing @sentry/nextjs..." -ForegroundColor Cyan
    npm install @sentry/nextjs
    Write-Host "OK: Sentry installed" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Running Sentry wizard..." -ForegroundColor Cyan
    npx @sentry/wizard@latest -i nextjs
    Write-Host ""
} else {
    Write-Host "Skipping Sentry installation" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Environment Variables
Write-Host "Step 2: Environment Variables" -ForegroundColor Yellow
Write-Host "Please set up the following environment variables:" -ForegroundColor White
Write-Host ""
Write-Host "Required:" -ForegroundColor White
Write-Host "  - NEXT_PUBLIC_SENTRY_DSN" -ForegroundColor Cyan
Write-Host "  - NEXT_PUBLIC_GA_MEASUREMENT_ID" -ForegroundColor Cyan
Write-Host "  - NEXT_PUBLIC_PRODUCTION_URL" -ForegroundColor Cyan
Write-Host "  - ALLOWED_ORIGINS" -ForegroundColor Cyan
Write-Host ""
Write-Host "See .env.production.example for complete list" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"

# Step 3: Verify files
Write-Host ""
Write-Host "Step 3: Verifying configuration files..." -ForegroundColor Yellow
$files = @(
    "src/middleware.ts",
    "src/lib/monitoring/sentry.ts",
    "src/lib/monitoring/analytics.ts",
    "src/lib/monitoring/performance.ts",
    "src/lib/middleware/rateLimit.ts",
    "instrumentation.ts"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: $file (missing)" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host ""
    Write-Host "OK: All configuration files present" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Some files are missing. Please check the setup." -ForegroundColor Red
    exit 1
}

# Step 4: Build test
Write-Host ""
Write-Host "Step 4: Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Build successful" -ForegroundColor Green
} else {
    Write-Host "ERROR: Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Set environment variables in your hosting platform" -ForegroundColor Cyan
Write-Host "2. Uncomment Sentry configuration files" -ForegroundColor Cyan
Write-Host "3. Add AnalyticsProvider to your layout" -ForegroundColor Cyan
Write-Host "4. Deploy to staging for testing" -ForegroundColor Cyan
Write-Host "5. Monitor Sentry and GA4 dashboards" -ForegroundColor Cyan
Write-Host ""
Write-Host "See PRODUCTION_CONFIGURATIONS_COMPLETE.md for detailed instructions" -ForegroundColor White
Write-Host ""
