# Server Build Error Fix

## Error Analysis

**Error:** `Cannot read properties of undefined (reading 'replace')`

**Root Cause:** The `FIREBASE_PRIVATE_KEY` environment variable is not set on your server, causing the `.replace()` method to fail.

**Location:** Firebase Admin SDK initialization in `src/lib/firebase/server.ts`

---

## Solution

### 1. Check Environment Variables on Server

SSH into your server and verify the environment variables:

```bash
ssh appuser@srv905850

# Check if .env.production exists
ls -la ~/app/.env.production

# View environment variables (be careful not to expose in logs)
cat ~/app/.env.production | grep FIREBASE
```

### 2. Create/Update .env.production on Server

If the file doesn't exist or is missing variables, create it:

```bash
cd ~/app

# Create .env.production file
nano .env.production
```

Add these required variables:

```env
# Firebase Admin SDK (Server-side - REQUIRED)
FIREBASE_PROJECT_ID=bugglyadmin
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bugglyadmin.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCyi1AtrV6IZlji
KVPqiLQNNIhEFPGL3LtxsIEUV4WtnqFj7pjDDRI3ak9hH7lXSFNOC2wh8COzPi2y
OXVon4kIR2ouFw+7U6CN9htTjugetDw/09DcpNBJmKFRm8YsajTpdQTEtg1puSNJ
muhwdzfY9J9Cqf+gbWrfeatxnUl3kzUp/K+I8EHWXYeGTSCZA4r6iCJnB4IoxtKQ
K/WNC/79pV9J3VBGEqUygRxRJ2mjP0rcFxtlisngvqlp41HyeW5okuNBD+in3IO+
EcCz88CRu93s0w8yPlMF2/QVbEtMsBnhPkhENzF3LbMLXfu+UVnZInQpxe/bOq5s
KlbqHgCvAgMBAAECggEAA+oWVRdezLUYZXD22YarZ+S1yMRVcrW2rayVz+PcAZf0
6DN5dEFLm8fAEMbjcdybPZ6g0seoiLaoGtG0AhoJT5NSlSBv+bFA17aZwnBjehTa
g026Cl8EqrBmzQVncrQrZSOUegRBxrEb6x0IfpAROzegbD485VVbc/sqEpYaX72N
lcwcTVZ6BqVtSkr4JrcsPyD6ccaxWZ4s20rRR4sPhtmEoQoOO9cBO5neNbnOYoRV
CvodvpwOg++2Sd+l2/dOiqq22cKi1YGZPZbhwl1uGRvqYjWqPUS8NvDT7LrYalug
gw/dLInfJHyuCvFy5Naz1kMKfJdBWqDasW9u4Mu4CQKBgQDk/Xm3ohb3Gm5umlAQ
zumzpaSmxHxvR6Lj21TMllQekfJalTifXzZIrpuRtPIqjJHqj2ylOD1drE67i6ds
ukC1C7Hzfx0YZmk9o0Q31pGczIfZL4LvKteG8F2hueYXbgXsOw8VFI1zLwmM1gr5
NzFB3RuY3bwFW1MnWd7790AvVwKBgQDHmpXlYZ4LjRVx4N22uyqBugyCH1s2dUER
ViRao3PVRXlTLdrV65li6RQ50sE1aOxZNOlJTCGo5wqZhOxFf/6M4m44z8noIn2Q
TvwX80tPl9OwgJueZIeGJpcU4PRvGsoYBvt1gyg2IENLPuM1Mg/ZVaNdMFmCHOx9
IadiJ0paaQKBgAs1fSfH/2fJG26+jvzDpBzvFsgzBgRMdWTB77yz/xof+sUEWOk0
N+wG4AaZ3ODIULwymRbdUeOr846qn19rHo++Ks/IgRwYpz4lJ8mz7xzFxkCTWs1q
Q3KPgYXRG7o54IBXw708bFAfFVCXiaH5WafnstogwHtipQdgFtIuoC2xAoGAK+/R
Mw7L1UsW/1w6MbD9aFTlz/bLAy/IROKrWfBE3RtP24lqdFBKEUWxGBFWSkVwUSqe
d230stM4uBZUU/AavjRRgtvqW9jLvupD/5mkaD7JcD6/ApyqYFM6SnRCGfrRpXxT
+cgHH/L2HSgYp2r/ph19ulOcQFHRlLHFwItZiJECgYEAj+rEjtEkfEh1tm4HSS6t
XUGwY9N7v8Cv7Wcj5tD+4VPBOxOgkRrKmDbo5S/uJSogVoZGWho+D3xBrB6NS3Jn
ppjsRXgYURs1nPfVMPbeCjjv5zqwYl25VkVQBqb0OlW3V5kbYDbUI3DgnL8jtPRQ
MUrXYDh2X9qm65iXiRhtOIw=
-----END PRIVATE KEY-----"

# Other required variables
RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret
WHATSAPP_ACCESS_TOKEN=your_actual_token
WHATSAPP_PHONE_NUMBER_ID=826202023907538
WHATSAPP_BUSINESS_ACCOUNT_ID=1479411936430690
AI_AGENT_API_KEY=your_actual_api_key

# Logging
ENABLE_LOGGING=false
RATE_LIMIT_ENABLED=true
```

**Important:** Make sure the private key is enclosed in quotes and includes the full key with BEGIN/END markers.

### 3. Set Proper File Permissions

```bash
# Secure the environment file
chmod 600 ~/app/.env.production

# Verify ownership
chown appuser:appuser ~/app/.env.production
```

### 4. Rebuild on Server

```bash
cd ~/app

# Clear previous build
rm -rf .next

# Rebuild
npm run build
```

---

## Alternative: Use Environment Variables Directly

If you're using a process manager like PM2, you can set environment variables directly:

### Using PM2

```bash
# Set environment variables
pm2 set FIREBASE_PROJECT_ID bugglyadmin
pm2 set FIREBASE_CLIENT_EMAIL firebase-adminsdk-fbsvc@bugglyadmin.iam.gserviceaccount.com
pm2 set FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Or use ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'your-app',
    script: 'npm',
    args: 'start',
    env_production: {
      NODE_ENV: 'production',
      FIREBASE_PROJECT_ID: 'bugglyadmin',
      FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk-fbsvc@bugglyadmin.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
      // ... other variables
    }
  }]
}
```

Then restart:
```bash
pm2 restart ecosystem.config.js --env production
```

---

## Verification Steps

### 1. Check Environment Variables Are Loaded

Create a test script:

```bash
# Create test file
nano test-env.js
```

```javascript
// test-env.js
require('dotenv').config({ path: '.env.production' });

console.log('Environment Variables Check:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Set' : '✗ Missing');
console.log('RAZORPAY_WEBHOOK_SECRET:', process.env.RAZORPAY_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing');
console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✓ Set' : '✗ Missing');
```

Run it:
```bash
node test-env.js
```

### 2. Test Build

```bash
npm run build
```

Should complete without errors.

### 3. Test Server Start

```bash
npm run start
```

Should start without Firebase initialization errors.

---

## Code Fix Applied

Updated `src/lib/firebase/server.ts` to provide better error messages:

**Before:**
```typescript
privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
```

**After:**
```typescript
// Validate required environment variables first
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  const missing = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
  
  throw new Error(
    `Missing required Firebase environment variables: ${missing.join(', ')}`
  );
}

// Then use them
privateKey: privateKey.replace(/\\n/g, '\n'),
```

This provides a clear error message about which variables are missing.

---

## Common Issues

### Issue 1: Private Key Format
**Problem:** Private key has literal `\n` instead of newlines

**Solution:** Ensure the key is in quotes and has actual newlines:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
actual newline here
not \n
-----END PRIVATE KEY-----"
```

### Issue 2: File Not Loaded
**Problem:** `.env.production` exists but not loaded

**Solution:** Next.js automatically loads `.env.production` in production. Ensure:
- File is in the root directory
- File is named exactly `.env.production`
- `NODE_ENV=production` is set

### Issue 3: PM2 Not Loading Env File
**Problem:** PM2 doesn't load `.env.production`

**Solution:** Use ecosystem.config.js or set variables directly in PM2

---

## Quick Fix Checklist

- [ ] SSH into server
- [ ] Check if `.env.production` exists
- [ ] Verify all Firebase variables are set
- [ ] Check private key format (with quotes and newlines)
- [ ] Set file permissions (chmod 600)
- [ ] Clear build cache (rm -rf .next)
- [ ] Rebuild (npm run build)
- [ ] Test start (npm run start)
- [ ] Verify no Firebase errors in logs

---

## Summary

**Root Cause:** Missing `FIREBASE_PRIVATE_KEY` environment variable on server

**Solution:** Create/update `.env.production` file on server with all required Firebase credentials

**Verification:** Run `npm run build` - should complete without errors

**Next Steps:** After fixing, rebuild and restart your application

---

## Need Help?

If the issue persists:

1. Check server logs: `pm2 logs` or `journalctl -u your-service`
2. Verify environment: `node test-env.js`
3. Check file permissions: `ls -la .env.production`
4. Ensure correct directory: `pwd` should show `/home/appuser/app`

The code fix has been applied to provide better error messages. Now you need to set the environment variables on your server.
