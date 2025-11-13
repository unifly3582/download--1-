// Optimized bulk operations with reduced database reads
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

async function bulkOrdersOptimizedHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const body = await request.json();
    const { action, orderIds, courierPartner } = body;

    if (!action || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. Action and orderIds are required.'
      }, { status: 400 });
    }

    // Batch read all orders at once instead of individual reads
    const orderRefs = orderIds.map(id => db.collection('orders').doc(id));
    const orderDocs = await db.getAll(...orderRefs);
    
    const results = [];
    const batch = db.batch();
    const timestamp = admin.firestore.Timestamp.now();

    for (let i = 0; i < orderDocs.length; i++) {
      const orderDoc = orderDocs[i];
      const orderId = orderIds[i];

      if (!orderDoc.exists) {
        results.push({ orderId, success: false, error: 'Order not found' });
        continue;
      }

      const orderData = orderDoc.data();
      const orderRef = orderDoc.ref;

      try {
        switch (action) {
          case 'approve':
            if (orderData?.internalStatus === 'created_pending') {
              batch.update(orderRef, {
                'approval.status': 'approved',
                'approval.approvedBy': authContext.user.uid,
                'approval.approvedAt': timestamp,
                internalStatus: 'approved',
                updatedAt: timestamp
              });
              results.push({ orderId, success: true });
            } else {
              results.push({ orderId, success: false, error: 'Order not in pending status' });
            }
            break;

          case 'reject':
            // Allow rejection for both created_pending and needs_manual_verification
            if (orderData?.internalStatus === 'created_pending' || orderData?.internalStatus === 'needs_manual_verification') {
              batch.update(orderRef, {
                'approval.status': 'rejected',
                'approval.approvedBy': authContext.user.uid,
                'approval.approvedAt': timestamp,
                internalStatus: 'cancelled',
                customerFacingStatus: 'cancelled',
                updatedAt: timestamp
              });
              results.push({ orderId, success: true });
            } else {
              results.push({ orderId, success: false, error: 'Order not in pending status' });
            }
            break;

          case 'ship':
            if (orderData?.internalStatus === 'approved') {
              const shipmentUpdate: any = {
                internalStatus: 'ready_for_shipping',
                customerFacingStatus: 'processing',
                updatedAt: timestamp
              };

              if (courierPartner) {
                shipmentUpdate['shipmentInfo.courierPartner'] = courierPartner;
                shipmentUpdate['shipmentInfo.shipmentMode'] = 'manual';
              }

              batch.update(orderRef, shipmentUpdate);
              results.push({ orderId, success: true });
            } else {
              results.push({ orderId, success: false, error: 'Order not in approved status' });
            }
            break;

          case 'cancel':
            // Include needs_manual_verification in valid cancel statuses
            const validCancelStatuses = ['created_pending', 'needs_manual_verification', 'approved', 'ready_for_shipping', 'shipped', 'in_transit'];
            if (validCancelStatuses.includes(orderData?.internalStatus)) {
              batch.update(orderRef, {
                internalStatus: 'cancelled',
                customerFacingStatus: 'cancelled',
                'cancellation.cancelledBy': authContext.user.uid,
                'cancellation.cancelledAt': timestamp,
                'cancellation.reason': 'Admin cancelled',
                updatedAt: timestamp
              });
              results.push({ orderId, success: true });
            } else {
              results.push({ orderId, success: false, error: 'Order cannot be cancelled in current status' });
            }
            break;

          default:
            results.push({ orderId, success: false, error: 'Invalid action' });
        }
      } catch (error: any) {
        results.push({ orderId, success: false, error: error.message });
      }
    }

    // Single batch commit for all operations
    await batch.commit();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error: any) {
    console.error('[BULK_ORDERS_OPTIMIZED] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk operation',
      details: error.message
    }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(bulkOrdersOptimizedHandler);