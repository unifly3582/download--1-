import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import admin from 'firebase-admin';

async function trackingSync(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    console.log('[TRACKING_SYNC] Starting sync...');
    
    // EFFICIENT QUERY: Only orders that need tracking
    const ordersQuery = db.collection('orders')
      .where('needsTracking', '==', true)
      .where('shipmentInfo.courierPartner', '==', 'delhivery')
      .limit(500);
    
    const snapshot = await ordersQuery.get();
    console.log(`[TRACKING_SYNC] Found ${snapshot.size} orders to track`);
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No orders need tracking',
        stats: { ordersProcessed: 0, apiCalls: 0 }
      });
    }
    
    // Group AWBs for batch processing
    const orders = snapshot.docs;
    const awbBatches = [];
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);
      const awbs = batch
        .map(doc => doc.data().shipmentInfo?.awb)
        .filter(awb => awb);
      
      if (awbs.length > 0) {
        awbBatches.push({ awbs, orders: batch });
      }
    }
    
    console.log(`[TRACKING_SYNC] Processing ${awbBatches.length} API calls`);
    
    let totalUpdates = 0;
    const errors = [];
    
    // Process each batch
    for (const batch of awbBatches) {
      try {
        const trackingData = await fetchDelhiveryTracking(batch.awbs);
        const updates = await processTrackingResponse(trackingData, batch.orders);
        totalUpdates += updates;
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error('[TRACKING_SYNC] Batch error:', error);
        errors.push({ batch: batch.awbs, error: error.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${orders.length} orders, ${totalUpdates} updates`,
      stats: {
        ordersProcessed: orders.length,
        apiCalls: awbBatches.length,
        statusUpdates: totalUpdates,
        errors: errors.length
      },
      errors
    });
    
  } catch (error: any) {
    console.error('[TRACKING_SYNC] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'Tracking sync failed',
      details: error.message
    }, { status: 500 });
  }
}

async function fetchDelhiveryTracking(awbs: string[]) {
  const awbString = awbs.join(',');
  
  // Get Delhivery API key from settings
  const settingsDoc = await db.collection('courierIntegrations').doc('delhivery').get();
  const apiKey = settingsDoc.data()?.api?.authKey;
  
  if (!apiKey) {
    throw new Error('Delhivery API key not found');
  }
  
  const response = await fetch(
    `https://track.delhivery.com/api/v1/packages/json/?waybill=${awbString}`,
    {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Delhivery API error: ${response.status}`);
  }
  
  return await response.json();
}

async function processTrackingResponse(trackingData: any, orders: any[]) {
  let updateCount = 0;
  
  if (!trackingData.ShipmentData) {
    return updateCount;
  }
  
  for (const shipmentData of trackingData.ShipmentData) {
    const shipment = shipmentData.Shipment;
    const awb = shipment.AWB;
    
    // Find corresponding order
    const orderDoc = orders.find(doc => doc.data().shipmentInfo?.awb === awb);
    if (!orderDoc) continue;
    
    const currentOrder = orderDoc.data();
    const newStatus = mapDelhiveryStatusToInternal(shipment.Status.Status);
    
    // Prepare update data
    const updateData: any = {
      'shipmentInfo.currentTrackingStatus': shipment.Status.Status,
      'shipmentInfo.lastTrackedAt': new Date().toISOString(),
      'shipmentInfo.trackingLocation': shipment.Status.StatusLocation,
      'shipmentInfo.trackingInstructions': shipment.Status.Instructions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update internal status if changed
    if (newStatus !== currentOrder.internalStatus) {
      updateData.internalStatus = newStatus;
      updateData.customerFacingStatus = mapToCustomerStatus(newStatus);
      
      // Disable tracking for final statuses
      const finalStatuses = ['delivered', 'returned', 'cancelled'];
      if (finalStatuses.includes(newStatus)) {
        updateData.needsTracking = false;
        updateData['shipmentInfo.trackingDisabledReason'] = `Order ${newStatus}`;
      }
      
      // Send WhatsApp notification for key status changes (with duplicate prevention)
      // NOTE: Only enabled for approved templates. Enable others after Meta approval.
      const enabledNotifications = {
        shipped: true,              // ✅ Approved - buggly_order_shipped
        out_for_delivery: true,     // ✅ Approved - buggly_out_for_delivery
        delivered: false            // ❌ Not created yet - needs to be submitted to Meta
      };
      
      const lastNotifiedStatus = currentOrder.notificationHistory?.lastNotifiedStatus;
      const delhiveryStatus = shipment.Status.Status;
      
      // Determine if this is "out for delivery" status
      const isOutForDelivery = delhiveryStatus?.toLowerCase().includes('out for delivery') || 
                               delhiveryStatus?.toLowerCase().includes('out-for-delivery');
      
      let notificationStatus = newStatus;
      if (isOutForDelivery) {
        notificationStatus = 'out_for_delivery';
      }
      
      // Only send notification if:
      // 1. Status notification is enabled (template approved)
      // 2. We haven't already sent notification for this status
      const isEnabled = enabledNotifications[notificationStatus as keyof typeof enabledNotifications];
      const shouldNotify = isEnabled && notificationStatus !== lastNotifiedStatus;
      
      if (shouldNotify) {
        try {
          await sendStatusNotification(orderDoc.ref, notificationStatus, currentOrder, shipment);
          updateData['notificationHistory.lastNotifiedStatus'] = notificationStatus;
          updateData['notificationHistory.lastNotifiedAt'] = new Date().toISOString();
          console.log(`[TRACKING_SYNC] Notification sent: ${notificationStatus} for ${currentOrder.orderId}`);
        } catch (notificationError: any) {
          console.error('[TRACKING_SYNC] Notification failed:', notificationError);
          // Don't fail the tracking update if notification fails
        }
      } else if (!isEnabled && ['shipped', 'out_for_delivery', 'delivered'].includes(notificationStatus)) {
        console.log(`[TRACKING_SYNC] Notification skipped (not enabled): ${notificationStatus} for ${currentOrder.orderId}`);
      }
    }
    
    // Update delivery estimate if available
    if (shipment.ExpectedDeliveryDate) {
      updateData['deliveryEstimate.expectedDate'] = shipment.ExpectedDeliveryDate;
      updateData['deliveryEstimate.confidence'] = 'high';
    }
    
    // Update main order
    await orderDoc.ref.update(updateData);
    
    updateCount++;
  }
  
  return updateCount;
}

function mapDelhiveryStatusToInternal(delhiveryStatus: string): string {
  const statusMap: Record<string, string> = {
    'Manifested': 'shipped',
    'Not Picked': 'shipped',
    'In Transit': 'in_transit',
    'Pending': 'pending',
    'Dispatched': 'in_transit',
    'Out for Delivery': 'in_transit',
    'Out-for-Delivery': 'in_transit',
    'Delivered': 'delivered',
    'RTO Initiated': 'return_initiated',
    'RTO Delivered': 'returned'
  };
  
  return statusMap[delhiveryStatus] || 'in_transit';
}

function mapToCustomerStatus(internalStatus: string): string {
  const statusMap: Record<string, string> = {
    'created_pending': 'confirmed',
    'approved': 'processing',
    'ready_for_shipping': 'processing',
    'shipped': 'shipped',
    'in_transit': 'shipped',
    'pending': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned'
  };
  
  return statusMap[internalStatus] || 'processing';
}

async function sendStatusNotification(
  orderRef: FirebaseFirestore.DocumentReference,
  status: string,
  orderData: any,
  shipmentData: any
): Promise<void> {
  try {
    const { createNotificationService } = await import('@/lib/oms/notifications');
    const notificationService = createNotificationService();
    
    // Build order object with updated tracking info
    const orderForNotification = {
      ...orderData,
      shipmentInfo: {
        ...orderData.shipmentInfo,
        currentTrackingStatus: shipmentData.Status.Status,
        trackingLocation: shipmentData.Status.StatusLocation,
        trackingInstructions: shipmentData.Status.Instructions
      },
      createdAt: typeof orderData.createdAt === 'string' 
        ? orderData.createdAt 
        : orderData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Send appropriate notification based on status
    switch (status) {
      case 'shipped':
        await notificationService.sendOrderShippedNotification(orderForNotification);
        console.log(`[TRACKING_SYNC] Shipped notification sent for ${orderData.orderId}`);
        break;
        
      case 'out_for_delivery':
        await notificationService.sendOutForDeliveryNotification(orderForNotification);
        console.log(`[TRACKING_SYNC] Out for delivery notification sent for ${orderData.orderId}`);
        break;
        
      case 'delivered':
        await notificationService.sendOrderDeliveredNotification(orderForNotification);
        console.log(`[TRACKING_SYNC] Delivered notification sent for ${orderData.orderId}`);
        break;
    }
  } catch (error: any) {
    console.error('[TRACKING_SYNC] Failed to send notification:', error);
    throw error;
  }
}

export const POST = withAuth(['admin', 'machine'])(trackingSync);