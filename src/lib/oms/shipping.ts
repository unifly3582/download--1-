
import { createDelhiveryShipment } from "./courierAdapters/delhivery";
import { createManualShipment } from "./courierAdapters/manual";
import { db as adminDb } from "@/lib/firebase/server";
import { Order } from "@/types/order";
import admin from "firebase-admin";
import { AdapterResponse } from "./courierAdapters/types"; // Import the standardized response type

export async function createShipment(orderId: string, courier: string, manualAwb?: string) {
  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) {
    console.error(`[SHIPPING] Attempted to create shipment for non-existent order: ${orderId}`);
    throw new Error("Order not found");
  }

  const orderData = orderSnap.data() as Order;

  // --- CRITICAL PAYMENT VERIFICATION ---
  const isCOD = orderData.paymentInfo.method === "COD";
  const isPaid = orderData.paymentInfo.status === "Completed";

  if (!isCOD && !isPaid) {
    const errorMessage = `[SHIPPING] BLOCKED: Attempted to create shipment for an unpaid order. OrderID: ${orderId}, Payment Status: ${orderData.paymentInfo.status}`;
    console.error(errorMessage);
    // Return a standardized error shape instead of throwing
    return { success: false, error: "Cannot ship an unpaid order." };
  }

  if (!orderData.weight || !orderData.dimensions) {
    const errorMessage = `[SHIPPING] BLOCKED: Order is missing weight or dimensions. OrderID: ${orderId}`;
    console.error(errorMessage);
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
      console.error(`[SHIPPING] ${errorMsg}`);
      return { success: false, error: errorMsg };
  }

  // --- Centralized Firestore Update --- 
  const updatePayload: any = {
      "shipmentInfo.courierPartner": courier,
      "shipmentInfo.apiRequest": result.apiRequest || null,
      "shipmentInfo.apiResponse": result.apiResponse || null,
      "shipmentInfo.shipmentMode": courier === 'manual' ? 'manual' : 'auto_api',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (result.success) {
      updatePayload["shipmentInfo.awb"] = result.awb;
      updatePayload["shipmentInfo.trackingUrl"] = result.trackingUrl;
      updatePayload.internalStatus = "shipped";
      console.log(`[SHIPPING] Successfully created shipment for order: ${orderId} via ${courier}`);
  } else {
      updatePayload["shipmentInfo.error"] = result.error;
      console.error(`[SHIPPING] Failed to create shipment for order: ${orderId}. Reason: ${result.error}`);
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
    console.error(`[SHIPPING] Customer sync failed for ${orderId}:`, syncError);
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
      console.log(`[SHIPPING] WhatsApp shipped notification sent for order: ${orderId}`);
    } catch (notificationError) {
      console.error(`[SHIPPING] WhatsApp notification failed for ${orderId}:`, notificationError);
      // Don't fail the shipping if notification fails
    }
  }

  return result;
}
