// src/app/api/customers/recalculate/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/firebase/server";
import { updateLoyaltyTier } from "@/lib/oms/customerUtils";
import { Customer } from "@/types/customers";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";

/**
 * POST handler to trigger a batch recalculation of loyalty tiers for all customers.
 * Secured for admin access only.
 */
async function recalculateCustomersHandler(request: NextRequest, context: any, authContext: AuthContext) {
  console.log(`[API /customers/recalculate] Request initiated by user ${authContext.user.uid}.`);

  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;

  try {
    const customersSnapshot = await db.collection("customers").get();
    processedCount = customersSnapshot.size;
    
    if (processedCount === 0) {
        return NextResponse.json({
            success: true,
            message: "No customers found to process.",
            data: { totalProcessed: 0, successCount: 0, failureCount: 0 },
        });
    }

    const promises = customersSnapshot.docs.map(async (doc) => {
      const customer = doc.data() as Customer;
      // Ensure customer phone exists to avoid errors
      if (!customer.phone) {
        console.warn(`[API /customers/recalculate] Skipping customer with ID ${doc.id} due to missing phone number.`);
        failureCount++;
        return;
      }
      
      const phone = customer.phone;

      try {
        await updateLoyaltyTier(phone);
        successCount++;
      } catch (e: any) {
        console.error(`[API /customers/recalculate] Failed to update loyalty for customer ${phone}:`, e.message);
        failureCount++;
      }
    });

    await Promise.all(promises);

    console.log(`[API /customers/recalculate] Batch job completed. Success: ${successCount}, Failures: ${failureCount}.`);

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: processedCount,
        successCount,
        failureCount,
        notes: "Trust score recalculation was not performed as it requires an order-specific context."
      },
    });

  } catch (error: any) {
    console.error(`[API /customers/recalculate] Critical error during batch job initiated by ${authContext.user.uid}:`, error.message);
    return NextResponse.json({ success: false, error: "A server error occurred during batch recalculation." }, { status: 500 });
  }
}

// Export the secured handler
export const POST = withAuth(['admin'])(recalculateCustomersHandler);