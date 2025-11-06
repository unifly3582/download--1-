# Check Firebase Storage Usage

## Steps to check what's using your storage:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `bugglyadmin`
3. Navigate to **Storage**
4. Check the **Files** tab to see what's stored
5. Look for large files or unnecessary uploads
6. Delete files you don't need

## Current Storage Limits (Spark Plan - Free):
- **Storage**: 1 GB total
- **Downloads**: 10 GB/month
- **Uploads**: 20,000 files/day

## If you need to clean up:
- Delete test images
- Remove duplicate uploads
- Compress images before uploading
- Consider using external image hosting for development

## Temporary Workaround:
You can also use a different Firebase project for development/testing to avoid hitting production limits.