/**
 * Migration Script: Normalize Phone Numbers in Orders
 * 
 * This script updates all orders to use the standard +91XXXXXXXXXX phone format
 * 
 * BEFORE RUNNING:
 * 1. Backup your Firestore database
 * 2. Test on a small batch first (set DRY_RUN = true)
 * 3. Review the changes before applying
 * 
 * USAGE:
 * node migrate-normalize-phone-numbers.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./temp-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Configuration
const DRY_RUN = true; // Set to false to actually update
const BATCH_SIZE = 500; // Process in batches

function normalizePhone(phone) {
  if (!phone) return null;
  
  // Extract only digits
  const digits = phone.replace(/[^0-9]/g, '');
  
  // Get last 10 digits (Indian mobile number)
  const last10 = digits.slice(-10);
  
  // Return in standard format
  return `+91${last10}`;
}

async function migratePhoneNumbers() {
  console.log('\n=== PHONE NUMBER NORMALIZATION MIGRATION ===\n');
  console.log('Mode:', DRY_RUN ? '🔍 DRY RUN (no changes)' : '✍️  LIVE UPDATE');
  console.log('');

  try {
    let totalOrders = 0;
    let ordersToUpdate = 0;
    let ordersUpdated = 0;
    let errors = 0;
    
    const updates = [];
    
    // Get all orders in batches
    let lastDoc = null;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Fetching batch (starting after ${lastDoc?.id || 'beginning'})...`);
      
      let query = db.collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(BATCH_SIZE);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      totalOrders += snapshot.size;
      
      console.log(`Processing ${snapshot.size} orders...`);
      
      // Check each order
      for (const doc of snapshot.docs) {
        const order = doc.data();
        const currentPhone = order.customerInfo?.phone;
        
        if (!currentPhone) {
          console.warn(`⚠️  Order ${order.orderId} has no phone number`);
          continue;
        }
        
        const normalizedPhone = normalizePhone(currentPhone);
        
        // Check if phone needs updating
        if (currentPhone !== normalizedPhone) {
          ordersToUpdate++;
          
          updates.push({
            orderId: order.orderId,
            docId: doc.id,
            oldPhone: currentPhone,
            newPhone: normalizedPhone,
            customerName: order.customerInfo?.name
          });
          
          if (!DRY_RUN) {
            try {
              await doc.ref.update({
                'customerInfo.phone': normalizedPhone,
                'updatedAt': admin.firestore.FieldValue.serverTimestamp()
              });
              ordersUpdated++;
              
              if (ordersUpdated % 50 === 0) {
                console.log(`  ✅ Updated ${ordersUpdated} orders...`);
              }
            } catch (error) {
              console.error(`  ❌ Failed to update order ${order.orderId}:`, error.message);
              errors++;
            }
          }
        }
      }
      
      console.log(`Batch complete. Total processed: ${totalOrders}`);
      console.log('');
      
      // Optional: Add delay between batches to avoid rate limits
      if (hasMore && !DRY_RUN) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Summary
    console.log('=