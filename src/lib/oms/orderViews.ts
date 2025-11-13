import type { Order, CustomerOrder } from '@/types/order';

/**
 * Transform internal order to customer-facing view
 * Removes sensitive admin fields and simplifies structure
 */
export function toCustomerView(order: Order): CustomerOrder {
  return {
    orderId: order.orderId,
    customerId: order.customerInfo.customerId,
    customerPhone: order.customerInfo.phone,
    
    // Order summary
    orderDate: order.createdAt.toString(),
    orderStatus: mapToCustomerStatus(order.internalStatus),
    
    // Items (simplified)
    items: order.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      sku: item.sku,
      // TODO: Add product image lookup if needed
    })),
    
    // Customer-relevant pricing
    totalAmount: order.pricingInfo.grandTotal,
    paymentMethod: order.paymentInfo.method,
    
    // Shipping details
    shippingAddress: {
      name: order.customerInfo.name,
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zip: order.shippingAddress.zip
    },
    
    // Tracking information
    tracking: order.shipmentInfo ? {
      courierPartner: order.shipmentInfo.courierPartner,
      awb: order.shipmentInfo.awb,
      trackingUrl: order.shipmentInfo.trackingUrl,
      currentStatus: order.shipmentInfo.currentTrackingStatus,
      currentLocation: order.shipmentInfo.trackingLocation,
      lastUpdate: order.shipmentInfo.lastTrackedAt,
      expectedDeliveryDate: order.deliveryEstimate?.expectedDate,
      deliveryTimeSlot: order.deliveryEstimate?.timeSlot,
      trackingEvents: createTrackingEvents(order)
    } : undefined,
    
    // Support information
    supportInfo: {
      canCancel: ['created_pending', 'approved'].includes(order.internalStatus),
      canReturn: order.internalStatus === 'delivered',
      returnWindowDays: 7,
      supportPhone: '+91-1234567890',
      supportEmail: 'support@bugglyfarms.com'
    },
    
    createdAt: order.createdAt.toString(),
    updatedAt: order.updatedAt.toString()
  };
}

/**
 * Maps internal order status to customer-friendly status
 */
function mapToCustomerStatus(internalStatus: string): CustomerOrder['orderStatus'] {
  const statusMap: Record<string, CustomerOrder['orderStatus']> = {
    'created_pending': 'confirmed',
    'approved': 'processing',
    'ready_for_shipping': 'processing',
    'shipped': 'shipped',
    'in_transit': 'shipped',
    'pending': 'shipped',
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
function createTrackingEvents(order: Order) {
  const events = [];
  
  events.push({
    timestamp: order.createdAt.toString(),
    status: 'Order Confirmed',
    description: 'Your order has been confirmed and is being processed',
    location: 'Warehouse'
  });
  
  if (order.approval.approvedAt) {
    events.push({
      timestamp: order.approval.approvedAt.toString(),
      status: 'Processing',
      description: 'Your order is being prepared for shipment',
      location: 'Warehouse'
    });
  }
  
  if (order.internalStatus === 'shipped' || order.internalStatus === 'in_transit') {
    events.push({
      timestamp: order.shipmentInfo?.lastTrackedAt || order.updatedAt.toString(),
      status: 'Shipped',
      description: 'Your order has been shipped and is on the way',
      location: order.shipmentInfo?.trackingLocation || 'In Transit'
    });
  }
  
  if (order.internalStatus === 'delivered') {
    events.push({
      timestamp: order.updatedAt.toString(),
      status: 'Delivered',
      description: 'Your order has been delivered successfully',
      location: order.shipmentInfo?.trackingLocation || 'Delivered'
    });
  }
  
  return events.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Transform multiple orders to customer view
 */
export function toCustomerViewBatch(orders: Order[]): CustomerOrder[] {
  return orders.map(toCustomerView);
}
