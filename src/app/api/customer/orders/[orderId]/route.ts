import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';

/**
 * GET /api/customer/orders/[orderId]
 * Get specific customer order details
 */
export async function GET(
  request: NextRequest,
  context: { params: { orderId: string } }
) {
  try {
    const { orderId } = (await context).params;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }
    
    // Get customer order
    const orderDoc = await db.collection('customerOrders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }
    
    const orderData = {
      id: orderDoc.id,
      ...orderDoc.data()
    };
    
    return NextResponse.json({
      success: true,
      data: orderData
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