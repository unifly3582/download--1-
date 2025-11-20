const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./temp-service-account.json'))
  });
}

const db = admin.firestore();

async function debugTestimonials() {
  console.log('\n=== CHECKING FIRESTORE DIRECTLY ===\n');
  
  const snapshot = await db.collection('testimonials')
    .orderBy('displayOrder', 'asc')
    .get();
  
  console.log(`Total testimonials in Firestore: ${snapshot.size}\n`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Name: ${data.customerName}`);
    console.log(`  Location: ${data.customerLocation}`);
    console.log(`  Video ID: ${data.youtubeVideoId}`);
    console.log(`  Display Order: ${data.displayOrder}`);
    console.log(`  Active: ${data.isActive}`);
    console.log(`  Created: ${data.createdAt}`);
    console.log('---');
  });
  
  console.log('\n=== CHECKING API RESPONSE ===\n');
  
  const fetch = (await import('node-fetch')).default;
  
  // Check admin API
  const adminResponse = await fetch('http://localhost:3000/api/admin/testimonials');
  const adminData = await adminResponse.json();
  
  console.log(`Admin API returned: ${adminData.data?.length || 0} testimonials`);
  if (adminData.data) {
    adminData.data.forEach(t => {
      console.log(`  - ${t.customerName} (${t.youtubeVideoId})`);
    });
  }
  
  console.log('\n=== CHECKING CUSTOMER API ===\n');
  
  // Check customer API
  const customerResponse = await fetch('http://localhost:3000/api/customer/testimonials');
  const customerData = await customerResponse.json();
  
  console.log(`Customer API returned: ${customerData.data?.length || 0} testimonials`);
  if (customerData.data) {
    customerData.data.forEach(t => {
      console.log(`  - ${t.customerName} (${t.youtubeVideoId})`);
    });
  }
}

debugTestimonials()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
