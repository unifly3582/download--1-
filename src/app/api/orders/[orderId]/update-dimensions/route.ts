// src/app/api/orders/[orderId]/update-dimensions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { z } from 'zod';
import { Order } from '@/types/order';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { CombinationService } from '@/lib/oms/combinationService';

// CORRECTED: This schema now uses 'b' for width to match the central Order type.
const UpdateDimensionsSchema = z.object({
  weight: z.number().positive('Weight must be a positive number.'),
  dimensions: z.object({
    l: z.number().positive('Length must be a positive number.'),
    b: z.number().positive('Width must be a positive number.'), // Use 'b'
    h: z.number().positive('Height must be a positive number.'),
  }),
});



async function updateDimensionsHandler(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }, authContext: AuthContext) {
  const { orderId } = await params;
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

    // Save the verified combination using the new service
    const combinationHash = await CombinationService.saveCombination(
      orderData.items,
      weight,
      dimensions,
      authContext.user.uid,
      `Updated via order ${orderId} dimensions`
    );

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