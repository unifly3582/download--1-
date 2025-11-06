import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';

// Query schema for customer orders
const CustomerOrdersQuerySchema = z.object({
  customerId: z.string().optional(),
  phone: z.string().optional(),
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
    
    // Build query
    let query: any = db.collection('customerOrders');
    
    if (customerId) {
      query = query.where('customerId', '==', customerId);
    } else if (phone) {
      // Format phone number consistently
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/[^0-9]/g, '').slice(-10)}`;
      query = query.where('customerPhone', '==', formattedPhone);
    }
    
    // Order by date and limit
    const snapshot = await query
      .orderBy('orderDate', 'desc')
      .limit(limit)
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No orders found'
      });
    }
    
    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length
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