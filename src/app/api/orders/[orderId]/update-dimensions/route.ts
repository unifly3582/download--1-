// src/app/api/orders/[orderId]/update-dimensions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import crypto from 'crypto';
import { Order } from '@/types/order';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

// CORRECTED: This schema now uses 'b' for width to match the central Order type.
const UpdateDimensionsSchema = z.object({
  weight: z.number().positive('Weight must be a positive number.'),
  dimensions: z.object({
    l: z.number().positive('Length must be a positive number.'),
    b: z.number().positive('Width must be a positive number.'), // Use 'b'
    h: z.number().positive('Height must be a positive number.'),
  }),
});

function createCombinationHash(items: any[]): string {
  const skus = items.map(item => `${item.sku}_${item.quantity}`).sort().join('S');
  return crypto.createHash('md5').update(skus).digest('hex');
}

async function updateDimensionsHandler(request: NextRequest, context: { params: { orderId: string } }, authContext: AuthContext) {
  const { orderId } = context.params;
  const orderRef = db.collection("orders").doc(orderId);

  try {
    const body = await request.json();
    const parseResult = UpdateDimensionsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid data provided.', details: parseResult.error.flatten() }, { status: 400 });
    }

    const { weight, dimensions } = parseResult.data;

    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    const orderData = orderSnap.data() as Order;

    const combinationHash = createCombinationHash(orderData.items);
    const combinationRef = db.collection('verifiedCombinations').doc(combinationHash);
    const combinationData = { 
        weight, 
        dimensions, // This now correctly contains { l, b, h }
        items: orderData.items, 
        verifiedAt: new Date(),
        updatedBy: authContext.user.uid
    };
    await combinationRef.set(combinationData, { merge: true });

    await orderRef.update({
      weight: weight,
      dimensions: dimensions, // This now correctly contains { l, b, h }
      needsManualWeightAndDimensions: false,
      internalStatus: 'created_pending',
    });

    console.log(`[API /update-dimensions] Dimensions for order ${orderId} updated by user ${authContext.user.uid}.`);
    return NextResponse.json({ success: true, message: 'Order dimensions updated and combination has been cached.' });

  } catch (error) {
    console.error(`[API /update-dimensions] Error updating dimensions for order ${orderId}:`, error);
    return NextResponse.json({ success: false, error: 'A server error occurred.' }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(updateDimensionsHandler);