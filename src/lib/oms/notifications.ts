// Order Management System - Notification Service
import { Order } from '@/types/order';
import { createWhatsAppService, formatPhoneForWhatsApp, SendMessageResponse } from '@/lib/whatsapp/service';
import { OrderNotificationData } from '@/lib/whatsapp/templates';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';
import { logger } from '@/lib/logger';

export interface NotificationLog {
  orderId: string;
  customerId: string;
  customerPhone: string;
  notificationType: 'order_placed' | 'order_shipped' | 'order_picked' | 'out_for_delivery' | 'order_delivered';
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  error?: string;
  sentAt: string;
  retryCount: number;
}

export class OrderNotificationService {
  private whatsappService;

  constructor() {
    this.whatsappService = createWhatsAppService();
  }

  /**
   * Send order placed notification
   */
  async sendOrderPlacedNotification(order: Order): Promise<void> {
    if (!this.shouldSendNotification(order, 'whatsapp')) {
      console.log(`[Notifications] Skipping WhatsApp notification for ${order.orderId} - customer opted out`);
      return;
    }

    const notificationData = this.buildNotificationData(order);
    const phoneNumber = formatPhoneForWhatsApp(order.customerInfo.phone);

    try {
      if (!this.whatsappService) {
        throw new Error('WhatsApp service not configured');
      }

      const result = await this.whatsappService.sendOrderPlacedNotification(
        phoneNumber,
        notificationData
      );

      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'order_placed',
        channel: 'whatsapp',
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });

      // Update order with notification timestamp
      await this.updateOrderNotificationTimestamp(order.orderId);

      logger.info(`Order placed notification ${result.success ? 'sent' : 'failed'}`, { orderId: order.orderId });

    } catch (error: any) {
      logger.error('Failed to send order placed notification', error, { orderId: order.orderId });
      
      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'order_placed',
        channel: 'whatsapp',
        status: 'failed',
        error: error.message,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });
    }
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShippedNotification(order: Order): Promise<void> {
    if (!this.shouldSendNotification(order, 'whatsapp')) {
      logger.info('Skipping WhatsApp notification - customer opted out', { orderId: order.orderId });
      return;
    }

    if (!order.shipmentInfo.awb || !order.shipmentInfo.courierPartner) {
      logger.warn('Missing shipping info, skipping shipped notification', { orderId: order.orderId });
      return;
    }

    const notificationData = this.buildNotificationData(order);
    const phoneNumber = formatPhoneForWhatsApp(order.customerInfo.phone);

    try {
      if (!this.whatsappService) {
        throw new Error('WhatsApp service not configured');
      }

      const result = await this.whatsappService.sendOrderShippedNotification(
        phoneNumber,
        notificationData
      );

      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'order_shipped',
        channel: 'whatsapp',
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });

      await this.updateOrderNotificationTimestamp(order.orderId);

      logger.info(`Order shipped notification ${result.success ? 'sent' : 'failed'}`, { orderId: order.orderId });

    } catch (error: any) {
      logger.error('Failed to send order shipped notification', error, { orderId: order.orderId });
      
      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'order_shipped',
        channel: 'whatsapp',
        status: 'failed',
        error: error.message,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });
    }
  }

  /**
   * Send order picked notification
   */
  async sendOrderPickedNotification(order: Order): Promise<void> {
    if (!this.shouldSendNotification(order, 'whatsapp')) return;

    const notificationData = this.buildNotificationData(order);
    const phoneNumber = formatPhoneForWhatsApp(order.customerInfo.phone);

    try {
      if (!this.whatsappService) {
        throw new Error('WhatsApp service not configured');
      }

      const result = await this.whatsappService.sendOrderPickedNotification(
        phoneNumber,
        notificationData
      );

      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'order_picked',
        channel: 'whatsapp',
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });

      await this.updateOrderNotificationTimestamp(order.orderId);

    } catch (error: any) {
      logger.error('Failed to send order picked notification', error, { orderId: order.orderId });
    }
  }

  /**
   * Send out for delivery notification
   */
  async sendOutForDeliveryNotification(order: Order): Promise<void> {
    if (!this.shouldSendNotification(order, 'whatsapp')) return;

    const notificationData = this.buildNotificationData(order);
    const phoneNumber = formatPhoneForWhatsApp(order.customerInfo.phone);

    try {
      if (!this.whatsappService) {
        throw new Error('WhatsApp service not configured');
      }

      const result = await this.whatsappService.sendOutForDeliveryNotification(
        phoneNumber,
        notificationData
      );

      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'out_for_delivery',
        channel: 'whatsapp',
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });

      await this.updateOrderNotificationTimestamp(order.orderId);

    } catch (error: any) {
      logger.error('Failed to send out for delivery notification', error, { orderId: order.orderId });
    }
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDeliveredNotification(order: Order): Promise<void> {
    if (!this.shouldSendNotification(order, 'whatsapp')) return;

    const notificationData = this.buildNotificationData(order);
    const phoneNumber = formatPhoneForWhatsApp(order.customerInfo.phone);

    try {
      if (!this.whatsappService) {
        throw new Error('WhatsApp service not configured');
      }

      const result = await this.whatsappService.sendOrderDeliveredNotification(
        phoneNumber,
        notificationData
      );

      await this.logNotification({
        orderId: order.orderId,
        customerId: order.customerInfo.customerId,
        customerPhone: order.customerInfo.phone,
        notificationType: 'order_delivered',
        channel: 'whatsapp',
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date().toISOString(),
        retryCount: 0
      });

      await this.updateOrderNotificationTimestamp(order.orderId);

    } catch (error: any) {
      logger.error('Failed to send order delivered notification', error, { orderId: order.orderId });
    }
  }

  /**
   * Check if notification should be sent based on customer preferences
   */
  private shouldSendNotification(order: Order, channel: 'whatsapp' | 'sms' | 'email'): boolean {
    // Check if customer has opted in for WhatsApp notifications
    const preferences = order.customerNotifications?.notificationPreferences;
    
    if (channel === 'whatsapp') {
      return preferences?.whatsapp !== false; // Default to true if not specified
    }
    
    if (channel === 'sms') {
      return preferences?.sms !== false;
    }
    
    if (channel === 'email') {
      return preferences?.email === true; // Default to false for email
    }
    
    return true;
  }

  /**
   * Build notification data from order
   */
  private buildNotificationData(order: Order): OrderNotificationData {
    const itemNames = order.items.map(item => item.productName).join(', ');
    const deliveryAddress = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`;
    
    return {
      customerName: order.customerInfo.name,
      orderId: order.orderId,
      orderAmount: order.pricingInfo.grandTotal,
      items: itemNames,
      paymentMethod: order.paymentInfo.method,
      deliveryAddress: deliveryAddress,
      awbNumber: order.shipmentInfo.awb,
      trackingUrl: order.shipmentInfo.trackingUrl,
      courierPartner: order.shipmentInfo.courierPartner,
      expectedDeliveryDate: order.deliveryEstimate?.expectedDate 
        ? new Date(order.deliveryEstimate.expectedDate).toLocaleDateString('en-IN')
        : undefined,
      currentLocation: order.shipmentInfo.trackingLocation
    };
  }

  /**
   * Log notification attempt to database
   */
  private async logNotification(log: NotificationLog): Promise<void> {
    try {
      await db.collection('notification_logs').add({
        ...log,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.error('Failed to log notification', error);
    }
  }

  /**
   * Update order with last notification timestamp
   */
  private async updateOrderNotificationTimestamp(orderId: string): Promise<void> {
    try {
      await db.collection('orders').doc(orderId).update({
        'customerNotifications.lastNotificationSent': new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.error('Failed to update notification timestamp', error, { orderId });
    }
  }
}

// Factory function
export function createNotificationService(): OrderNotificationService {
  return new OrderNotificationService();
}

// Helper function to trigger notifications based on order status change
export async function triggerOrderStatusNotification(
  order: Order, 
  previousStatus?: string
): Promise<void> {
  const notificationService = createNotificationService();
  
  // Only send notification if status actually changed
  if (previousStatus === order.internalStatus) {
    return;
  }

  switch (order.internalStatus) {
    case 'approved':
      // Send order placed notification when order is approved
      await notificationService.sendOrderPlacedNotification(order);
      break;
      
    case 'shipped':
      await notificationService.sendOrderShippedNotification(order);
      break;
      
    case 'in_transit':
      // Check if this is a "picked" status or "out for delivery"
      if (order.shipmentInfo.currentTrackingStatus?.toLowerCase().includes('picked')) {
        await notificationService.sendOrderPickedNotification(order);
      } else if (order.shipmentInfo.currentTrackingStatus?.toLowerCase().includes('out for delivery')) {
        await notificationService.sendOutForDeliveryNotification(order);
      }
      break;
      
    case 'delivered':
      await notificationService.sendOrderDeliveredNotification(order);
      break;
  }
}