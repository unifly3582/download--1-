# Security Verification Script for Windows PowerShell
# Run this to check if your environment files are secure

Write-Host "Security Verification Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check 1: Verify .gitignore exists and contains .env*
Write-Host "Checking .gitignore configuration..." -ForegroundColor Yellow
if (Test-Path .gitignore) {
    $gitignoreContent = Get-Content .gitignore -Raw
    if ($gitignoreContent -match "\.env\*") {
        Write-Host "  OK: .gitignore properly configured" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: .env* not found in .gitignore!" -ForegroundColor Red
        Write-Host "  Action: Add .env* to your .gitignore file" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ERROR: .gitignore file not found!" -ForegroundColor Red
}

Write-Host ""

# Check 2: Verify .env files are not tracked by git
Write-Host "Checking if .env files are tracked by git..." -ForegroundColor Yellow
$trackedFiles = git ls-files | Select-String -Pattern "\.env"
if ($trackedFiles) {
    Write-Host "  WARNING: .env files are tracked by git!" -ForegroundColor Red
    Write-Host "  Tracked files:" -ForegroundColor Red
    $trackedFiles | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    Write-Host "`n  Action Required:" -ForegroundColor Yellow
    Write-Host "    git rm --cached .env.local" -ForegroundColor Cyan
    Write-Host "    git rm --cached .env" -ForegroundColor Cyan
    Write-Host "    git commit -m `"Remove environment files`"" -ForegroundColor Cyan
} else {
    Write-Host "  OK: No .env files are tracked by git" -ForegroundColor Green
}

Write-Host ""

# Check 3: Check git history for .env files
Write-Host "Checking git history for .env files..." -ForegroundColor Yellow
$historyCheck = git log --all --full-history --oneline -- .env.local .env.production 2>$null
if ($historyCheck) {
    Write-Host "  CRITICAL: .env files found in git history!" -ForegroundColor Red
    Write-Host "  This means credentials may have been exposed!" -ForegroundColor Red
    Write-Host "`n  Immediate Actions Required:" -ForegroundColor Yellow
    Write-Host "    1. Rotate ALL credentials immediately" -ForegroundColor Cyan
    Write-Host "    2. Remove files from git history" -ForegroundColor Cyan
    Write-Host "    3. Check service dashboards for unauthorized access" -ForegroundColor Cyan
    Write-Host "`n  See SECURITY_ENVIRONMENT_SETUP.md for details" -ForegroundColor Yellow
} else {
    Write-Host "  OK: No .env files found in git history" -ForegroundColor Green
}

Write-Host ""

# Check 4: Verify required environment files exist
Write-Host "Checking environment files..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "  OK: .env.local exists" -ForegroundColor Green
} else {
    Write-Host "  INFO: .env.local not found (create from template)" -ForegroundColor Yellow
}

if (Test-Path .env.production.example) {
    Write-Host "  OK: .env.production.example exists" -ForegroundColor Green
} else {
    Write-Host "  INFO: .env.production.example not found" -ForegroundColor Yellow
}

Write-Host ""

# Check 5: Verify placeholder values are replaced
Write-Host "Checking for placeholder values..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local -Raw
    $placeholders = @()
    
    if ($envContent -match "your_.*_here") {
        $placeholders += "Generic placeholders found"
    }
    if ($envContent -match "RAZORPAY_WEBHOOK_SECRET=your_razorpay") {
        $placeholders += "RAZORPAY_WEBHOOK_SECRET"
    }
    if ($envContent -match "GEMINI_API_KEY=\s*$") {
        $placeholders += "GEMINI_API_KEY is empty"
    }
    
    if ($placeholders.Count -gt 0) {
        Write-Host "  INFO: Placeholder values found:" -ForegroundColor Yellow
        $placeholders | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
        Write-Host "  Action: Replace with real values" -ForegroundColor Cyan
    } else {
        Write-Host "  OK: No obvious placeholders found" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Summary:" -ForegroundColor White
Write-Host "  - Review any WARNING or CRITICAL items above" -ForegroundColor White
Write-Host "  - See SECURITY_ENVIRONMENT_SETUP.md for instructions" -ForegroundColor White
Write-Host "  - Rotate credentials if exposed in git history" -ForegroundColor White
Write-Host ""
