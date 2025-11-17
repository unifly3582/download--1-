/**
 * Check Firestore Index Status
 * Run with: node check-firestore-indexes.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkIndexes() {
  console.log('🔍 Checking Firestore indexes...\n');
  
  try {
    // Try to run the query that requires the index
    console.log('Testing query: testimonials where isActive=true, ordered by displayOrder and createdAt');
    
    const snapshot = await db
      .collection('testimonials')
      .where('isActive', '==', true)
      .orderBy('displayOrder', 'asc')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    console.log('✅ Index is ready!');
    console.log(`Found ${snapshot.size} testimonial(s)`);
    
    if (snapshot.size > 0) {
      const doc = snapshot.docs[0];
      console.log('\nSample testimonial:');
      console.log('- ID:', doc.id);
      console.log('- Customer:', doc.data().customerName);
      console.log('- Active:', doc.data().isActive);
      console.log('- Display Order:', doc.data().displayOrder);
    } else {
      console.log('\nℹ️  No testimonials in database yet. You can add one from the admin dashboard.');
    }
    
  } catch (error) {
    if (error.code === 9 || error.message.includes('index')) {
      console.log('⏳ Index is still building...');
      console.log('This usually takes 2-5 minutes.');
      console.log('\nYou can check the status here:');
      console.log('https://console.firebase.google.com/project/buggly-adminpanel/firestore/indexes');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

checkIndexes();
