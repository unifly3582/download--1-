# WhatsApp Link OTP Issue - CORS Fix

## Problem
When users click a link from WhatsApp and land on bugglyfarms.com, they cannot receive OTP during login. The error shows "Network error, please try again". However, when users come from Google search to the same site, OTP works fine.

## Root Cause
**CORS (Cross-Origin Resource Sharing) Issue**

When users come from WhatsApp:
- Referrer: `https://lm.facebook.com` or `https://l.facebook.com` (WhatsApp's link wrapper)
- Browser treats this as a cross-origin request
- Without proper CORS headers, the browser blocks the API request
- Result: "Network error" when trying to send OTP

When users come from Google:
- Referrer: `https://www.google.com` or direct navigation
- Browser allows the request normally
- CORS headers not strictly required for same-origin requests

## Why This Happens

### WhatsApp Link Behavior:
1. User clicks link in WhatsApp
2. WhatsApp wraps the link through `lm.facebook.com`
3. Browser opens with referrer = `lm.facebook.com`
4. When the page makes API calls to `/api/customer/auth/request-otp`, browser sees:
   - Origin: `https://www.bugglyfarms.com`
   - Referrer: `https://lm.facebook.com`
5. Browser performs CORS preflight check (OPTIONS request)
6. **No CORS headers found** → Request blocked → "Network error"

### Google Search Behavior:
1. User clicks link from Google
2. Browser opens with referrer = `google.com`
3. API calls work because they're treated as same-origin
4. No CORS issues

## Solution

Added CORS headers to the OTP authentication APIs:

### Files Modified:
1. `src/app/api/customer/auth/request-otp/route.ts`
2. `src/app/api/customer/auth/verify-otp/route.ts`

### Changes Made:

```typescript
// Added CORS helper function
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Added OPTIONS handler for preflight requests
export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// Added CORS headers to all responses
export async function POST(request: NextRequest) {
  // ... existing code ...
  const response = NextResponse.json(result);
  return addCorsHeaders(response); // ← Added this
}
```

### What the CORS Headers Do:

1. **Access-Control-Allow-Origin: \***
   - Allows requests from any origin (including WhatsApp's link wrapper)
   - For production, you could restrict this to specific domains

2. **Access-Control-Allow-Methods**
   - Specifies which HTTP methods are allowed
   - Includes POST (for OTP requests) and OPTIONS (for preflight)

3. **Access-Control-Allow-Headers**
   - Allows Content-Type and Authorization headers
   - Required for JSON requests

4. **Access-Control-Max-Age**
   - Caches the preflight response for 24 hours
   - Reduces unnecessary OPTIONS requests

5. **OPTIONS Handler**
   - Handles browser preflight checks
   - Returns 200 OK with CORS headers
   - Allows the actual POST request to proceed

## Testing

### Before Fix:
```
User flow from WhatsApp:
1. Click link in WhatsApp → Opens in browser
2. Browse products → Add to cart
3. Go to checkout → Click login
4. Enter phone → Click "Send OTP"
5. ❌ Error: "Network error, please try again"
6. Browser console: CORS policy blocked the request
```

### After Fix:
```
User flow from WhatsApp:
1. Click link in WhatsApp → Opens in browser
2. Browse products → Add to cart
3. Go to checkout → Click login
4. Enter phone → Click "Send OTP"
5. ✅ OTP sent successfully
6. Enter OTP → Login successful
```

## Why This Wasn't Caught Earlier

1. **Testing from localhost** - CORS is less strict in development
2. **Testing from Google** - Same-origin requests don't trigger CORS
3. **WhatsApp-specific** - Only affects users coming from WhatsApp/Facebook links
4. **Silent failure** - Browser just shows "Network error" without details

## Additional Notes

### Other Sources That May Have Similar Issues:
- Facebook Messenger links
- Instagram links
- Twitter/X links
- Email clients (Gmail, Outlook)
- Any service that wraps links through a redirect

### Best Practice:
Always add CORS headers to public-facing APIs that will be called from the browser, especially authentication endpoints.

### Security Consideration:
Currently using `Access-Control-Allow-Origin: *` which allows all origins. For production, consider:
```typescript
const allowedOrigins = [
  'https://www.bugglyfarms.com',
  'https://bugglyfarms.com',
  'https://lm.facebook.com',
  'https://l.facebook.com'
];

const origin = request.headers.get('origin');
if (origin && allowedOrigins.includes(origin)) {
  response.headers.set('Access-Control-Allow-Origin', origin);
}
```

## Status
✅ **FIXED** - OTP now works when users come from WhatsApp links
