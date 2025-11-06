// Optimized orders API with pagination and caching
import { NextResponse, NextRequest } from 'next/server';
import { db } from "@/lib/firebase/server";
import { OrderSchema, Order } from "@/types/order";
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import admin from "firebase-admin";

async function getOptimizedOrdersHandler(request: NextRequest, context: any, authContext: AuthContext) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || 'to-approve';
  const limit = parseInt(searchParams.get('limit') || '50');
  const lastOrderId = searchParams.get('lastOrderId');
  const fields = searchParams.get('fields'); // Allow field selection

  try {
    let query: admin.firestore.Query = db.collection('orders');

    // Apply status filters
    switch (status) {
      case 'to-approve':
        query = query.where('internalStatus', 'in', ['created_pending', 'needs_manual_verification']);
        break;
      case 'to-ship':
        query = query.where('internalStatus', 'in', ['approved', 'ready_for_shipping']);
        break;
      case 'in-transit':
        query = query.where('internalStatus', 'in', ['shipped', 'in_transit']);
        break;
      case 'completed':
        query = query.where('internalStatus', '==', 'delivered');
        break;
      case 'rejected':
        query = query.where('approval.status', '==', 'rejected');
        break;
      case 'issues':
        query = query.where('internalStatus', 'in', ['cancelled', 'returned']);
        break;
    }

    // Add pagination
    query = query.orderBy('createdAt', 'desc').limit(limit);
    
    if (lastOrderId) {
      const lastDoc = await db.collection('orders').doc(lastOrderId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        hasMore: false,
        totalCount: 0 
      });
    }

    const orders: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // For now, return all data to ensure functionality works
      // Field selection can be re-enabled later for further optimization
      let orderData: any = data;

      // Serialize dates
      const dataWithSerializableDates = {
        ...orderData,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        approval: { 
          ...data.approval, 
          approvedAt: data.approval?.approvedAt?.toDate ? 
            data.approval.approvedAt.toDate().toISOString() : 
            data.approval?.approvedAt 
        }
      };
      
      orders.push(dataWithSerializableDates);
    });

    // Check if there are more results
    const hasMore = orders.length === limit;
    const lastOrder = orders[orders.length - 1];

    return NextResponse.json({ 
      success: true, 
      data: orders,
      hasMore,
      lastOrderId: hasMore ? lastOrder?.id : null,
      totalCount: orders.length
    });

  } catch (error: any) {
    console.error("[Optimized Orders API] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch orders.",
      details: error.message 
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getOptimizedOrdersHandler);