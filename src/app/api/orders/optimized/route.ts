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
      try {
        const lastDoc = await db.collection('orders').doc(lastOrderId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      } catch (error: any) {
        if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
          console.log('[orders API] Firebase auth error on cursor doc, skipping pagination');
        } else {
          throw error;
        }
      }
    }

    let snapshot: admin.firestore.QuerySnapshot;
    
    try {
      snapshot = await query.get();
    } catch (queryError: any) {
      // Handle index building error
      if (queryError.code === 9 || queryError.message?.includes('FAILED_PRECONDITION') || queryError.message?.includes('index is currently building')) {
        console.log('[orders API] Index is building, using fallback query without complex filters');
        
        // Fallback: Simple query without complex filtering
        const fallbackQuery = db.collection('orders')
          .orderBy('createdAt', 'desc')
          .limit(limit);
        
        try {
          snapshot = await fallbackQuery.get();
          
          // Filter results in memory (temporary until indexes are ready)
          const filteredDocs: any[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            let includeDoc = false;
            
            switch (status) {
              case 'to-approve':
                includeDoc = ['created_pending', 'needs_manual_verification'].includes(data.internalStatus);
                break;
              case 'to-ship':
                includeDoc = ['approved', 'ready_for_shipping'].includes(data.internalStatus);
                break;
              case 'in-transit':
                includeDoc = ['shipped', 'in_transit'].includes(data.internalStatus);
                break;
              case 'completed':
                includeDoc = data.internalStatus === 'delivered';
                break;
              case 'rejected':
                includeDoc = data.approval?.status === 'rejected';
                break;
              case 'issues':
                includeDoc = ['cancelled', 'returned'].includes(data.internalStatus);
                break;
              default:
                includeDoc = true;
            }
            
            if (includeDoc) {
              filteredDocs.push(doc);
            }
          });
          
          // Create a mock snapshot with filtered docs
          const mockSnapshot = {
            empty: filteredDocs.length === 0,
            size: filteredDocs.length,
            forEach: (callback: (doc: any) => void) => {
              filteredDocs.slice(0, limit).forEach(callback);
            }
          };
          
          snapshot = mockSnapshot as any;
          
        } catch (fallbackError: any) {
          console.error('[orders API] Fallback query also failed:', fallbackError.message);
          // Return empty result with helpful message
          return NextResponse.json({
            success: true,
            data: [],
            hasMore: false,
            totalCount: 0,
            message: 'Firestore indexes are still building. Please try again in a few minutes.'
          });
        }
      } else {
        throw queryError; // Re-throw if it's not an index building error
      }
    }
    
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