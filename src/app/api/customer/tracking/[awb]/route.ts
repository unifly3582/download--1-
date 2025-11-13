import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { toCustomerView } from '@/lib/oms/orderViews';
import { OrderSchema } from '@/types/order';

/**
 * GET /api/customer/tracking/[awb]
 * Track order by AWB number (for guest users)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ awb: string }> }
) {
  try {
    const { awb } = await params;
    
    if (!awb) {
      return NextResponse.json({
        success: false,
        error: 'AWB number is required'
      }, { status: 400 });
    }
    
    // Find order by AWB in orders collection
    const ordersQuery = db.collection('orders')
      .where('shipmentInfo.awb', '==', awb)
      .limit(1);
    
    const snapshot = await ordersQuery.get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No order found with this AWB number'
      }, { status: 404 });
    }
    
    const orderDoc = snapshot.docs[0];
    const data = orderDoc.data();
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
      return NextResponse.json({
        success: false,
        error: 'Invalid order data'
      }, { status: 500 });
    }
    
    const customerOrder = toCustomerView(orderValidation.data);
    
    // Return only tracking-relevant information for guest users
    const trackingInfo = {
      orderId: customerOrder.orderId,
      orderStatus: customerOrder.orderStatus,
      orderDate: customerOrder.orderDate,
      itemCount: customerOrder.items.length,
      tracking: customerOrder.tracking,
      deliveryLocation: {
        city: customerOrder.shippingAddress.city,
        state: customerOrder.shippingAddress.state,
        zip: customerOrder.shippingAddress.zip
      },
      supportInfo: customerOrder.supportInfo
    };
    
    return NextResponse.json({
      success: true,
      data: trackingInfo
    });
    
  } catch (error: any) {
    console.error('[CUSTOMER_TRACKING_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tracking information',
      details: error.message
    }, { status: 500 });
  }
}