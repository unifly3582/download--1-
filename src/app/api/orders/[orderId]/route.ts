// Individual order details API
import { NextResponse, NextRequest } from 'next/server';
import { db } from "@/lib/firebase/server";
import { OrderSchema } from "@/types/order";
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

async function getOrderHandler(
  request: NextRequest, 
  context: { params: { orderId: string } }, 
  authContext: AuthContext
) {
  try {
    const { orderId } = context.params;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 });
    }

    const data = orderDoc.data();
    
    // Serialize dates
    const dataWithSerializableDates = {
      ...data,
      id: orderDoc.id,
      createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data?.createdAt,
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
      approval: { 
        ...data?.approval, 
        approvedAt: data?.approval?.approvedAt?.toDate ? 
          data.approval.approvedAt.toDate().toISOString() : 
          data?.approval?.approvedAt 
      }
    };
    
    const validation = OrderSchema.safeParse(dataWithSerializableDates);
    if (!validation.success) {
      console.warn(`[Order API] Invalid order data for ${orderId}:`, validation.error.flatten());
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid order data' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: validation.data 
    });

  } catch (error: any) {
    console.error("[Order API] Error fetching order:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch order.",
      details: error.message 
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getOrderHandler);