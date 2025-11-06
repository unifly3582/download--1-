// src/app/api/orders/[orderId]/ship/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createShipment } from "@/lib/oms/shipping";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { z } from 'zod';

const ShipBodySchema = z.object({
  courier: z.string().min(1, { message: 'Courier selection is required.' }),
  manualAwb: z.string().optional(),
});

async function createShipmentHandler(
  request: NextRequest, 
  context: { params: { orderId: string } }, // The type is correct
  authContext: AuthContext
): Promise<NextResponse> {
  const { orderId } = context.params;

  try {
    const body = await request.json();
    const parseResult = ShipBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid data provided.', details: parseResult.error.flatten() }, { status: 400 });
    }
    const { courier, manualAwb } = parseResult.data;
    
    console.log(`[API /ship] Shipment creation for order ${orderId} initiated by user ${authContext.user.uid}. Courier: ${courier}`);
    const result = await createShipment(orderId, courier, manualAwb);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`[API /ship] Critical error creating shipment for order ${orderId} by user ${authContext.user.uid}:`, error);
    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}

export const POST = withAuth(['admin', 'machine'])(createShipmentHandler);