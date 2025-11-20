# Action Log Search - Authentication Fix

## Issue: 401 Unauthorized Error

When searching for orders in the Action Log page, you're getting:
```
HTTP error! status: 401
```

## Root Cause

The search API requires **admin authentication**. You need to be logged in as an admin user to search orders.

## ✅ Solution

### Step 1: Log In as Admin

1. Navigate to your login page (usually `/login` or `/auth/login`)
2. Enter your admin credentials
3. Log in successfully

### Step 2: Verify You're Logged In

Check if you can access other admin pages:
- Go to `/orders` - Can you see orders?
- Go to `/customers` - Can you see customers?
- If yes, you're logged in ✅

### Step 3: Try Action Log Search Again

1. Go to `/action-logs`
2. Enter order ID: `5085`
3. Click "Search"
4. Should work now! ✅

## Why Authentication is Required

The Action Log Management page uses the search API:
```
GET /api/orders/search?searchType=orderId&query=5085&status=all
```

This API endpoint is protected with `withAuth(['admin'])` middleware, which means:
- ✅ Only authenticated admin users can access it
- ❌ Unauthenticated requests get 401 error
- ✅ This is correct for security

## Verification

Order 5085 exists in your database:
```
✅ Document ID: 5085
✅ Order ID: 5085
✅ Customer: Mainak das
✅ Phone: +919007971004
✅ Status: shipped
```

The search works - you just need to be logged in!

## Quick Test

After logging in, test with this order:
- **Order ID**: 5085
- **Customer**: Mainak das
- **Status**: shipped
- **Action Logs**: 0 (none yet - you can add some!)

## Common Issues

### Issue: "Still getting 401 after logging in"

**Possible causes:**
1. Session expired - log in again
2. Not logged in as admin - check your role
3. Cookie issues - clear browser cookies

**Solution:**
1. Log out completely
2. Clear browser cache/cookies
3. Log in again as admin
4. Try search again

### Issue: "Can access other pages but not action logs"

**This shouldn't happen** - if you can access `/orders`, you should be able to access `/action-logs`.

**Debug steps:**
1. Open browser console (F12)
2. Go to Network tab
3. Try searching
4. Check the request headers
5. Look for `Authorization` or `Cookie` headers

### Issue: "Don't have admin credentials"

**Solution:**
1. Contact your system administrator
2. Or create an admin user in Firebase Auth
3. Set custom claims: `{ role: 'admin' }`

## Testing Without Login (Not Recommended)

If you want to test the API directly:

```javascript
// This won't work without auth
fetch('/api/orders/search?searchType=orderId&query=5085&status=all')
  .then(r => r.json())
  .then(console.log);
// Returns: 401 Unauthorized

// You need to be logged in first!
```

## Summary

✅ **Order 5085 exists** in database
✅ **Search API works** correctly
✅ **Authentication required** (as it should be)
❌ **You need to log in** as admin

**Next step:** Log in as admin, then try searching again!

---

**Status:** Authentication Required
**Order Status:** Exists and ready to search
**Fix:** Log in as admin user
