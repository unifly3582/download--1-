
import { createDelhiveryShipment } from "./courierAdapters/delhivery";
import { createManualShipment } from "./courierAdapters/manual";
import { db as adminDb } from "@/lib/firebase/server";
import { Order } from "@/types/order";
import admin from "firebase-admin";
import { AdapterResponse } from "./courierAdapters/types"; // Import the standardized response type
import { logger } from "@/lib/logger";

export async function createShipment(orderId: string, courier: string, manualAwb?: string) {
  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) {
    logger.error('Attempted to create shipment for non-existent order', null, { orderId });
    throw new Error("Order not found");
  }

  const orderData = orderSnap.data() as Order;

  // --- CRITICAL PAYMENT VERIFICATION ---
  const isCOD = orderData.paymentInfo.method === "COD";
  const isPaid = orderData.paymentInfo.status === "Completed";

  if (!isCOD && !isPaid) {
    logger.error('BLOCKED: Attempted to create shipment for an unpaid order', null, { 
      orderId, 
      paymentStatus: orderData.paymentInfo.status 
    });
    // Return a standardized error shape instead of throwing
    return { success: false, error: "Cannot ship an unpaid order." };
  }

  if (!orderData.weight || !orderData.dimensions) {
    logger.error('BLOCKED: Order is missing weight or dimensions', null, { orderId });
    return { success: false, error: "Order is missing weight or dimensions and cannot be shipped." };
  }

  // -------------------------------------

  let result: AdapterResponse;

  switch (courier) {
    case "delhivery":
      result = await createDelhiveryShipment(orderId, orderData);
      break;
    case "manual":
      result = await createManualShipment(orderId, orderData, manualAwb || '');
      break;
    default:
      const errorMsg = `Unsupported courier: ${courier}`;
      logger.error('Unsupported courier', null, { courier, orderId });
      return { success: false, error: errorMsg };
  }

  // --- Centralized Firestore Update (OPTIMIZED - Save only essential data) --- 
  const updatePayload: any = {
      "shipmentInfo.courierPartner": courier,
      "shipmentInfo.shipmentMode": courier === 'manual' ? 'manual' : 'auto_api',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (result.success) {
      updatePayload["shipmentInfo.awb"] = result.awb;
      updatePayload["shipmentInfo.trackingUrl"] = result.trackingUrl;
      updatePayload.internalStatus = "shipped";
      
      // Save essential metadata only (not full API request/response)
      if (result.metadata) {
        if (result.metadata.pickupLocation) {
          updatePayload["shipmentInfo.pickupLocation"] = result.metadata.pickupLocation;
        }
        if (result.metadata.uploadWbn) {
          updatePayload["shipmentInfo.uploadWbn"] = result.metadata.uploadWbn;
        }
        if (result.metadata.shippedAt) {
          updatePayload["shipmentInfo.shippedAt"] = result.metadata.shippedAt;
        }
      }
      
      // Enable automatic tracking for API-based couriers (not manual)
      if (courier !== 'manual') {
        updatePayload.needsTracking = true;
      }
      
      logger.info('Successfully created shipment', { 
        orderId, 
        courier, 
        awb: result.awb,
        // Log full API data for debugging (not saved to DB)
        apiRequest: result.apiRequest,
        apiResponse: result.apiResponse
      });
  } else {
      updatePayload["shipmentInfo.error"] = result.error;
      
      // For errors, optionally save minimal debug info
      // (You can remove this if you don't want any API data saved)
      if (result.apiResponse?.packages?.[0]?.remarks) {
        updatePayload["shipmentInfo.errorDetails"] = result.apiResponse.packages[0].remarks.join(', ');
      }
      
      logger.error('Failed to create shipment', null, { 
        orderId, 
        courier, 
        error: result.error,
        // Log full API data for debugging
        apiRequest: result.apiRequest,
        apiResponse: result.apiResponse
      });
  }

  await orderRef.update(updatePayload);

  // Sync to customer orders collection
  try {
    const { updateCustomerOrderTracking } = await import('./customerOrderSync');
    if (result.success) {
      await updateCustomerOrderTracking(orderId, {
        currentStatus: 'shipped',
        lastUpdate: new Date().toISOString()
      });
    }
  } catch (syncError) {
    logger.error('Customer sync failed', syncError, { orderId });
    // Don't fail the shipping if customer sync fails
  }

  // Send WhatsApp notification if shipment was successful
  if (result.success) {
    try {
      const { createNotificationService } = await import('./notifications');
      const notificationService = createNotificationService();
      
      // Get updated order data with shipment info
      const updatedOrderSnap = await orderRef.get();
      const updatedOrderData = updatedOrderSnap.data() as Order;
      
      // Convert timestamps for notification service
      const orderForNotification = {
        ...updatedOrderData,
        createdAt: typeof updatedOrderData.createdAt === 'string' 
          ? updatedOrderData.createdAt 
          : updatedOrderData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Order;
      
      await notificationService.sendOrderShippedNotification(orderForNotification);
      logger.info('WhatsApp shipped notification sent', { orderId });
    } catch (notificationError) {
      logger.error('WhatsApp notification failed', notificationError, { orderId });
      // Don't fail the shipping if notification fails
    }
  }

  return result;
}
