// src/app/api/verified-combinations/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

const UpdateCombinationSchema = z.object({
    weight: z.number().positive(),
    dimensions: z.object({
        l: z.number().positive(),
        b: z.number().positive(),
        h: z.number().positive(),
    }),
});

/**
 * PUT handler to update a specific product combination.
 * Secured for admin access only.
 */
async function updateCombinationHandler(request: NextRequest, context: { params: { id: string } }, authContext: AuthContext) {
    try {
        const { id } = context.params;
        const docRef = db.collection('verifiedCombinations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ success: false, error: 'Combination not found.' }, { status: 404 });
        }
        
        const body = await request.json();
        const parseResult = UpdateCombinationSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({ success: false, error: 'Invalid data provided.', details: parseResult.error.flatten() }, { status: 400 });
        }

        await docRef.update(parseResult.data);
        
        console.log(`[API /verified-combinations] Combination ${id} updated by user ${authContext.user.uid}.`);

        return NextResponse.json({ success: true, message: 'Combination updated successfully.' });

    } catch (error) {
        const id = context.params.id;
        console.error(`[API /verified-combinations] Error updating combination ${id} by user ${authContext.user.uid}:`, error);
        return NextResponse.json({ success: false, error: 'A server error occurred.' }, { status: 500 });
    }
}

/**
 * DELETE handler to remove a specific product combination.
 * Secured for admin access only.
 */
async function deleteCombinationHandler(request: NextRequest, context: { params: { id: string } }, authContext: AuthContext) {
    try {
        const { id } = context.params;
        const docRef = db.collection('verifiedCombinations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ success: false, error: 'Combination not found.' }, { status: 404 });
        }

        await docRef.delete();
        
        console.log(`[API /verified-combinations] Combination ${id} DELETED by user ${authContext.user.uid}.`);

        return NextResponse.json({ success: true, message: 'Combination deleted successfully.' });
    } catch (error) {
        const id = context.params.id;
        console.error(`[API /verified-combinations] Error DELETING combination ${id} by user ${authContext.user.uid}:`, error);
        return NextResponse.json({ success: false, error: 'A server error occurred.' }, { status: 500 });
    }
}

// Export the secured handlers
export const PUT = withAuth(['admin'])(updateCombinationHandler);
export const DELETE = withAuth(['admin'])(deleteCombinationHandler);