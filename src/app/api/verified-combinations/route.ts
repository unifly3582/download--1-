import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

const CombinationSchema = z.object({
  hash: z.string(),
  weight: z.number(),
  dimensions: z.object({
    l: z.number(),
    w: z.number(), // Standardize to 'w'
    h: z.number(),
  }),
});

async function saveCombinationHandler(req: NextRequest, context: any, authContext: AuthContext) {
  try {
    const body = await req.json();
    const validation = CombinationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
    }

    const { hash, weight, dimensions } = validation.data;

    // Save to Firestore
    const combinationRef = db.collection('verifiedCombinations').doc(hash);
    await combinationRef.set({
      weight,
      dimensions,
      verifiedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Combination saved.' });

  } catch (error) {
    console.error("Error saving combination:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(saveCombinationHandler);
