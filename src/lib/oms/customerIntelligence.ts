
import { db } from "@/lib/firebase/server";
import { Order, OrderSchema } from "@/types/order";
import { 
  getCustomerByPhone, 
  updateCustomerMetrics, 
  recalculateTrustScore, 
  updateLoyaltyTier 
} from "./customerUtils";
import admin from "firebase-admin";

/**
 * Updates customer metrics based on order status changes.
 * @param orderId The ID of the order that was updated.
 * @param newStatus The new status of the order.
 */
export async function updateCustomerAfterOrder(orderId: string, newStatus: string): Promise<void> {
  console.log(`[customerIntelligence] Processing updates for order ${orderId} with new status: ${newStatus}`);

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.error(`[customerIntelligence] Order ${orderId} not found.`);
      return;
    }

    const order = orderSnap.data() as Order;
    const phone = order.customerInfo.phone;
    const customer = await getCustomerByPhone(phone);

    if (!customer) {
      console.error(`[customerIntelligence] Customer with phone ${phone} not found for order ${orderId}.`);
      return;
    }

    // Rule-based updates
    switch (newStatus) {
      case "approved":
        if (customer.totalOrders === 0) {
            await recalculateTrustScore(phone, "delivered"); // Simplified logic, using delivered for a positive bump
            console.log(`[customerIntelligence] New customer bonus for ${phone}.`);
        }
        break;
      case "delivered":
        await updateCustomerMetrics(phone, {
          totalOrders: 1,
          totalSpent: order.pricingInfo.grandTotal,
        });
        await recalculateTrustScore(phone, "delivered");
        console.log(`[customerIntelligence] Updated metrics for ${phone} after delivery.`);
        break;
      case "return_initiated":
        await recalculateTrustScore(phone, "cancelled"); // Simplified, using cancelled for negative bump
        console.log(`[customerIntelligence] Updated trust score for ${phone} after return initiation.`);
        break;
      case "cancelled":
        await updateCustomerMetrics(phone, { refundsCount: 1 });
        await recalculateTrustScore(phone, "cancelled");
        console.log(`[customerIntelligence] Updated metrics for ${phone} after cancellation.`);
        break;
      default:
        console.log(`[customerIntelligence] No specific action for status: ${newStatus}`);
        break;
    }

    // Recalculate loyalty tier after any potential change in order count
    await updateLoyaltyTier(phone);

    // Update timestamps - find correct customer document reference
    const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
    const phoneDoc = await db.collection("customers").doc(phone).get();
    
    let customerRef;
    if (customerIdDoc.exists) {
      customerRef = db.collection("customers").doc(customer.customerId);
    } else if (phoneDoc.exists) {
      customerRef = db.collection("customers").doc(phone);
    } else {
      console.error(`[customerIntelligence] Could not find customer document for ${phone}`);
      return;
    }
    
    await customerRef.update({
      lastOrderAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[customerIntelligence] Successfully processed all updates for customer ${phone}.`);

  } catch (error: any) {
    console.error(`[customerIntelligence] Error updating customer after order ${orderId}:`, error.message);
  }
}
