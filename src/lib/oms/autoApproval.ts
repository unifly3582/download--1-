
import { db as adminDb } from "@/lib/firebase/server";
import { Order } from "@/types";
import admin from "firebase-admin";
import { logger } from "@/lib/logger";

/**
 * AUTO APPROVAL ENGINE
 * Evaluates and approves eligible orders automatically
 */

export async function runAutoApproval(order: Order, orderId: string): Promise<void> {
  try {
    logger.info('Checking order for auto-approval', { orderId });

    // Fetch Global Rules
    const settingsRef = adminDb.collection("settings").doc("autoApproval");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      logger.warn('No auto-approval settings found, skipping');
      return;
    }

    const settings = settingsSnap.data();
    if (!settings) {
        logger.warn('Auto-approval settings data is empty, skipping');
        return;
    }

    // 1️⃣ Customer Check
    const customerSnap = await adminDb.collection("customers").doc(order.customerInfo.phone).get();
    const customer = customerSnap.data();

    if (!customer) {
      logger.warn('Customer not found for auto-approval', { orderId, phone: order.customerInfo.phone });
      return;
    }

    if (customer.isDubious) {
      logger.info('Customer flagged as dubious, skipping auto-approval', { orderId });
      return;
    }

    // 2️⃣ Returning Customer Check
    const customerAgeMs = Date.now() - new Date(customer.createdAt).getTime();
    const isReturningCustomer = customerAgeMs > settings.minCustomerAgeDays * 24 * 60 * 60 * 1000;

    if (!isReturningCustomer && !settings.allowNewCustomers) {
      logger.info('New customer requires manual approval', { orderId });
      return;
    }

    // 3️⃣ Order Value Check
    if (order.pricingInfo.grandTotal > settings.maxAutoApprovalValue) {
      logger.info('Order exceeds auto-approval limit', { orderId, amount: order.pricingInfo.grandTotal, limit: settings.maxAutoApprovalValue });
      return;
    }

    // 4️⃣ Verified Dimensions Check
    if (settings.requireVerifiedDimensions) {
      const itemsCount = order.items.length;
      if (itemsCount > 1) {
        const combinationsRef = adminDb.collection("verifiedCombinations");
        // Firestore doesn't support deep equality checks on arrays of objects directly in where clauses.
        // This query will need to be adjusted based on how the 'items' are stored.
        // For now, we will assume a simple check and log a warning.
        logger.warn('Multi-item dimension check needs specific implementation', { orderId });
        // const snapshot = await combinationsRef
        //   .where("items", "==", order.items)
        //   .limit(1)
        //   .get();

        // if (snapshot.empty) {
        //   console.log("[OMS][AUTO_APPROVAL] New item combination detected — requires manual approval.");
        //   return;
        // }
      }
    }

    // 5️⃣ Passed All Rules → Approve
    await adminDb.collection("orders").doc(orderId).update({
      "approval.status": "approved",
      "approval.approvedBy": "auto",
      "approval.approvedAt": admin.firestore.FieldValue.serverTimestamp(),
      internalStatus: "approved",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('Order auto-approved', { orderId });

  } catch (error: any) {
    logger.error('Auto-approval error', error, { orderId });
  }
}
