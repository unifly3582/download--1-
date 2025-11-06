import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';

/**
 * GET /api/admin/coupons/[couponId]/stats
 * Get coupon usage statistics
 */
async function getCouponStatsHandler(
  request: NextRequest,
  context: { params: { couponId: string } },
  authContext: AuthContext
) {
  try {
    const { couponId } = context.params;
    
    // Check if coupon exists
    const couponDoc = await db.collection('coupons').doc(couponId).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }
    
    const couponData = couponDoc.data();
    
    // Query orders that used this coupon
    const ordersSnapshot = await db.collection('orders')
      .where('couponDetails.couponId', '==', couponId)
      .get();
    
    if (ordersSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: {
          totalUsage: 0,
          totalDiscountGiven: 0,
          totalRevenue: 0,
          uniqueUsers: 0,
          averageOrderValue: 0,
          usageByDate: [],
          recentOrders: []
        }
      });
    }
    
    // Calculate statistics
    let totalDiscountGiven = 0;
    let totalRevenue = 0;
    const uniqueUsers = new Set();
    const usageByDate: Record<string, { count: number; revenue: number }> = {};
    const recentOrders: any[] = [];
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const discount = order.couponDetails?.discountAmount || 0;
      const revenue = order.pricingInfo?.grandTotal || 0;
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      
      totalDiscountGiven += discount;
      totalRevenue += revenue;
      uniqueUsers.add(order.customerInfo?.phone || order.customerInfo?.email);
      
      // Usage by date
      if (!usageByDate[orderDate]) {
        usageByDate[orderDate] = { count: 0, revenue: 0 };
      }
      usageByDate[orderDate].count++;
      usageByDate[orderDate].revenue += revenue;
      
      // Recent orders (last 10)
      recentOrders.push({
        orderId: order.orderId,
        customerName: order.customerInfo?.name || 'Unknown',
        orderValue: revenue + discount, // Original order value
        discountAmount: discount,
        createdAt: order.createdAt
      });
    });
    
    // Sort recent orders by date (newest first) and limit to 10
    recentOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limitedRecentOrders = recentOrders.slice(0, 10);
    
    // Convert usage by date to array
    const usageByDateArray = Object.entries(usageByDate).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const stats = {
      totalUsage: ordersSnapshot.size,
      totalDiscountGiven,
      totalRevenue,
      uniqueUsers: uniqueUsers.size,
      averageOrderValue: totalRevenue / ordersSnapshot.size,
      usageByDate: usageByDateArray,
      recentOrders: limitedRecentOrders
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('[COUPON_STATS] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupon statistics',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCouponStatsHandler);