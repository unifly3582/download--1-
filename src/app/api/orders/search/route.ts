import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';

async function searchOrders(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const searchType = searchParams.get('searchType') || 'orderId'; // orderId, name, phone
    const searchQuery = searchParams.get('query')?.trim();
    const status = searchParams.get('status') || 'to-approve';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!searchQuery) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    let query = db.collection('orders');

    // Apply status filter first
    const statusMap: Record<string, string[]> = {
      'to-approve': ['created_pending', 'needs_manual_verification'],
      'approved': ['approved'],
      'ready-to-ship': ['ready_for_shipping'],
      'shipped': ['shipped', 'in_transit', 'pending'],
      'delivered': ['delivered'],
      'cancelled': ['cancelled'],
      'all': [] // No filter for all
    };

    const statusValues = statusMap[status] || [];
    if (statusValues.length > 0) {
      query = query.where('internalStatus', 'in', statusValues) as any;
    }

    // Apply search filter based on type
    switch (searchType) {
      case 'orderId':
        // For order ID, use exact match or prefix match
        // Firestore doesn't support case-insensitive search, so we need to handle this
        query = query
          .where('orderId', '>=', searchQuery)
          .where('orderId', '<=', searchQuery + '\uf8ff') as any;
        break;

      case 'phone':
        // Search by phone number (exact match)
        query = query.where('customerInfo.phone', '==', searchQuery) as any;
        break;

      case 'name':
        // For name search, we'll need to use a different approach
        // Firestore doesn't support case-insensitive partial text search
        // We'll fetch and filter client-side for name (less efficient but necessary)
        // Or use a lowercase field if available
        query = query
          .where('customerInfo.name', '>=', searchQuery)
          .where('customerInfo.name', '<=', searchQuery + '\uf8ff') as any;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid search type'
        }, { status: 400 });
    }

    // Limit results
    query = query.limit(limit) as any;

    // Execute query
    const snapshot = await query.get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        approval: {
          ...data.approval,
          approvedAt: data.approval?.approvedAt?.toDate?.()?.toISOString() || data.approval?.approvedAt
        }
      };
    });

    // For name search, do case-insensitive filtering
    let filteredOrders = orders;
    if (searchType === 'name') {
      const lowerQuery = searchQuery.toLowerCase();
      filteredOrders = orders.filter((order: any) => 
        order.customerInfo?.name?.toLowerCase().includes(lowerQuery)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredOrders,
      count: filteredOrders.length,
      searchType,
      query: searchQuery
    });

  } catch (error: any) {
    console.error('[ORDERS_SEARCH] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search orders',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(searchOrders);
