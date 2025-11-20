import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

/**
 * POST /api/orders/[orderId]/cancel
 * Admin cancel order with WhatsApp notification
 */
async function cancelOrderHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { orderId } = await context.params;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }
    
    // Get order
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }
    
    const orderData = orderDoc.data()!;
    
    // Check if already cancelled
    if (orderData.internalStatus === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: 'Order is already cancelled'
      }, { status: 400 });
    }
    
    const timestamp = admin.firestore.Timestamp.now();
    
    // Update order to cancelled
    await orderRef.update({
      internalStatus: 'cancelled',
      customerFacingStatus: 'cancelled',
      'cancellation.cancelledBy': authContext.user?.uid || 'admin',
      'cancellation.cancelledAt': timestamp,
      'cancellation.cancelledByRole': 'admin',
      'cancellation.reason': 'Admin cancelled',
      updatedAt: timestamp
    });
    
    console.log(`[ADMIN_CANCEL] Order ${orderId} cancelled by admin ${authContext.user?.uid}`);
    
    // Send WhatsApp cancellation notification
    try {
      const { createNotificationService } = await import('@/lib/oms/notifications');
      const notificationService = createNotificationService();
      const updatedOrder = { 
        ...orderData, 
        internalStatus: 'cancelled',
        customerFacingStatus: 'cancelled',
        updatedAt: new Date().toISOString() 
      } as any;
      await notificationService.sendOrderCancelledNotification(updatedOrder);
      console.log(`[ADMIN_CANCEL] WhatsApp notification sent for ${orderId}`);
    } catch (notificationError) {
      console.error(`[ADMIN_CANCEL] Notification failed for ${orderId}:`, notificationError);
      // Don't fail cancellation if notification fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      orderId
    });
    
  } catch (error: any) {
    console.error('[ADMIN_CANCEL_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel order',
      details: error.message
    }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(cancelOrderHandler);
