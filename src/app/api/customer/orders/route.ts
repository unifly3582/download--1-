import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import { toCustomerViewBatch } from '@/lib/oms/orderViews';
import { OrderSchema } from '@/types/order';

// Query schema for customer orders
const CustomerOrdersQuerySchema = z.object({
  customerId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
});

/**
 * GET /api/customer/orders
 * Fetch customer orders by customerId or phone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryParams = {
      customerId: searchParams.get('customerId'),
      phone: searchParams.get('phone'),
      limit: searchParams.get('limit')
    };
    
    const parseResult = CustomerOrdersQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const { customerId, phone, limit } = parseResult.data;
    
    // Must provide either customerId or phone
    if (!customerId && !phone) {
      return NextResponse.json({
        success: false,
        error: 'Either customerId or phone is required'
      }, { status: 400 });
    }
    
    // Build query - NOW USING orders COLLECTION
    let query: any = db.collection('orders');
    
    if (customerId) {
      query = query.where('customerInfo.customerId', '==', customerId);
    } else if (phone) {
      // Format phone number consistently
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/[^0-9]/g, '').slice(-10)}`;
      query = query.where('customerInfo.phone', '==', formattedPhone);
    }
    
    // Order by date and limit
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No orders found'
      });
    }
    
    // Transform to customer view
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        approval: {
          ...data.approval,
          approvedAt: data.approval?.approvedAt?.toDate?.()?.toISOString() || data.approval?.approvedAt
        }
      };
    });
    
    const validOrders = orders
      .map(order => OrderSchema.safeParse(order))
      .filter(result => result.success)
      .map(result => result.data!);
    
    const customerOrders = toCustomerViewBatch(validOrders);
    
    return NextResponse.json({
      success: true,
      data: customerOrders,
      count: customerOrders.length
    });
    
  } catch (error: any) {
    console.error('[CUSTOMER_ORDERS_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer orders',
      details: error.message
    }, { status: 500 });
  }
}