// Cache management API for customers
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';
import { updateCustomerCache, getCacheStats } from '@/lib/cache/customerCache';
import { Customer, CustomerSchema } from '@/types/customers';

/**
 * GET /api/admin/cache/customers
 * Get cache statistics
 */
async function getCacheStatsHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const stats = getCacheStats();
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[CACHE_API] Error getting cache stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache stats',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/cache/customers
 * Refresh customer cache from Firestore
 */
async function refreshCacheHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { limit = 1000 } = await request.json();
    
    console.log(`[CACHE_API] Refreshing customer cache (limit: ${limit})`);
    
    // Fetch customers from Firestore
    const snapshot = await db.collection('customers')
      .orderBy('totalOrders', 'desc') // Prioritize frequent customers
      .limit(limit)
      .get();
    
    const customers: Customer[] = [];
    
    snapshot.forEach(doc => {
      try {
        const data = doc.data();
        const customerData = {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
        
        const validation = CustomerSchema.safeParse(customerData);
        if (validation.success) {
          customers.push(validation.data);
        }
      } catch (error) {
        console.warn(`[CACHE_API] Skipping invalid customer ${doc.id}:`, error);
      }
    });
    
    // Update cache
    updateCustomerCache(customers);
    
    return NextResponse.json({
      success: true,
      message: `Cache refreshed with ${customers.length} customers`,
      data: {
        cached: customers.length,
        requested: limit,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[CACHE_API] Error refreshing cache:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh cache',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCacheStatsHandler);
export const POST = withAuth(['admin'])(refreshCacheHandler);