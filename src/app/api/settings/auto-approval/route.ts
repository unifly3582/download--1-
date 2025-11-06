// src/app/api/settings/auto-approval/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

// Defines the structure and validation for the settings
const AutoApprovalSettingsSchema = z.object({
  maxAutoApprovalValue: z.number().min(0),
  minCustomerAgeDays: z.number().int().min(0),
  allowNewCustomers: z.boolean(),
  requireVerifiedDimensions: z.boolean(),
  enableLearningMode: z.boolean(),
});

const SETTINGS_COLLECTION = 'settings'; // Consolidated settings collection
const SETTINGS_DOCUMENT = 'autoApproval'; // Document specific to these rules

/**
 * GET handler to fetch the current auto-approval settings.
 * Secured for admin access only.
 */
async function getSettingsHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOCUMENT);
    const doc = await docRef.get();

    if (!doc.exists) {
      // It's better to return default settings or an empty object than a 404
      // if the settings have never been saved.
      console.log('[API /settings/auto-approval] Settings document not found, returning default structure.');
      return NextResponse.json({ success: true, data: {} });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error) {
    console.error(`[API /settings/auto-approval] Error fetching settings by user ${authContext.user.uid}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings from server.' }, { status: 500 });
  }
}

/**
 * POST handler to update the auto-approval settings.
 * Secured for admin access only.
 */
async function updateSettingsHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const body = await request.json();
    const parseResult = AutoApprovalSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid data format provided.', details: parseResult.error.flatten() }, { status: 400 });
    }

    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOCUMENT);
    await docRef.set(parseResult.data, { merge: true });

    console.log(`[API /settings/auto-approval] Settings updated by user ${authContext.user.uid}.`);

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });

  } catch (error) {
    console.error(`[API /settings/auto-approval] Error updating settings by user ${authContext.user.uid}:`, error);
    return NextResponse.json({ success: false, error: 'A server error occurred while updating settings.' }, { status: 500 });
  }
}

// Export the secured handlers
export const GET = withAuth(['admin'])(getSettingsHandler);
export const POST = withAuth(['admin'])(updateSettingsHandler);