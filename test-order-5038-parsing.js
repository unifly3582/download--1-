// Test if order 5038 can be parsed by the schema
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

const db = admin.firestore();

// Helper function to ensure datetime strings have timezone
const ensureDatetimeFormat = (dateStr) => {
  if (!dateStr) return dateStr;
  if (typeof dateStr !== 'string') return dateStr;
  // If it's already a valid ISO datetime with timezone, return as is
  if (dateStr.match(/Z$/) || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    return dateStr;
  }
  // If it's missing timezone, add Z (UTC)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    return dateStr + 'Z';
  }
  return dateStr;
};

async function testOrderParsing() {
  console.log('🧪 Testing Order 5038 Parsing...\n');

  try {
    const orderDoc = await db.collection('orders').doc('5038').get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found');
      return;
    }

    const data = orderDoc.data();
    console.log('✅ Order fetched from Firestore\n');

    // Serialize dates (same logic as API)
    const dataWithSerializableDates = {
      ...data,
      id: orderDoc.id,
      createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data?.createdAt,
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
      approval: { 
        ...data?.approval, 
        approvedAt: data?.approval?.approvedAt?.toDate ? 
          data.approval.approvedAt.toDate().toISOString() : 
          data?.approval?.approvedAt 
      },
      // Fix delivery estimate dates
      deliveryEstimate: data?.deliveryEstimate ? {
        ...data.deliveryEstimate,
        expectedDate: ensureDatetimeFormat(data.deliveryEstimate.expectedDate),
        earliestDate: ensureDatetimeFormat(data.deliveryEstimate.earliestDate),
        latestDate: ensureDatetimeFormat(data.deliveryEstimate.latestDate),
      } : undefined,
      // Fix customer notifications dates
      customerNotifications: data?.customerNotifications ? {
        ...data.customerNotifications,
        lastNotificationSent: ensureDatetimeFormat(data.customerNotifications.lastNotificationSent),
      } : undefined,
      // Fix shipment info dates
      shipmentInfo: data?.shipmentInfo ? {
        ...data.shipmentInfo,
        lastTrackedAt: ensureDatetimeFormat(data.shipmentInfo.lastTrackedAt),
        shippedAt: ensureDatetimeFormat(data.shipmentInfo.shippedAt),
      } : undefined,
    };

    console.log('📅 Serialized Dates:');
    console.log('   createdAt:', dataWithSerializableDates.createdAt);
    console.log('   updatedAt:', dataWithSerializableDates.updatedAt);
    console.log('   approval.approvedAt:', dataWithSerializableDates.approval?.approvedAt);
    console.log('   deliveryEstimate.expectedDate:', dataWithSerializableDates.deliveryEstimate?.expectedDate);
    console.log('   customerNotifications.lastNotificationSent:', dataWithSerializableDates.customerNotifications?.lastNotificationSent);
    console.log('   shipmentInfo.lastTrackedAt:', dataWithSerializableDates.shipmentInfo?.lastTrackedAt);
    console.log('');

    console.log('📦 Order Items:');
    dataWithSerializableDates.items?.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.productName}`);
      console.log(`      - productId: ${item.productId}`);
      console.log(`      - variationId: ${item.variationId}`);
      console.log(`      - quantity: ${item.quantity}`);
      console.log(`      - unitPrice: ${item.unitPrice}`);
      console.log(`      - sku: ${item.sku}`);
      console.log(`      - totalPrice: ${item.totalPrice} (legacy field)`);
    });
    console.log('');

    console.log('✅ Order data serialized successfully!');
    console.log('');
    console.log('📄 Full Serialized Data:');
    console.log(JSON.stringify(dataWithSerializableDates, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOrderParsing()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
