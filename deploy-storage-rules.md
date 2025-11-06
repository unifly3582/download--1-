# Deploy Storage Rules

Since automatic deployment requires Firebase CLI authentication, you can manually update the storage rules in the Firebase Console:

## Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bugglyadmin`
3. Navigate to **Storage** → **Rules**
4. Replace the current rules with:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow reads by anyone, which is common for public assets like product images.
    match /products/{allPaths=**} {
      allow read: if true;
      // Allow writes (uploads) only for authenticated users.
      allow write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**

## What Changed:
- Simplified the rules to allow writes to any path under `/products/`
- This matches the upload path pattern: `/products/{timestamp}_{filename}`
- Maintains security by requiring authentication for uploads