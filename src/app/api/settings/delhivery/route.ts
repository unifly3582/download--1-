// src/app/api/settings/delhivery/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

// Firestore collection and document IDs
const COURIER_INTEGRATIONS_COLLECTION = "courierIntegrations";
const DELHIvery_DOC_ID = "delhivery";

// Schema for the data sent from the front-end form
const postBodySchema = z.object({
    apiKey: z.string().trim().min(1, { message: "API Key is required" }),
    pickupLocationName: z.string().trim().min(1, { message: "Pickup Location Name is required" }),
});

/**
 * GET handler to fetch current Delhivery settings.
 * Secured for admin access only.
 */
async function getDelhiverySettingsHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const docRef = db.collection(COURIER_INTEGRATIONS_COLLECTION).doc(DELHIvery_DOC_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      // If the document doesn't exist, return empty values that the form expects
      return NextResponse.json({ 
        success: true,
        data: { apiKey: '', pickupLocationName: '' } 
      });
    }
    const data = doc.data();

    // Adapt the stored data to the format the frontend form expects
    const formData = {
        apiKey: data?.api?.authKey || '',
        pickupLocationName: data?.pickupLocationName || ''
    }

    return NextResponse.json({ success: true, data: formData });
  } catch (error) {
    console.error(`[API /settings/delhivery] Error fetching settings by user ${authContext.user.uid}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

/**
 * POST handler to update Delhivery settings.
 * Secured for admin access only.
 */
async function updateDelhiverySettingsHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const body = await request.json();
    // Validate the incoming request body
    const parseResult = postBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid data provided.', details: parseResult.error.flatten() }, { status: 400 });
    }

    const { apiKey, pickupLocationName } = parseResult.data;

    // Construct the object that matches the Firestore structure
    const settingsData = {
        name: "Delhivery",
        isActive: true, // It's safe to assume it should be active when settings are updated
        api: {
            authKey: apiKey
        },
        pickupLocationName: pickupLocationName
    };

    const docRef = db.collection(COURIER_INTEGRATIONS_COLLECTION).doc(DELHIvery_DOC_ID);
    
    // Use merge:true to avoid overwriting other potential fields
    await docRef.set(settingsData, { merge: true });
    
    console.log(`[API /settings/delhivery] Delhivery settings updated by user ${authContext.user.uid}.`);

    return NextResponse.json({ success: true, message: 'Delhivery settings updated successfully.' });
  } catch (error) {
    console.error(`[API /settings/delhivery] Error updating settings by user ${authContext.user.uid}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to save settings.' }, { status: 500 });
  }
}

// Export the secured handlers
export const GET = withAuth(['admin'])(getDelhiverySettingsHandler);
export const POST = withAuth(['admin'])(updateDelhiverySettingsHandler);