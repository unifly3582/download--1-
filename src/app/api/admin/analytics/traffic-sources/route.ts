import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

/**
 * GET /api/admin/analytics/traffic-sources
 * Get traffic source analytics
 */
async function getTrafficSourceAnalytics(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query orders within date range (using Firestore Timestamp)
    // For now, let's get all orders and filter in memory to avoid index issues
    const ordersQuery = db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(1000); // Limit to recent orders for performance

    const snapshot = await ordersQuery.get();

    console.log(`[TRAFFIC_ANALYTICS] Found ${snapshot.size} orders for date range ${startDate.toISOString()} to ${endDate.toISOString()}`);

    if (snapshot.empty) {
      console.log('[TRAFFIC_ANALYTICS] No orders found in date range');
      return NextResponse.json({
        success: true,
        data: {
          totalStats: {
            totalOrders: 0,
            totalRevenue: 0,
            totalCustomers: 0,
            averageOrderValue: 0
          },
          trafficSources: [],
          topCampaigns: [],
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            days
          }
        }
      });
    }

    // Analyze traffic sources
    const trafficSourceStats: Record<string, any> = {};
    const campaignStats: Record<string, any> = {};
    let totalRevenue = 0;
    let totalOrders = 0;

    snapshot.docs.forEach(doc => {
      const order = doc.data();

      // Filter by date range in memory
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      if (orderDate < startDate || orderDate > endDate) {
        return; // Skip orders outside date range
      }

      const trafficSource = order.trafficSource;
      const revenue = order.pricingInfo?.grandTotal || 0;

      // Count all orders for total stats
      totalOrders++;
      totalRevenue += revenue;

      // Skip orders without traffic source data for source analysis
      if (!trafficSource) return;

      if (trafficSource?.source) {
        const source = trafficSource.source;

        if (!trafficSourceStats[source]) {
          trafficSourceStats[source] = {
            source,
            orders: 0,
            revenue: 0,
            averageOrderValue: 0
          };
        }

        trafficSourceStats[source].orders++;
        trafficSourceStats[source].revenue += revenue;
        trafficSourceStats[source].averageOrderValue =
          trafficSourceStats[source].revenue / trafficSourceStats[source].orders;
      }

      if (trafficSource?.campaign) {
        const campaign = trafficSource.campaign;

        if (!campaignStats[campaign]) {
          campaignStats[campaign] = {
            campaign,
            source: trafficSource.source,
            orders: 0,
            revenue: 0,
            averageOrderValue: 0
          };
        }

        campaignStats[campaign].orders++;
        campaignStats[campaign].revenue += revenue;
        campaignStats[campaign].averageOrderValue =
          campaignStats[campaign].revenue / campaignStats[campaign].orders;
      }
    });

    // Convert to arrays and sort
    const trafficSources = Object.values(trafficSourceStats)
      .sort((a: any, b: any) => b.revenue - a.revenue);

    const campaigns = Object.values(campaignStats)
      .sort((a: any, b: any) => b.revenue - a.revenue);

    console.log(`[TRAFFIC_ANALYTICS] Processed ${totalOrders} orders, ${totalRevenue} revenue, ${trafficSources.length} traffic sources`);

    return NextResponse.json({
      success: true,
      data: {
        totalStats: {
          totalOrders,
          totalRevenue,
          totalCustomers: new Set(snapshot.docs.map(doc => doc.data().customerInfo?.phone || doc.data().customerInfo?.email)).size,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        trafficSources: trafficSources.map((source: any) => ({
          source: source.source,
          totalOrders: source.orders,
          totalRevenue: source.revenue,
          averageOrderValue: source.averageOrderValue,
          conversionRate: 0, // Would need additional data to calculate
          uniqueCustomers: 0 // Would need additional processing
        })),
        topCampaigns: campaigns.slice(0, 10).map((campaign: any) => ({
          campaign: campaign.campaign,
          orders: campaign.orders,
          revenue: campaign.revenue
        })),
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days
        }
      }
    });

  } catch (error: any) {
    console.error('[TRAFFIC_ANALYTICS] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch traffic analytics',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getTrafficSourceAnalytics);