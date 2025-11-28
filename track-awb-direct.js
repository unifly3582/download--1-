// Track AWB directly via Delhivery API (no Firebase needed)
// Usage: node track-awb-direct.js <AWB> <API_KEY>

const fetch = require('node-fetch');

const awb = process.argv[2] || '31232410021781';
const apiKey = process.argv[3];

if (!apiKey) {
  console.error('❌ Please provide Delhivery API key');
  console.log('Usage: node track-awb-direct.js <AWB> <API_KEY>');
  console.log('Example: node track-awb-direct.js 31232410021781 your_api_key_here');
  process.exit(1);
}

async function trackAWB() {
  console.log(`🔍 Tracking AWB: ${awb}\n`);
  
  try {
    // Call Delhivery tracking API
    console.log('1️⃣ Calling Delhivery API...');
    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Delhivery API error: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const trackingData = await response.json();
    console.log('✅ API response received\n');
    
    // Display raw response
    console.log('2️⃣ RAW DELHIVERY RESPONSE:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(JSON.stringify(trackingData, null, 2));
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Extract key information
    if (trackingData.ShipmentData && trackingData.ShipmentData.length > 0) {
      const shipment = trackingData.ShipmentData[0].Shipment;
      
      console.log('3️⃣ EXTRACTED INFORMATION:');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`AWB: ${shipment.AWB}`);
      console.log(`Status: "${shipment.Status.Status}"`);
      console.log(`Status Location: "${shipment.Status.StatusLocation}"`);
      console.log(`Instructions: "${shipment.Status.Instructions}"`);
      console.log(`Expected Delivery: ${shipment.ExpectedDeliveryDate || 'N/A'}`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Show what our code would do
      console.log('4️⃣ WHAT OUR CODE WOULD DO:');
      console.log('═══════════════════════════════════════════════════════');
      
      const delhiveryStatus = shipment.Status.Status;
      console.log(`Delhivery Status: "${delhiveryStatus}"`);
      
      // Map to internal status (from tracking sync code)
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
      
      // Map to customer status
      const customerStatusMap = {
        'created_pending': 'confirmed',
        'approved': 'processing',
        'ready_for_shipping': 'processing',
        'shipped': 'shipped',
        'in_transit': 'shipped',
        'pending': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'returned': 'returned',
        'return_initiated': 'processing'
      };
      
      const customerStatus = customerStatusMap[internalStatus] || 'processing';
      console.log(`→ Maps to Customer Status: "${customerStatus}"`);
      
      // Check for out for delivery (from tracking sync code)
      const statusLower = (delhiveryStatus || '').toLowerCase().replace(/[_\s-]/g, '');
      const isOutForDelivery = statusLower.includes('outfordelivery') || 
                               statusLower.includes('dispatched');
      
      console.log(`→ Is "Out for Delivery"? ${isOutForDelivery ? '✅ YES' : '❌ NO'}`);
      
      if (isOutForDelivery) {
        console.log(`→ Notification Status: "out_for_delivery"`);
        console.log(`→ Will send: "Out for Delivery" notification`);
      } else if (['shipped', 'in_transit', 'pending'].includes(internalStatus)) {
        console.log(`→ Notification Status: "shipped" (if not already notified)`);
      } else {
        console.log(`→ Notification Status: "${internalStatus}"`);
      }
      
      // Check if tracking should be disabled
      const finalStatuses = ['delivered', 'returned', 'cancelled'];
      const shouldStopTracking = finalStatuses.includes(internalStatus);
      console.log(`→ Stop Tracking? ${shouldStopTracking ? '✅ YES (needsTracking = false)' : '❌ NO (needsTracking = true)'}`);
      
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Check for potential issues
      console.log('5️⃣ ANALYSIS:');
      console.log('═══════════════════════════════════════════════════════');
      
      let issuesFound = false;
      
      // Issue 1: Unknown status
      if (!statusMap[delhiveryStatus]) {
        console.log(`⚠️  WARNING: Status "${delhiveryStatus}" is NOT in our mapping!`);
        console.log(`   It will default to: "in_transit"`);
        console.log(`   You should add this status to the mapping in:`);
        console.log(`   src/app/api/tracking/sync/route.ts`);
        issuesFound = true;
      }
      
      // Issue 2: RTO status
      if (delhiveryStatus.includes('RTO')) {
        console.log(`⚠️  RTO DETECTED: This order is being returned`);
        console.log(`   Internal Status: "${internalStatus}"`);
        console.log(`   Customer Status: "${customerStatus}"`);
        console.log(`   Tracking will ${shouldStopTracking ? 'STOP' : 'CONTINUE'}`);
        
        if (delhiveryStatus === 'RTO Initiated') {
          console.log(`   ℹ️  Package is on the way back to you`);
        } else if (delhiveryStatus === 'RTO Delivered') {
          console.log(`   ℹ️  Package has been returned to you`);
        }
        issuesFound = true;
      }
      
      // Issue 3: Delivered
      if (delhiveryStatus === 'Delivered') {
        console.log(`✅ Order is DELIVERED`);
        console.log(`   Tracking will be disabled (needsTracking = false)`);
        console.log(`   ⚠️  Note: "Delivered" notification template is NOT enabled yet`);
      }
      
      // Issue 4: Customer status mapping for RTO
      if (internalStatus === 'return_initiated' && customerStatus === 'processing') {
        console.log(`⚠️  CUSTOMER STATUS ISSUE:`);
        console.log(`   Internal: "return_initiated" → Customer: "processing"`);
        console.log(`   This might confuse customers. Consider adding:`);
        console.log(`   'return_initiated': 'returning' or 'returned'`);
        issuesFound = true;
      }
      
      if (!issuesFound && delhiveryStatus !== 'Delivered') {
        console.log('✅ No issues detected. Status is handled correctly.');
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Summary
      console.log('📊 SUMMARY:');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Delhivery: "${delhiveryStatus}"`);
      console.log(`Internal: "${internalStatus}"`);
      console.log(`Customer: "${customerStatus}"`);
      console.log(`Notification: ${isOutForDelivery ? '"out_for_delivery"' : (internalStatus === 'shipped' ? '"shipped"' : 'none')}`);
      console.log(`Tracking: ${shouldStopTracking ? 'DISABLED' : 'ENABLED'}`);
      console.log('═══════════════════════════════════════════════════════');
      
    } else {
      console.log('❌ No shipment data found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

trackAWB()
  .then(() => {
    console.log('\n✅ Tracking complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
