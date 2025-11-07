import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';

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
    
    // Find order by AWB
    const ordersQuery = db.collection('customerOrders')
      .where('tracking.awb', '==', awb)
      .limit(1);
    
    const snapshot = await ordersQuery.get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No order found with this AWB number'
      }, { status: 404 });
    }
    
    const orderDoc = snapshot.docs[0];
    const orderData: any = {
      id: orderDoc.id,
      ...orderDoc.data()
    };
    
    // Return only tracking-relevant information for guest users
    const trackingInfo = {
      orderId: orderData.orderId,
      orderStatus: orderData.orderStatus,
      orderDate: orderData.orderDate,
      
      // Basic item info (no sensitive details)
      itemCount: orderData.items?.length || 0,
      
      // Tracking details
      tracking: orderData.tracking,
      
      // Delivery address (city/state only for privacy)
      deliveryLocation: {
        city: orderData.shippingAddress?.city,
        state: orderData.shippingAddress?.state,
        zip: orderData.shippingAddress?.zip
      },
      
      // Support info
      supportInfo: orderData.supportInfo
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