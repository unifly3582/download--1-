import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { z } from 'zod';
import admin from 'firebase-admin';

const UpdateCombinationSchema = z.object({
  weight: z.number().positive('Weight must be a positive number.'),
  dimensions: z.object({
    l: z.number().positive('Length must be a positive number.'),
    b: z.number().positive('Width must be a positive number.'),
    h: z.number().positive('Height must be a positive number.'),
  }),
  notes: z.string().optional(),
});

async function updateCombinationHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ combinationHash: string }> }, 
  authContext: AuthContext
) {
  const { combinationHash } = await params;
  
  try {
    const body = await request.json();
    const parseResult = UpdateCombinationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data provided.', 
        details: parseResult.error.flatten() 
      }, { status: 400 });
    }

    const { weight, dimensions, notes } = parseResult.data;

    const combinationRef = db.collection('verifiedCombinations').doc(combinationHash);
    const doc = await combinationRef.get();

    if (!doc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Combination not found.' 
      }, { status: 404 });
    }

    const updateData: any = {
      weight,
      dimensions,
      updatedBy: authContext.user.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (notes !== undefined) {
      updateData.notes = notes || admin.firestore.FieldValue.delete();
    }

    await combinationRef.update(updateData);

    return NextResponse.json({ 
      success: true, 
      message: 'Combination updated successfully' 
    });

  } catch (error: any) {
    console.error(`[API /combinations/${combinationHash}] Error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update combination' 
    }, { status: 500 });
  }
}

async function deleteCombinationHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ combinationHash: string }> }, 
  authContext: AuthContext
) {
  const { combinationHash } = await params;
  
  try {
    const combinationRef = db.collection('verifiedCombinations').doc(combinationHash);
    const doc = await combinationRef.get();

    if (!doc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Combination not found.' 
      }, { status: 404 });
    }

    await combinationRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Combination deleted successfully' 
    });

  } catch (error: any) {
    console.error(`[API /combinations/${combinationHash}] Delete error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete combination' 
    }, { status: 500 });
  }
}

export const PATCH = withAuth(['admin'])(updateCombinationHandler);
export const DELETE = withAuth(['admin'])(deleteCombinationHandler);
