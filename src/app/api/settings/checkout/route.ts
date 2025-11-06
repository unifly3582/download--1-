// src/app/api/settings/checkout/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

// Defines the structure for the checkout settings
const CheckoutSettingsSchema = z.object({
  codCharges: z.object({
    type: z.enum(['fixed', 'percentage']),
    value: z.number(),
  }),
  prepaidDiscount: z.object({
    type: z.enum(['fixed', 'percentage']),
    value: z.number(),
  }),
});

const SETTINGS_COLLECTION = 'settings'; // Consolidated settings collection
const SETTINGS_DOCUMENT = 'checkout';   // Document specific to these rules

/**
 * GET handler to fetch the current checkout settings.
 * Secured for admin access only.
 */
async function getCheckoutSettingsHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOCUMENT);
    const doc = await docRef.get();

    if (!doc.exists) {
      // Return default settings if no document is found
      return NextResponse.json({
        success: true,
        data: { 
          codCharges: { type: 'fixed', value: 0 }, 
          prepaidDiscount: { type: 'fixed', value: 0 } 
        }
      });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error) {
    console.error(`[API /settings/checkout] Error fetching settings by user ${authContext.user.uid}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings from server.' }, { status: 500 });
  }
}

/**
 * POST handler to update the checkout settings.
 * Secured for admin access only.
 */
async function updateCheckoutSettingsHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const body = await request.json();
    const parseResult = CheckoutSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid data format provided.', details: parseResult.error.flatten() }, { status: 400 });
    }

    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOCUMENT);
    await docRef.set(parseResult.data, { merge: true });

    console.log(`[API /settings/checkout] Checkout settings updated by user ${authContext.user.uid}.`);

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });

  } catch (error) {
    console.error(`[API /settings/checkout] Error updating settings by user ${authContext.user.uid}:`, error);
    return NextResponse.json({ success: false, error: 'A server error occurred while updating settings.' }, { status: 500 });
  }
}

// Export the secured handlers
export const GET = withAuth(['admin'])(getCheckoutSettingsHandler);
export const POST = withAuth(['admin'])(updateCheckoutSettingsHandler);