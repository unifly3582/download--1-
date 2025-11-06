// Script to initially populate customer cache from Firestore
import { db } from '@/lib/firebase/server';
import { updateCustomerCache } from '@/lib/cache/customerCache';
import { Customer, CustomerSchema } from '@/types/customers';

async function populateCustomerCache() {
  console.log('🔄 Starting customer cache population from Firestore...');
  
  try {
    // Fetch customers from Firestore (prioritize active customers)
    const snapshot = await db.collection('customers')
      .orderBy('totalOrders', 'desc') // Most active customers first
      .limit(1000) // Limit to prevent memory issues
      .get();
    
    console.log(`📥 Fetched ${snapshot.size} customers from Firestore`);
    
    const customers: Customer[] = [];
    let validCount = 0;
    let invalidCount = 0;
    
    snapshot.forEach(doc => {
      try {
        const data = doc.data();
        
        // Convert Firestore timestamps to ISO strings and handle mixed storage
        const customerData = {
          ...data,
          // Use existing customerId if present, otherwise use document ID
          customerId: data.customerId || doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
        
        // Validate customer data
        const validation = CustomerSchema.safeParse(customerData);
        if (validation.success) {
          customers.push(validation.data);
          validCount++;
        } else {
          console.warn(`⚠️  Invalid customer ${doc.id}:`, validation.error.flatten());
          invalidCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing customer ${doc.id}:`, error);
        invalidCount++;
      }
    });
    
    // Update cache with valid customers
    if (customers.length > 0) {
      updateCustomerCache(customers);
      
      console.log('✅ Cache population completed!');
      console.log(`📊 Statistics:`);
      console.log(`   • Valid customers cached: ${validCount}`);
      console.log(`   • Invalid customers skipped: ${invalidCount}`);
      console.log(`   • Cache file created with indexes`);
      console.log(`   • Ready for instant searches!`);
    } else {
      console.log('❌ No valid customers found to cache');
    }
    
  } catch (error) {
    console.error('💥 Error populating cache:', error);
  }
}

// Run the script
if (require.main === module) {
  populateCustomerCache()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { populateCustomerCache };