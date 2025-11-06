// Customer data synchronization strategies
import { Customer } from '@/types/customers';
import { updateSingleCustomerInCache, updateCustomerCache, getCacheStats } from './customerCache';
import { db } from '@/lib/firebase/server';

export type SyncStrategy = 'write-through' | 'write-behind' | 'refresh-ahead' | 'manual';

/**
 * STRATEGY 1: Write-Through Cache (Real-time sync)
 * - Updates Firestore AND cache simultaneously
 * - Guarantees data consistency
 * - Slightly slower writes, but always fresh data
 */
export async function writeThrough(customer: Customer) {
  try {
    // 1. Update Firestore first
    await db.collection('customers').doc(customer.phone).set(customer, { merge: true });
    
    // 2. Update cache immediately
    updateSingleCustomerInCache(customer);
    
    console.log(`[SYNC] Write-through completed for ${customer.phone}`);
    return { success: true, strategy: 'write-through' };
  } catch (error: any) {
    console.error('[SYNC] Write-through failed:', error);
    return { success: false, error: error.message, strategy: 'write-through' };
  }
}

/**
 * STRATEGY 2: Write-Behind Cache (Async sync)
 * - Updates cache immediately, Firestore later
 * - Faster response times
 * - Risk of data loss if cache fails before Firestore sync
 */
export async function writeBehind(customer: Customer) {
  try {
    // 1. Update cache immediately
    updateSingleCustomerInCache(customer);
    
    // 2. Schedule Firestore update (async)
    setImmediate(async () => {
      try {
        await db.collection('customers').doc(customer.phone).set(customer, { merge: true });
        console.log(`[SYNC] Write-behind Firestore sync completed for ${customer.phone}`);
      } catch (error) {
        console.error(`[SYNC] Write-behind Firestore sync failed for ${customer.phone}:`, error);
        // Could implement retry logic here
      }
    });
    
    console.log(`[SYNC] Write-behind cache update completed for ${customer.phone}`);
    return { success: true, strategy: 'write-behind' };
  } catch (error: any) {
    console.error('[SYNC] Write-behind failed:', error);
    return { success: false, error: error.message, strategy: 'write-behind' };
  }
}

/**
 * STRATEGY 3: Refresh-Ahead Cache (Predictive refresh)
 * - Refreshes cache before it expires
 * - Good for frequently accessed data
 * - Prevents cache misses for popular customers
 */
export async function refreshAhead(popularCustomerPhones: string[]) {
  try {
    const customers: Customer[] = [];
    
    // Fetch popular customers from Firestore
    for (const phone of popularCustomerPhones) {
      const doc = await db.collection('customers').doc(phone).get();
      if (doc.exists) {
        const data = doc.data();
        customers.push({
          ...data,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
        } as Customer);
      }
    }
    
    // Update cache with fresh data
    if (customers.length > 0) {
      const existingCache = getCacheStats();
      if (existingCache.cached) {
        // Merge with existing cache
        customers.forEach(customer => updateSingleCustomerInCache(customer));
      } else {
        // Create new cache
        updateCustomerCache(customers);
      }
    }
    
    console.log(`[SYNC] Refresh-ahead completed for ${customers.length} customers`);
    return { success: true, strategy: 'refresh-ahead', count: customers.length };
  } catch (error: any) {
    console.error('[SYNC] Refresh-ahead failed:', error);
    return { success: false, error: error.message, strategy: 'refresh-ahead' };
  }
}

/**
 * STRATEGY 4: Manual Refresh (On-demand)
 * - Admin triggers cache refresh manually
 * - Full control over when sync happens
 * - Good for maintenance windows
 */
export async function manualRefresh(limit: number = 1000) {
  try {
    console.log(`[SYNC] Manual refresh started (limit: ${limit})`);
    
    const snapshot = await db.collection('customers')
      .orderBy('totalOrders', 'desc') // Prioritize frequent customers
      .limit(limit)
      .get();
    
    const customers: Customer[] = [];
    
    snapshot.forEach(doc => {
      try {
        const data = doc.data();
        customers.push({
          ...data,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
        } as Customer);
      } catch (error) {
        console.warn(`[SYNC] Skipping invalid customer ${doc.id}:`, error);
      }
    });
    
    updateCustomerCache(customers);
    
    console.log(`[SYNC] Manual refresh completed: ${customers.length} customers cached`);
    return { success: true, strategy: 'manual', count: customers.length };
  } catch (error: any) {
    console.error('[SYNC] Manual refresh failed:', error);
    return { success: false, error: error.message, strategy: 'manual' };
  }
}

/**
 * Smart Sync - Chooses best strategy based on context
 */
export async function smartSync(customer: Customer, context: 'order_creation' | 'profile_update' | 'bulk_import') {
  switch (context) {
    case 'order_creation':
      // Fast response needed, use write-behind
      return writeBehind(customer);
      
    case 'profile_update':
      // Consistency important, use write-through
      return writeThrough(customer);
      
    case 'bulk_import':
      // Batch operation, manual refresh after all imports
      return { success: true, strategy: 'deferred', message: 'Use manual refresh after bulk import' };
      
    default:
      return writeThrough(customer);
  }
}

/**
 * Cache Health Check
 */
export function getCacheHealth() {
  const stats = getCacheStats();
  const now = Date.now();
  const cacheAge = stats.lastUpdated ? now - new Date(stats.lastUpdated).getTime() : 0;
  
  return {
    ...stats,
    cacheAge: cacheAge,
    cacheAgeMinutes: Math.round(cacheAge / (1000 * 60)),
    health: cacheAge < 30 * 60 * 1000 ? 'healthy' : 'stale', // 30 minutes threshold
    recommendation: cacheAge > 60 * 60 * 1000 ? 'refresh_recommended' : 'ok' // 1 hour threshold
  };
}