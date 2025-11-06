import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { Customer, CustomerSchema } from '@/types/customers';
import { withAuth } from '@/lib/auth/withAuth';

async function getCustomerProfileHandler(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone);
    
    // Get customer basic info
    const customersRef = db.collection('customers');
    const customerQuery = customersRef.where('phone', '==', phone).limit(1);
    const customerSnapshot = await customerQuery.get();

    if (customerSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerDoc = customerSnapshot.docs[0];
    const customerData = customerDoc.data();
    
    const validation = CustomerSchema.safeParse({
      ...customerData,
      customerId: customerDoc.id
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer data' },
        { status: 500 }
      );
    }

    const customer = validation.data;

    // Get recent orders summary (only last 10 orders with minimal data)
    const ordersRef = db.collection('orders');
    const recentOrdersQuery = ordersRef
      .where('customerInfo.phone', '==', phone)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .select('orderId', 'createdAt', 'internalStatus', 'pricingInfo.grandTotal');

    const recentOrdersSnapshot = await recentOrdersQuery.get();
    
    const recentOrders = recentOrdersSnapshot.docs.map(doc => ({
      orderId: doc.data().orderId,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      internalStatus: doc.data().internalStatus,
      grandTotal: doc.data().pricingInfo?.grandTotal || 0
    }));

    // Get order statistics
    const orderStatsQuery = ordersRef
      .where('customerInfo.phone', '==', phone)
      .select('pricingInfo.grandTotal', 'internalStatus');
    
    const orderStatsSnapshot = await orderStatsQuery.get();
    
    let totalSpent = 0;
    let completedOrders = 0;
    let totalOrders = orderStatsSnapshot.size;

    orderStatsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.internalStatus === 'delivered') {
        totalSpent += data.pricingInfo?.grandTotal || 0;
        completedOrders++;
      }
    });

    const customerProfile = {
      ...customer,
      recentOrders,
      stats: {
        totalOrders,
        completedOrders,
        totalSpent,
        avgOrderValue: completedOrders > 0 ? totalSpent / completedOrders : 0
      },
      // Add computed fields for better profile display
      memberSince: customer.createdAt,
      lastOrderDate: customer.lastOrderAt,
      riskLevel: customer.isDubious ? 'High' : customer.trustScore < 30 ? 'Medium' : 'Low'
    };

    return NextResponse.json({
      success: true,
      data: customerProfile
    });

  } catch (error: any) {
    console.error('[customer profile API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['admin'])(getCustomerProfileHandler as any);