# 🔒 Security & Environment Variables - Setup Guide

## ⚠️ CRITICAL SECURITY ISSUES IDENTIFIED

### Issues Found
1. ✅ `.env.local` contains real credentials (FIXED - already in .gitignore)
2. ⚠️ `GEMINI_API_KEY` is empty in `.env`
3. ⚠️ `RAZORPAY_WEBHOOK_SECRET` has placeholder value
4. ⚠️ WhatsApp access token appears to be real (security risk if committed to git)

### Immediate Actions Required

#### 1. Verify Git Status
```bash
# Check if .env files are tracked by git
git status

# If .env.local or .env are listed, IMMEDIATELY remove them
git rm --cached .env.local
git rm --cached .env
git commit -m "Remove environment files from git"
```

#### 2. Check Git History
```bash
# Check if credentials were previously committed
git log --all --full-history -- .env.local
git log --all --full-history -- .env

# If found in history, you MUST rotate all credentials:
# - WhatsApp Access Token
# - Firebase Private Key
# - Razorpay Webhook Secret
# - AI Agent API Key
```

#### 3. Rotate Compromised Credentials

If any `.env` file was committed to git, **immediately rotate these credentials:**

**WhatsApp Business API:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your app → WhatsApp → Configuration
3. Generate new access token
4. Update `WHATSAPP_ACCESS_TOKEN` in your environment

**Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. Update `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL`

**Razorpay:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Settings → Webhooks
3. Generate new webhook secret
4. Update `RAZORPAY_WEBHOOK_SECRET`

**AI Agent API:**
1. Regenerate your AI agent API key
2. Update `AI_AGENT_API_KEY`

## ✅ Proper Environment Setup

### File Structure
```
project/
├── .env                      # Default values (can be committed, NO SECRETS)
├── .env.local               # Local development (NEVER commit)
├── .env.production          # Production values (NEVER commit)
├── .env.production.example  # Template (safe to commit)
└── .gitignore              # Must include .env*
```

### .gitignore Verification ✅
Your `.gitignore` already includes `.env*` which is correct:
```
.env*
```

This excludes:
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- Any other `.env.*` files

## 🔧 Environment Variable Setup

### 1. Development Environment

**File:** `.env.local` (NEVER commit this file)

```env
# Firebase Client SDK (Public - Safe to expose in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (Server-side - KEEP SECRET)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Payment Gateway (KEEP SECRET)
RAZORPAY_WEBHOOK_SECRET=your_actual_razorpay_webhook_secret_here

# AI Services (KEEP SECRET)
AI_AGENT_API_KEY=your_actual_ai_agent_api_key
GEMINI_API_KEY=your_actual_gemini_api_key

# WhatsApp Business API (KEEP SECRET)
WHATSAPP_ACCESS_TOKEN=your_actual_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_token

# Logging
ENABLE_LOGGING=true
```

### 2. Production Environment

**Option A: Environment Variables (Recommended)**

Set these in your hosting platform (Vercel, Hostinger, AWS, etc.):
```bash
# Via hosting platform dashboard or CLI
FIREBASE_PROJECT_ID=your_production_project_id
FIREBASE_CLIENT_EMAIL=your_production_client_email
FIREBASE_PRIVATE_KEY=your_production_private_key
RAZORPAY_WEBHOOK_SECRET=your_production_webhook_secret
WHATSAPP_ACCESS_TOKEN=your_production_whatsapp_token
# ... etc
```

**Option B: .env.production File (If needed)**

Create `.env.production` locally (NEVER commit):
```env
NODE_ENV=production
ENABLE_LOGGING=false

# Add all production values here
# This file should NEVER be committed to git
```

### 3. Default Values

**File:** `.env` (Safe to commit, NO SECRETS)

```env
# Default/placeholder values only
# NO REAL CREDENTIALS HERE

# Gemini API (optional)
GEMINI_API_KEY=

# Logging Configuration
ENABLE_LOGGING=false
```

## 🔐 Security Best Practices

### DO ✅
- Use `.env.local` for local development secrets
- Use hosting platform's environment variables for production
- Keep `.env*` in `.gitignore`
- Use `.env.production.example` as a template (safe to commit)
- Rotate credentials if they're ever exposed
- Use different credentials for dev/staging/production
- Regularly audit your git history for leaked secrets

### DON'T ❌
- Never commit `.env.local` or `.env.production`
- Never hardcode secrets in source code
- Never share `.env` files via email/Slack
- Never use production credentials in development
- Never commit real API keys or tokens
- Never push secrets to public repositories

## 🚨 If Credentials Were Exposed

### Immediate Response Checklist
1. ⚠️ **Rotate ALL exposed credentials immediately**
2. ⚠️ **Remove files from git history** (use BFG Repo-Cleaner)
3. ⚠️ **Check for unauthorized access** in service dashboards
4. ⚠️ **Enable 2FA** on all services
5. ⚠️ **Monitor for suspicious activity**
6. ⚠️ **Update team members** about the incident

### Remove from Git History
```bash
# Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env files from history
bfg --delete-files .env.local
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: Coordinate with team)
git push --force
```

## 📋 Environment Variables Checklist

### Required for Production
- [ ] `FIREBASE_PROJECT_ID` - Set with real value
- [ ] `FIREBASE_CLIENT_EMAIL` - Set with real value
- [ ] `FIREBASE_PRIVATE_KEY` - Set with real value
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Replace placeholder with real value
- [ ] `WHATSAPP_ACCESS_TOKEN` - Verify and rotate if exposed
- [ ] `WHATSAPP_PHONE_NUMBER_ID` - Set with real value
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` - Set with real value
- [ ] `AI_AGENT_API_KEY` - Set with real value
- [ ] `GEMINI_API_KEY` - Set with real value (if using Gemini)
- [ ] `ENABLE_LOGGING` - Set to `false` for production

### Optional but Recommended
- [ ] `SENTRY_DSN` - For error tracking
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` - For analytics
- [ ] `REDIS_URL` - For caching (if using Redis)

## 🔍 Verification Commands

### Check Git Status
```bash
# Verify .env files are not tracked
git status

# Should NOT show .env.local or .env.production
```

### Check Git History
```bash
# Search for .env files in history
git log --all --full-history -- .env.local
git log --all --full-history -- .env.production

# Should return empty (no commits)
```

### Verify .gitignore
```bash
# Test if .env files are ignored
git check-ignore .env.local
git check-ignore .env.production

# Should output the filenames (meaning they're ignored)
```

## 🚀 Deployment Platforms

### Vercel
```bash
# Set environment variables via CLI
vercel env add FIREBASE_PROJECT_ID production
vercel env add RAZORPAY_WEBHOOK_SECRET production
# ... etc

# Or use Vercel Dashboard:
# Project Settings → Environment Variables
```

### Hostinger VPS
```bash
# SSH into server
ssh user@your-server

# Create .env.production
nano /path/to/app/.env.production

# Add production variables
# Save and exit (Ctrl+X, Y, Enter)

# Set proper permissions
chmod 600 .env.production
```

### AWS / Docker
```dockerfile
# Use secrets management
# AWS Secrets Manager, Parameter Store, or Docker secrets
```

## 📝 Team Onboarding

### For New Developers
1. Clone repository
2. Copy `.env.production.example` to `.env.local`
3. Ask team lead for development credentials
4. Fill in `.env.local` with provided values
5. Never commit `.env.local`

### Documentation to Share
- This file (`SECURITY_ENVIRONMENT_SETUP.md`)
- `.env.production.example` (template)
- Team's credential management policy

## 🎯 Current Status

### ✅ Secure
- `.gitignore` properly configured
- `.env.production.example` template created
- Documentation complete

### ⚠️ Action Required
1. **Verify** `.env.local` is not in git history
2. **Replace** `RAZORPAY_WEBHOOK_SECRET` placeholder with real value
3. **Add** `GEMINI_API_KEY` if using Gemini AI
4. **Rotate** WhatsApp token if it was committed to git
5. **Set** production environment variables in hosting platform

## 📞 Support

If you discover a security issue:
1. **DO NOT** create a public GitHub issue
2. **DO NOT** discuss in public channels
3. **DO** notify team lead immediately
4. **DO** follow incident response checklist above

---

## Summary

Your environment variable setup is mostly secure, but requires immediate action:

1. ✅ `.gitignore` is properly configured
2. ⚠️ Verify no secrets in git history
3. ⚠️ Replace placeholder values with real credentials
4. ⚠️ Rotate credentials if they were exposed
5. ✅ Use hosting platform's environment variables for production

**Next Step:** Run the verification commands above to ensure no secrets are in your git history.
