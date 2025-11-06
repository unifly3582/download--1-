import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';

/**
 * POST /api/orders/bulk
 * Bulk operations on orders (approve, reject, ship)
 */
async function bulkOrdersHandler(
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

    const results = [];
    const batch = db.batch();

    for (const orderId of orderIds) {
      try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
          results.push({ orderId, success: false, error: 'Order not found' });
          continue;
        }

        const orderData = orderDoc.data();

        switch (action) {
          case 'approve':
            if (orderData?.internalStatus === 'created_pending') {
              batch.update(orderRef, {
                'approval.status': 'approved',
                'approval.approvedBy': authContext.user.uid,
                'approval.approvedAt': new Date().toISOString(),
                internalStatus: 'approved',
                updatedAt: new Date().toISOString()
              });
              results.push({ orderId, success: true });
            } else {
              results.push({ orderId, success: false, error: 'Order not in pending status' });
            }
            break;

          case 'reject':
            if (orderData?.internalStatus === 'created_pending') {
              batch.update(orderRef, {
                'approval.status': 'rejected',
                'approval.approvedBy': authContext.user.uid,
                'approval.approvedAt': new Date().toISOString(),
                internalStatus: 'cancelled',
                customerFacingStatus: 'cancelled',
                updatedAt: new Date().toISOString()
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
                updatedAt: new Date().toISOString()
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
            const validCancelStatuses = ['created_pending', 'approved', 'ready_for_shipping', 'shipped', 'in_transit'];
            if (validCancelStatuses.includes(orderData?.internalStatus)) {
              batch.update(orderRef, {
                internalStatus: 'cancelled',
                customerFacingStatus: 'cancelled',
                'cancellation.cancelledBy': authContext.user.uid,
                'cancellation.cancelledAt': new Date().toISOString(),
                'cancellation.reason': 'Admin cancelled',
                updatedAt: new Date().toISOString()
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

    // Commit all changes
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
    console.error('[BULK_ORDERS] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk operation',
      details: error.message
    }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(bulkOrdersHandler);