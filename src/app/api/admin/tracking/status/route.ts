import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';

/**
 * GET /api/admin/tracking/status
 * Get tracking system status and statistics
 */
async function getTrackingStatus(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    // Get orders that need tracking
    const needsTrackingQuery = db.collection('orders')
      .where('needsTracking', '==', true);
    
    const needsTrackingSnapshot = await needsTrackingQuery.get();
    
    // Get recently updated orders (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentlyUpdatedQuery = db.collection('orders')
      .where('shipmentInfo.lastTrackedAt', '>=', yesterday.toISOString())
      .orderBy('shipmentInfo.lastTrackedAt', 'desc')
      .limit(50);
    
    const recentlyUpdatedSnapshot = await recentlyUpdatedQuery.get();
    
    // Get orders by status
    const statusCounts: Record<string, number> = {};
    const courierCounts: Record<string, number> = {};
    
    for (const doc of needsTrackingSnapshot.docs) {
      const data = doc.data();
      const status = data.internalStatus || 'unknown';
      const courier = data.shipmentInfo?.courierPartner || 'unknown';
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      courierCounts[courier] = (courierCounts[courier] || 0) + 1;
    }
    
    // Get recent tracking events
    const recentEvents = recentlyUpdatedSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        orderId: data.orderId,
        awb: data.shipmentInfo?.awb,
        status: data.shipmentInfo?.currentTrackingStatus,
        location: data.shipmentInfo?.trackingLocation,
        lastTracked: data.shipmentInfo?.lastTrackedAt,
        courier: data.shipmentInfo?.courierPartner
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ordersNeedingTracking: needsTrackingSnapshot.size,
          recentlyUpdated: recentlyUpdatedSnapshot.size,
          lastSyncTime: new Date().toISOString()
        },
        statusBreakdown: statusCounts,
        courierBreakdown: courierCounts,
        recentEvents
      }
    });
    
  } catch (error: any) {
    console.error('[TRACKING_STATUS] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tracking status',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/tracking/status
 * Manually trigger tracking sync
 */
async function triggerTrackingSync(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    console.log('[TRACKING_SYNC_TRIGGER] Starting manual sync...');
    
    // Get orders that need tracking (same logic as tracking sync)
    const ordersQuery = db.collection('orders')
      .where('needsTracking', '==', true)
      .where('shipmentInfo.courierPartner', '==', 'delhivery')
      .limit(100); // Smaller batch for manual sync
    
    const snapshot = await ordersQuery.get();
    console.log(`[TRACKING_SYNC_TRIGGER] Found ${snapshot.size} orders to track`);
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No orders need tracking',
        syncResult: { ordersProcessed: 0, apiCalls: 0 }
      });
    }
    
    // For manual trigger, we'll just return the count
    // The actual sync will be handled by the scheduled job or manual API call
    
    return NextResponse.json({
      success: true,
      message: `Found ${snapshot.size} orders that need tracking. Use the tracking sync API directly for immediate processing.`,
      syncResult: {
        ordersFound: snapshot.size,
        status: 'ready',
        note: 'Call POST /api/tracking/sync to process these orders'
      }
    });
    
  } catch (error: any) {
    console.error('[TRACKING_SYNC_TRIGGER] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger tracking sync',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getTrackingStatus);
export const POST = withAuth(['admin'])(triggerTrackingSync);