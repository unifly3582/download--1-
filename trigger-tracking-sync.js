// Script to manually trigger tracking sync via API
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

async function triggerSync() {
  console.log('🚀 Triggering tracking sync via API...\n');

  try {
    // Get a custom token for authentication
    const customToken = await admin.auth().createCustomToken('machine-sync-user', {
      role: 'machine'
    });

    console.log('✅ Generated auth token');

    // Call the tracking sync API
    const response = await fetch('http://localhost:9006/api/tracking/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    console.log('\n📊 Sync Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Sync completed successfully!');
      console.log(`   - Orders processed: ${result.stats?.ordersProcessed || 0}`);
      console.log(`   - Status updates: ${result.stats?.statusUpdates || 0}`);
      console.log(`   - API calls: ${result.stats?.apiCalls || 0}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered: ${result.errors.length}`);
        result.errors.forEach((err, i) => {
          console.log(`   ${i + 1}. ${err.error}`);
        });
      }
    } else {
      console.log('\n❌ Sync failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Error triggering sync:', error.message);
  }
}

// Run the sync
triggerSync()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
