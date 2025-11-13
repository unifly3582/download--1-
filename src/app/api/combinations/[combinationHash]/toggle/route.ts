import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { z } from 'zod';
import admin from 'firebase-admin';

const ToggleSchema = z.object({
  isActive: z.boolean(),
});

async function toggleCombinationHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ combinationHash: string }> }, 
  authContext: AuthContext
) {
  const { combinationHash } = await params;
  
  try {
    const body = await request.json();
    const parseResult = ToggleSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data provided.' 
      }, { status: 400 });
    }

    const { isActive } = parseResult.data;

    const combinationRef = db.collection('verifiedCombinations').doc(combinationHash);
    const doc = await combinationRef.get();

    if (!doc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Combination not found.' 
      }, { status: 404 });
    }

    await combinationRef.update({
      isActive,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      message: `Combination ${isActive ? 'activated' : 'deactivated'} successfully` 
    });

  } catch (error: any) {
    console.error(`[API /combinations/${combinationHash}/toggle] Error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to toggle combination status' 
    }, { status: 500 });
  }
}

export const PATCH = withAuth(['admin'])(toggleCombinationHandler);
