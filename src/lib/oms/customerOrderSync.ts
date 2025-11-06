import { db } from "@/lib/firebase/server";
import admin from "firebase-admin";
import type { Order, CustomerOrder } from "@/types/order";

/**
 * Maps internal order status to customer-friendly status
 */
export function mapToCustomerStatus(internalStatus: string): string {
  const statusMap: Record<string, string> = {
    'created_pending': 'confirmed',
    'approved': 'processing',
    'ready_for_shipping': 'processing',
    'shipped': 'shipped',
    'in_transit': 'shipped',
    'pending': 'shipped', // Don't show delivery issues to customer
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned',
    'needs_manual_verification': 'processing'
  };
  
  return statusMap[internalStatus] || 'processing';
}

/**
 * Creates customer-friendly tracking events from order data
 */
export function createTrackingEvents(orderData: Order): Array<{
  timestamp: string;
  status: string;
  description: string;
  location?: string;
}> {
  const events = [];
  
  // Order confirmed
  events.push({
    timestamp: orderData.createdAt.toString(),
    status: 'Order Confirmed',
    description: 'Your order has been confirmed and is being processed',
    location: 'Warehouse'
  });
  
  // If approved, add processing event
  if (orderData.approval.approvedAt) {
    events.push({
      timestamp: orderData.approval.approvedAt.toString(),
      status: 'Processing',
      description: 'Your order is being prepared for shipment',
      location: 'Warehouse'
    });
  }
  
  // If shipped, add shipping event
  if (orderData.internalStatus === 'shipped' || orderData.internalStatus === 'in_transit') {
    events.push({
      timestamp: orderData.shipmentInfo.lastTrackedAt || orderData.updatedAt.toString(),
      status: 'Shipped',
      description: 'Your order has been shipped and is on the way',
      location: orderData.shipmentInfo.trackingLocation || 'In Transit'
    });
  }
  
  // If delivered
  if (orderData.internalStatus === 'delivered') {
    events.push({
      timestamp: orderData.updatedAt.toString(),
      status: 'Delivered',
      description: 'Your order has been delivered successfully',
      location: orderData.shipmentInfo.trackingLocation || 'Delivered'
    });
  }
  
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Calculates delivery estimate based on order data
 */
export function calculateDeliveryEstimate(orderData: Order): {
  expectedDate: string;
  earliestDate?: string;
  latestDate?: string;
  timeSlot?: string;
  confidence?: string;
} | undefined {
  // If we have tracking data with expected delivery
  if (orderData.shipmentInfo.apiResponse?.packages?.[0]?.ExpectedDeliveryDate) {
    const expectedDate = orderData.shipmentInfo.apiResponse.packages[0].ExpectedDeliveryDate;
    return {
      expectedDate,
      timeSlot: 'full_day',
      confidence: 'high'
    };
  }
  
  // Fallback: Calculate based on order date + typical delivery time
  const orderDate = new Date(orderData.createdAt.toString());
  const expectedDelivery = new Date(orderDate);
  expectedDelivery.setDate(expectedDelivery.getDate() + 3); // Default 3 days
  
  return {
    expectedDate: expectedDelivery.toISOString(),
    timeSlot: 'full_day',
    confidence: 'medium'
  };
}

/**
 * Syncs order data to customer-facing collection
 */
export async function syncCustomerOrder(orderId: string, orderData: Order): Promise<void> {
  try {
    const customerOrderData: Omit<CustomerOrder, 'createdAt' | 'updatedAt'> = {
      orderId: orderData.orderId,
      customerId: orderData.customerInfo.customerId,
      customerPhone: orderData.customerInfo.phone,
      
      // Order summary
      orderDate: orderData.createdAt.toString(),
      orderStatus: mapToCustomerStatus(orderData.internalStatus) as any,
      
      // Items (simplified)
      items: orderData.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        sku: item.sku,
        // TODO: Add product image lookup
      })),
      
      // Customer-relevant pricing
      totalAmount: orderData.pricingInfo.grandTotal,
      paymentMethod: orderData.paymentInfo.method,
      
      // Shipping details
      shippingAddress: {
        name: orderData.customerInfo.name,
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        zip: orderData.shippingAddress.zip
      },
      
      // Tracking information
      tracking: {
        courierPartner: orderData.shipmentInfo.courierPartner,
        awb: orderData.shipmentInfo.awb,
        trackingUrl: orderData.shipmentInfo.trackingUrl,
        currentStatus: orderData.shipmentInfo.currentTrackingStatus,
        currentLocation: orderData.shipmentInfo.trackingLocation,
        lastUpdate: orderData.shipmentInfo.lastTrackedAt,
        expectedDeliveryDate: orderData.deliveryEstimate?.expectedDate,
        deliveryTimeSlot: orderData.deliveryEstimate?.timeSlot,
        trackingEvents: createTrackingEvents(orderData)
      },
      
      // Support information
      supportInfo: {
        canCancel: ['created_pending', 'approved'].includes(orderData.internalStatus),
        canReturn: orderData.internalStatus === 'delivered',
        returnWindowDays: 7,
        supportPhone: '+91-1234567890', // TODO: Make configurable
        supportEmail: 'support@bugglyfarms.com'
      }
    };
    
    // Save to customer orders collection
    await db.collection('customerOrders').doc(orderId).set({
      ...customerOrderData,
      createdAt: orderData.createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`[CUSTOMER_SYNC] Synced customer order: ${orderId}`);
    
  } catch (error) {
    console.error(`[CUSTOMER_SYNC] Error syncing customer order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Updates customer order status and tracking info
 */
export async function updateCustomerOrderTracking(
  orderId: string, 
  trackingData: {
    currentStatus?: string;
    currentLocation?: string;
    lastUpdate?: string;
    expectedDeliveryDate?: string;
  }
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (trackingData.currentStatus) {
      updateData['tracking.currentStatus'] = trackingData.currentStatus;
      updateData.orderStatus = mapToCustomerStatus(trackingData.currentStatus);
    }
    
    if (trackingData.currentLocation) {
      updateData['tracking.currentLocation'] = trackingData.currentLocation;
    }
    
    if (trackingData.lastUpdate) {
      updateData['tracking.lastUpdate'] = trackingData.lastUpdate;
    }
    
    if (trackingData.expectedDeliveryDate) {
      updateData['tracking.expectedDeliveryDate'] = trackingData.expectedDeliveryDate;
    }
    
    await db.collection('customerOrders').doc(orderId).update(updateData);
    
    console.log(`[CUSTOMER_SYNC] Updated customer tracking: ${orderId}`);
    
  } catch (error) {
    console.error(`[CUSTOMER_SYNC] Error updating customer tracking ${orderId}:`, error);
    throw error;
  }
}