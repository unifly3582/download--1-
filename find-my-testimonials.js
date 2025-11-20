/**
 * Find Your New Testimonials
 * This script helps diagnose why new testimonials aren't showing
 */

const admin = require('firebase-admin');

// Check if service account exists
const fs = require('fs');
let serviceAccountPath = './temp-service-account.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.log('⚠️  Service account file not found');
  console.log('Using environment variables instead...\n');
  
  // Try to initialize with env vars
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
      });
    } catch (error) {
      console.error('❌ Could not initialize Firebase Admin');
      console.error('Please ensure Firebase environment variables are set in .env.local');
      process.exit(1);
    }
  }
} else {
  // Initialize with service account
  if (!admin.apps.length) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

const db = admin.firestore();

async function findTestimonials() {
  try {
    console.log('🔍 Searching for ALL testimonials in Firestore...\n');
    console.log('='.repeat(80));
    
    const snapshot = await db.collection('testimonials').get();
    
    if (snapshot.empty) {
      console.log('\n❌ No testimonials found in Firestore!');
      console.log('\n💡 To add testimonials:');
      console.log('   1. Go to http://localhost:3000/testimonials');
      console.log('   2. Click "Add Testimonial" button');
      console.log('   3. Fill in the form and click Save');
      return;
    }
    
    console.log(`\n📊 Found ${snapshot.size} total testimonials\n`);
    
    const active = [];
    const inactive = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const testimonial = {
        id: doc.id,
        ...data
      };
      
      if (data.isActive) {
        active.push(testimonial);
      } else {
        inactive.push(testimonial);
      }
    });
    
    console.log(`✅ Active: ${active.length}`);
    console.log(`❌ Inactive: ${inactive.length}\n`);
    console.log('='.repeat(80));
    
    // Show active testimonials
    if (active.length > 0) {
      console.log('\n✅ ACTIVE TESTIMONIALS (these will show on website):\n');
      active
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .forEach((t, i) => {
          console.log(`${i + 1}. ID: ${t.id}`);
          console.log(`   Customer: ${t.customerName}`);
          console.log(`   Location: ${t.customerLocation}`);
          console.log(`   Video ID: ${t.youtubeVideoId}`);
          console.log(`   Display Order: ${t.displayOrder}`);
          console.log(`   Created: ${t.createdAt}`);
          console.log('');
        });
    }
    
    // Show inactive testimonials
    if (inactive.length > 0) {
      console.log('='.repeat(80));
      console.log('\n❌ INACTIVE TESTIMONIALS (hidden from website):\n');
      inactive.forEach((t, i) => {
        console.log(`${i + 1}. ID: ${t.id}`);
        console.log(`   Customer: ${t.customerName}`);
        console.log(`   Location: ${t.customerLocation}`);
        console.log(`   Video ID: ${t.youtubeVideoId}`);
        console.log(`   Display Order: ${t.displayOrder}`);
        console.log(`   Created: ${t.createdAt}`);
        console.log(`   ⚠️  isActive: false - Toggle this ON to show on website`);
        console.log('');
      });
    }
    
    console.log('='.repeat(80));
    console.log('\n💡 Tips:');
    console.log('   • Only ACTIVE testimonials appear on the website');
    console.log('   • Lower displayOrder appears first (0, 1, 2, ...)');
    console.log('   • Edit testimonials at: http://localhost:3000/testimonials');
    console.log('   • Toggle "Active" switch to show/hide testimonials');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Make sure your dev server is running');
    console.error('   2. Check Firebase credentials in .env.local');
    console.error('   3. Verify Firestore database exists');
  } finally {
    process.exit(0);
  }
}

findTestimonials();
