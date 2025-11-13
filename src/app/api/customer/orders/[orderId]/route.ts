import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { toCustomerView } from '@/lib/oms/orderViews';
import { OrderSchema } from '@/types/order';

/**
 * GET /api/customer/orders/[orderId]
 * Get specific customer order details
 */
export async function GET(
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
    
    // Get from orders collection
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }
    
    const data = orderDoc.data()!;
    const orderData = {
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      approval: {
        ...data.approval,
        approvedAt: data.approval?.approvedAt?.toDate?.()?.toISOString() || data.approval?.approvedAt
      }
    };
    
    const orderValidation = OrderSchema.safeParse(orderData);
    if (!orderValidation.success) {
      console.error('[CUSTOMER_ORDER_DETAIL] Invalid order data:', orderValidation.error);
      return NextResponse.json({
        success: false,
        error: 'Invalid order data'
      }, { status: 500 });
    }
    
    const customerOrder = toCustomerView(orderValidation.data);
    
    return NextResponse.json({
      success: true,
      data: customerOrder
    });
    
  } catch (error: any) {
    console.error('[CUSTOMER_ORDER_DETAIL_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order details',
      details: error.message
    }, { status: 500 });
  }
}