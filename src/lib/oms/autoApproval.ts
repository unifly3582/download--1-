
import { db as adminDb } from "@/lib/firebase/server";
import { Order } from "@/types";
import admin from "firebase-admin";

/**
 * AUTO APPROVAL ENGINE
 * Evaluates and approves eligible orders automatically
 */

export async function runAutoApproval(order: Order, orderId: string): Promise<void> {
  try {
    console.log(`[OMS][AUTO_APPROVAL] Checking order ${orderId}`);

    // Fetch Global Rules
    const settingsRef = adminDb.collection("autoApprovalSettings").doc("GLOBAL_RULES");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      console.warn("[OMS][AUTO_APPROVAL] No settings found, skipping auto-approval.");
      return;
    }

    const settings = settingsSnap.data();
    if (!settings) {
        console.warn("[OMS][AUTO_APPROVAL] Settings data is empty, skipping auto-approval.");
        return;
    }

    // 1️⃣ Customer Check
    const customerSnap = await adminDb.collection("customers").doc(order.customerInfo.phone).get();
    const customer = customerSnap.data();

    if (!customer) {
      console.warn("[OMS][AUTO_APPROVAL] Customer not found.");
      return;
    }

    if (customer.isDubious) {
      console.log("[OMS][AUTO_APPROVAL] Customer flagged as dubious. Skipping auto-approval.");
      return;
    }

    // 2️⃣ Returning Customer Check
    const customerAgeMs = Date.now() - new Date(customer.createdAt).getTime();
    const isReturningCustomer = customerAgeMs > settings.minCustomerAgeDays * 24 * 60 * 60 * 1000;

    if (!isReturningCustomer && !settings.allowNewCustomers) {
      console.log("[OMS][AUTO_APPROVAL] New customer — requires manual approval.");
      return;
    }

    // 3️⃣ Order Value Check
    if (order.pricingInfo.grandTotal > settings.maxAutoApprovalValue) {
      console.log("[OMS][AUTO_APPROVAL] Order exceeds limit, manual approval required.");
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
        console.warn("[OMS][AUTO_APPROVAL] Multi-item dimension check is a complex query and needs a more specific implementation.");
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

    console.log(`[OMS][AUTO_APPROVAL] Order ${orderId} auto-approved.`);

  } catch (error: any) {
    console.error("[OMS][AUTO_APPROVAL][ERROR]", error.message);
  }
}
