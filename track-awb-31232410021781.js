// Track specific AWB via Delhivery API and analyze the response

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./temp-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function trackAWB() {
  const awb = '31232410021781';
  
  console.log(`🔍 Tracking AWB: ${awb}\n`);
  
  try {
    // Step 1: Get Delhivery API key
    console.log('1️⃣ Getting Delhivery API key...');
    const settingsDoc = await db.collection('courierIntegrations').doc('delhivery').get();
    const apiKey = settingsDoc.data()?.api?.authKey;
    
    if (!apiKey) {
      console.error('❌ Delhivery API key not found');
      return;
    }
    console.log('✅ API key found\n');
    
    // Step 2: Call Delhivery tracking API
    console.log('2️⃣ Calling Delhivery tracking API...');
    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Delhivery API error: ${response.status}`);
      return;
    }
    
    const trackingData = await response.json();
    console.log('✅ API response received\n');
    
    // Step 3: Display raw response
    console.log('3️⃣ RAW DELHIVERY RESPONSE:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(JSON.stringify(trackingData, null, 2));
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Step 4: Extract key information
    if (trackingData.ShipmentData && trackingData.ShipmentData.length > 0) {
      const shipment = trackingData.ShipmentData[0].Shipment;
      
      console.log('4️⃣ EXTRACTED INFORMATION:');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`AWB: ${shipment.AWB}`);
      console.log(`Status: "${shipment.Status.Status}"`);
      console.log(`Status Location: "${shipment.Status.StatusLocation}"`);
      console.log(`Instructions: "${shipment.Status.Instructions}"`);
      console.log(`Expected Delivery: ${shipment.ExpectedDeliveryDate || 'N/A'}`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Step 5: Show what our code would do
      console.log('5️⃣ WHAT OUR CODE WOULD DO:');
      console.log('═══════════════════════════════════════════════════════');
      
      const delhiveryStatus = shipment.Status.Status;
      console.log(`Delhivery Status: "${delhiveryStatus}"`);
      
      // Map to internal status
      const statusMap = {
        'Manifested': 'shipped',
        'Not Picked': 'shipped',
        'In Transit': 'in_transit',
        'Pending': 'pending',
        'Dispatched': 'in_transit',
        'Out for Delivery': 'in_transit',
        'Out-for-Delivery': 'in_transit',
        'Delivered': 'delivered',
        'RTO Initiated': 'return_initiated',
        'RTO Delivered': 'returned'
      };
      
      const internalStatus = statusMap[delhiveryStatus] || 'in_transit';
      console.log(`→ Maps to Internal Status: "${internalStatus}"`);
      
      // Check for out for delivery
      const statusLower = (delhiveryStatus || '').toLowerCase().replace(/[_\s-]/g, '');
      const isOutForDelivery = statusLower.includes('outfordelivery') || 
                               statusLower.includes('dispatched');
      
      console.log(`→ Is "Out for Delivery"? ${isOutForDelivery ? '✅ YES' : '❌ NO'}`);
      
      if (isOutForDelivery) {
        console.log(`→ Notification Status: "out_for_delivery"`);
      } else if (['shipped', 'in_transit', 'pending'].includes(internalStatus)) {
        console.log(`→ Notification Status: "shipped" (if not already notified)`);
      } else {
        console.log(`→ Notification Status: "${internalStatus}"`);
      }
      
      // Check if tracking should be disabled
      const finalStatuses = ['delivered', 'returned', 'cancelled'];
      const shouldStopTracking = finalStatuses.includes(internalStatus);
      console.log(`→ Stop Tracking? ${shouldStopTracking ? '✅ YES' : '❌ NO'}`);
      
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Step 6: Check for potential issues
      console.log('6️⃣ POTENTIAL ISSUES:');
      console.log('═══════════════════════════════════════════════════════');
      
      let issuesFound = false;
      
      // Issue 1: Unknown status
      if (!statusMap[delhiveryStatus]) {
        console.log(`⚠️  WARNING: Status "${delhiveryStatus}" is not in our mapping!`);
        console.log(`   It will default to: "in_transit"`);
        issuesFound = true;
      }
      
      // Issue 2: RTO status
      if (delhiveryStatus.includes('RTO')) {
        console.log(`⚠️  RTO DETECTED: This order is being returned`);
        console.log(`   Internal Status: "${internalStatus}"`);
        console.log(`   Tracking will ${shouldStopTracking ? 'STOP' : 'CONTINUE'}`);
        issuesFound = true;
      }
      
      // Issue 3: Delivered but still tracking
      if (delhiveryStatus === 'Delivered') {
        console.log(`✅ Order is delivered`);
        console.log(`   Tracking will be disabled`);
        console.log(`   needsTracking will be set to: false`);
      }
      
      if (!issuesFound && delhiveryStatus !== 'Delivered') {
        console.log('✅ No issues detected. Status is handled correctly.');
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Step 7: Find this order in our database
      console.log('7️⃣ CHECKING OUR DATABASE:');
      console.log('═══════════════════════════════════════════════════════');
      
      const ordersQuery = await db.collection('orders')
        .where('shipmentInfo.awb', '==', awb)
        .limit(1)
        .get();
      
      if (!ordersQuery.empty) {
        const orderDoc = ordersQuery.docs[0];
        const order = orderDoc.data();
        
        console.log(`Order ID: ${order.orderId}`);
        console.log(`Current Internal Status: "${order.internalStatus}"`);
        console.log(`Current Tracking Status: "${order.shipmentInfo?.currentTrackingStatus || 'N/A'}"`);
        console.log(`Needs Tracking: ${order.needsTracking}`);
        console.log(`Last Notified Status: ${order.notificationHistory?.lastNotifiedStatus || 'NONE'}`);
        console.log(`Last Tracked At: ${order.shipmentInfo?.lastTrackedAt || 'N/A'}`);
        
        // Compare with what Delhivery says
        console.log('\nCOMPARISON:');
        if (order.shipmentInfo?.currentTrackingStatus !== delhiveryStatus) {
          console.log(`⚠️  Status mismatch!`);
          console.log(`   Our DB: "${order.shipmentInfo?.currentTrackingStatus}"`);
          console.log(`   Delhivery: "${delhiveryStatus}"`);
          console.log(`   → Tracking sync will update this`);
        } else {
          console.log(`✅ Status matches Delhivery`);
        }
        
        if (order.internalStatus !== internalStatus) {
          console.log(`⚠️  Internal status mismatch!`);
          console.log(`   Our DB: "${order.internalStatus}"`);
          console.log(`   Should be: "${internalStatus}"`);
          console.log(`   → Tracking sync will update this`);
        } else {
          console.log(`✅ Internal status is correct`);
        }
        
      } else {
        console.log(`❌ Order with AWB ${awb} not found in database`);
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
      
    } else {
      console.log('❌ No shipment data found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

trackAWB()
  .then(() => {
    console.log('✅ Tracking complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
