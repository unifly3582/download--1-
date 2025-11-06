// Automatic cache population on server startup
import { getCacheStats, updateCustomerCache } from './customerCache';
import { db } from '@/lib/firebase/server';
import { Customer, CustomerSchema } from '@/types/customers';

let isPopulating = false;

/**
 * Auto-populate cache if it's empty or expired
 * Called automatically when cache is accessed
 */
export async function autoPopulateCache(): Promise<boolean> {
  // Prevent multiple simultaneous population attempts
  if (isPopulating) {
    console.log('[AUTO_CACHE] Population already in progress, skipping');
    return false;
  }
  
  const stats = getCacheStats();
  
  // Check if cache needs population
  const needsPopulation = !stats.cached || stats.isExpired;
  
  if (!needsPopulation) {
    console.log('[AUTO_CACHE] Cache is healthy, no population needed');
    return false;
  }
  
  console.log('[AUTO_CACHE] Cache needs population, starting background fetch...');
  isPopulating = true;
  
  try {
    // Fetch top customers from Firestore (background operation)
    const snapshot = await db.collection('customers')
      .orderBy('totalOrders', 'desc')
      .limit(500) // Smaller limit for auto-population
      .get();
    
    const customers: Customer[] = [];
    
    snapshot.forEach(doc => {
      try {
        const data = doc.data();
        const customerData = {
          ...data,
          // Use existing customerId if present, otherwise use document ID
          customerId: data.customerId || doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
        
        const validation = CustomerSchema.safeParse(customerData);
        if (validation.success) {
          customers.push(validation.data);
        }
      } catch (error) {
        // Silently skip invalid customers in auto-population
      }
    });
    
    if (customers.length > 0) {
      updateCustomerCache(customers);
      console.log(`[AUTO_CACHE] Auto-populated cache with ${customers.length} customers`);
      return true;
    }
    
  } catch (error) {
    console.error('[AUTO_CACHE] Auto-population failed:', error);
  } finally {
    isPopulating = false;
  }
  
  return false;
}

/**
 * Smart cache population - only populates if needed
 */
export async function ensureCachePopulated(): Promise<void> {
  const stats = getCacheStats();
  
  if (!stats.cached) {
    console.log('[CACHE] No cache found, triggering auto-population');
    await autoPopulateCache();
  } else if (stats.isExpired) {
    console.log('[CACHE] Cache expired, triggering background refresh');
    // Don't await - let it happen in background
    autoPopulateCache().catch(error => {
      console.error('[CACHE] Background refresh failed:', error);
    });
  }
}