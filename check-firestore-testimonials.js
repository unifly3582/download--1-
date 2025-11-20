/**
 * Check Firestore Testimonials Collection Directly
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./temp-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFirestoreTestimonials() {
  try {
    console.log('🔍 Checking Firestore testimonials collection...\n');
    
    // Get all testimonials
    const allSnapshot = await db.collection('testimonials').get();
    console.log(`📊 Total documents in collection: ${allSnapshot.size}\n`);
    
    if (allSnapshot.empty) {
      console.log('❌ No testimonials found in Firestore!');
      console.log('\n💡 To add testimonials:');
      console.log('   1. Go to http://localhost:3000/testimonials');
      console.log('   2. Click "Add Testimonial"');
      console.log('   3. Fill in the form and save');
      return;
    }
    
    console.log('📋 All Testimonials:\n');
    console.log('='.repeat(80));
    
    allSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. ID: ${doc.id}`);
      console.log(`   Customer: ${data.customerName}`);
      console.log(`   Location: ${data.customerLocation}`);
      console.log(`   Video ID: ${data.youtubeVideoId}`);
      console.log(`   Active: ${data.isActive ? '✅' : '❌'}`);
      console.log(`   Display Order: ${data.displayOrder}`);
      if (data.title) console.log(`   Title: ${data.title}`);
      if (data.description) console.log(`   Description: ${data.description}`);
      console.log(`   Created: ${data.createdAt}`);
    });
    
    // Get only active testimonials
    console.log('\n' + '='.repeat(80));
    const activeSnapshot = await db
      .collection('testimonials')
      .where('isActive', '==', true)
      .get();
    
    console.log(`\n✅ Active testimonials: ${activeSnapshot.size}`);
    console.log(`❌ Inactive testimonials: ${allSnapshot.size - activeSnapshot.size}`);
    
    if (activeSnapshot.size === 0) {
      console.log('\n⚠️  No active testimonials found!');
      console.log('   Make sure to toggle "Active" ON when creating testimonials');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if temp-service-account.json exists');
    console.error('   2. Verify Firebase project is correct');
    console.error('   3. Check Firestore rules allow read access');
  }
}

checkFirestoreTestimonials()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
