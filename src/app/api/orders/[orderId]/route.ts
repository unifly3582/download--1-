// Individual order details API
import { NextResponse, NextRequest } from 'next/server';
import { db } from "@/lib/firebase/server";
import { OrderSchema } from "@/types/order";
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

async function getOrderHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ orderId: string }> }, 
  authContext: AuthContext
) {
  try {
    const { orderId } = await params;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 });
    }

    const data = orderDoc.data();
    
    // Helper function to ensure datetime strings have timezone
    const ensureDatetimeFormat = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return dateStr;
      if (typeof dateStr !== 'string') return dateStr;
      // If it's already a valid ISO datetime with timezone, return as is
      if (dateStr.match(/Z$/) || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        return dateStr;
      }
      // If it's missing timezone, add Z (UTC)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
        return dateStr + 'Z';
      }
      return dateStr;
    };
    
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
      },
      // Fix delivery estimate dates
      deliveryEstimate: data?.deliveryEstimate ? {
        ...data.deliveryEstimate,
        expectedDate: ensureDatetimeFormat(data.deliveryEstimate.expectedDate),
        earliestDate: ensureDatetimeFormat(data.deliveryEstimate.earliestDate),
        latestDate: ensureDatetimeFormat(data.deliveryEstimate.latestDate),
      } : undefined,
      // Fix customer notifications dates
      customerNotifications: data?.customerNotifications ? {
        ...data.customerNotifications,
        lastNotificationSent: ensureDatetimeFormat(data.customerNotifications.lastNotificationSent),
      } : undefined,
      // Fix shipment info dates
      shipmentInfo: data?.shipmentInfo ? {
        ...data.shipmentInfo,
        lastTrackedAt: ensureDatetimeFormat(data.shipmentInfo.lastTrackedAt),
        shippedAt: ensureDatetimeFormat(data.shipmentInfo.shippedAt),
      } : undefined,
    };
    
    const validation = OrderSchema.safeParse(dataWithSerializableDates);
    if (!validation.success) {
      console.error(`[Order API] Validation failed for order ${orderId}:`);
      console.error('Validation errors:', JSON.stringify(validation.error.format(), null, 2));
      console.error('Order data:', JSON.stringify(dataWithSerializableDates, null, 2));
      
      // Return the data anyway for debugging, but mark it as unvalidated
      return NextResponse.json({ 
        success: true, 
        data: dataWithSerializableDates,
        warning: 'Order data did not pass validation',
        validationErrors: validation.error.format()
      });
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