import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';
import { z } from 'zod';

const CancelOrderSchema = z.object({
  phone: z.string().min(10),
  reason: z.string().optional()
});

/**
 * POST /api/customer/orders/[orderId]/cancel
 * Allow customers to cancel their own orders
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const parseResult = CancelOrderSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const { phone, reason } = parseResult.data;
    
    // Format phone number consistently
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/[^0-9]/g, '').slice(-10)}`;
    
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
    
    // Verify the order belongs to this customer
    if (orderData.customerInfo.phone !== formattedPhone) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: This order does not belong to you'
      }, { status: 403 });
    }
    
    // Check if order can be cancelled (only early stages)
    const cancellableStatuses = ['created_pending', 'approved'];
    if (!cancellableStatuses.includes(orderData.internalStatus)) {
      return NextResponse.json({
        success: false,
        error: `Order cannot be cancelled. Current status: ${orderData.internalStatus}`,
        message: 'Orders can only be cancelled before shipping. Please contact support for assistance.'
      }, { status: 400 });
    }
    
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
      'cancellation.cancelledBy': orderData.customerInfo.customerId,
      'cancellation.cancelledAt': timestamp,
      'cancellation.cancelledByRole': 'customer',
      'cancellation.reason': reason || 'Customer cancelled',
      updatedAt: timestamp
    });
    
    console.log(`[CUSTOMER_CANCEL] Order ${orderId} cancelled by customer ${orderData.customerInfo.customerId}`);
    
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
      console.log(`[CUSTOMER_CANCEL] WhatsApp notification sent for ${orderId}`);
    } catch (notificationError) {
      console.error(`[CUSTOMER_CANCEL] Notification failed for ${orderId}:`, notificationError);
      // Don't fail cancellation if notification fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      orderId
    });
    
  } catch (error: any) {
    console.error('[CUSTOMER_CANCEL_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel order',
      details: error.message
    }, { status: 500 });
  }
}
