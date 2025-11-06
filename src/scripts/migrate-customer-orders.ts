/**
 * Migration script to sync existing orders to customerOrders collection
 * Run this once to populate the customer orders collection with existing data
 */

import { db } from '@/lib/firebase/server';
import { syncCustomerOrder } from '@/lib/oms/customerOrderSync';
import type { Order } from '@/types/order';

async function migrateCustomerOrders() {
  console.log('Starting customer orders migration...');
  
  try {
    // Get all orders (in batches to avoid memory issues)
    const batchSize = 100;
    let lastDoc: any = null;
    let totalMigrated = 0;
    let hasMore = true;
    
    while (hasMore) {
      let query = db.collection('orders')
        .orderBy('createdAt', 'asc')
        .limit(batchSize);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      console.log(`Processing batch of ${snapshot.size} orders...`);
      
      // Process each order in the batch
      for (const doc of snapshot.docs) {
        try {
          const orderData = doc.data() as Order;
          
          // Only sync orders that have customer info
          if (orderData.customerInfo?.customerId) {
            await syncCustomerOrder(doc.id, orderData);
            totalMigrated++;
            
            if (totalMigrated % 10 === 0) {
              console.log(`Migrated ${totalMigrated} orders...`);
            }
          }
          
        } catch (error) {
          console.error(`Failed to migrate order ${doc.id}:`, error);
          // Continue with next order
        }
      }
      
      // Update last document for pagination
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Migration completed! Total orders migrated: ${totalMigrated}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Export for use in API endpoint or direct execution
export { migrateCustomerOrders };

// Uncomment to run directly
// migrateCustomerOrders().catch(console.error);