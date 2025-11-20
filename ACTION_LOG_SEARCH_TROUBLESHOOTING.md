# Action Log Search - Troubleshooting Guide

## Issue: Order Not Found

If you search for an order and get "Order not found", here's what to check:

### 1. Verify Order Exists

Check if the order exists in your database:
```javascript
// Run this in Firebase Console or a test script
db.collection('orders')
  .where('orderId', '==', '5085')
  .get()
  .then(snapshot => {
    console.log('Found:', snapshot.size, 'orders');
    snapshot.forEach(doc => {
      console.log('Document ID:', doc.id);
      console.log('Order ID:', doc.data().orderId);
    });
  });
```

### 2. Check Order ID Format

Make sure you're entering the correct format:
- ✅ Just the number: `5085`
- ✅ With prefix if used: `ORD-5085`
- ❌ Don't include #: `#5085`

### 3. How Search Works

The search now uses a **two-step approach**:

**Step 1: Direct Document Lookup**
```
GET /api/orders/5085
```
Tries to find order where Firestore document ID = "5085"

**Step 2: Field Search (if Step 1 fails)**
```
GET /api/orders/search?searchType=orderId&query=5085&status=all
```
Searches for orders where `orderId` field = "5085"

### 4. Common Issues

**Issue: "Order not found" but order exists**

**Possible Causes:**
1. Order ID mismatch between document ID and orderId field
2. Typo in order ID
3. Order ID has different format (e.g., "ORD-5085" vs "5085")

**Solution:**
- Check exact orderId in database
- Try searching with different formats
- Check browser console for errors

**Issue: Search is slow**

**Cause:** Searching through all orders when document lookup fails

**Solution:** This is normal for field-based search. First result is cached.

**Issue: Wrong order appears**

**Cause:** Multiple orders with similar IDs (e.g., 5085, 50851, 50852)

**Solution:** The search returns the first exact match. Check if orderId is unique.

### 5. Testing the Search

**Test 1: Direct Document ID**
```
1. Go to /action-logs
2. Enter: 5085
3. Click Search
4. Should find order if document ID = "5085"
```

**Test 2: Field-based Search**
```
1. Go to /action-logs
2. Enter: 5085
3. Click Search
4. Should find order if orderId field = "5085"
```

**Test 3: Non-existent Order**
```
1. Go to /action-logs
2. Enter: 99999
3. Click Search
4. Should show "Order not found"
```

### 6. Debug Mode

To see what's happening, open browser console (F12) and look for:
```
Network tab:
- GET /api/orders/5085 (first attempt)
- GET /api/orders/search?... (second attempt if first fails)

Console tab:
- Any error messages
- API responses
```

### 7. API Response Examples

**Success (Direct Lookup):**
```json
{
  "success": true,
  "order": {
    "id": "5085",
    "orderId": "5085",
    "customerInfo": {...},
    "shipmentInfo": {
      "actionLog": [...]
    }
  }
}
```

**Success (Search):**
```json
{
  "success": true,
  "data": [{
    "id": "abc123",
    "orderId": "5085",
    "customerInfo": {...},
    "shipmentInfo": {
      "actionLog": [...]
    }
  }],
  "count": 1
}
```

**Not Found:**
```json
{
  "success": false,
  "error": "Order not found"
}
```

### 8. Quick Fixes

**Fix 1: Clear Browser Cache**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Fix 2: Check Authentication**
- Make sure you're logged in as admin
- Check if session is still valid

**Fix 3: Verify API Endpoints**
```
Test in browser:
http://localhost:3000/api/orders/5085
```

### 9. Database Structure

Orders should have this structure:
```
orders/
  ├─ {documentId}/
  │   ├─ orderId: "5085"
  │   ├─ customerInfo: {...}
  │   ├─ shipmentInfo:
  │   │   ├─ actionLog: [
  │   │   │   {actionId, timestamp, ...}
  │   │   │ ]
```

### 10. Still Not Working?

If search still fails:

1. **Check Firestore Rules**
   - Ensure admin has read access to orders collection

2. **Check API Logs**
   - Look at server console for errors
   - Check if API is being called

3. **Verify Order Data**
   - Open order in Orders page
   - Check if orderId field exists
   - Verify action logs exist

4. **Test with Different Order**
   - Try searching for a different order
   - If that works, issue is with specific order

---

## Updated Search Logic

The search now handles both cases:
- ✅ Document ID matches orderId
- ✅ Document ID differs from orderId field
- ✅ Searches all order statuses
- ✅ Returns first matching order

---

**Status:** ✅ Enhanced Search Implemented
**Version:** 2.1 with Fallback Search
**Date:** November 20, 2025
