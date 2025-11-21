import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { z } from 'zod';

const UpdateAddressSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    zip: z.string().length(6, 'Pincode must be 6 digits'),
    country: z.string().min(2, 'Country is required')
  })
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = UpdateAddressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid address data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { shippingAddress } = validation.data;

    // Find the order by orderId field
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.where('orderId', '==', orderId).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderDoc = snapshot.docs[0];
    const orderData = orderDoc.data();

    // Check if order can be edited (not delivered or cancelled)
    const editableStatuses = [
      'payment_pending',
      'created_pending',
      'approved',
      'ready_for_shipping',
      'needs_manual_verification'
    ];

    if (!editableStatuses.includes(orderData.internalStatus)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot edit address for orders with status: ${orderData.internalStatus}` 
        },
        { status: 400 }
      );
    }

    // Update the address
    await orderDoc.ref.update({
      shippingAddress,
      updatedAt: new Date().toISOString()
    });

    // Log the address change in action log
    const actionLogEntry = {
      actionId: `addr_update_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionBy: 'admin', // You can enhance this with actual admin user info
      actionType: 'address_updated',
      actionDetails: `Address updated from verification call`,
      outcome: 'resolved',
      notes: `Old: ${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}\nNew: ${shippingAddress.street}, ${shippingAddress.city}`
    };

    // Add to action log if shipmentInfo exists
    if (orderData.shipmentInfo) {
      const currentActionLog = orderData.shipmentInfo.actionLog || [];
      await orderDoc.ref.update({
        'shipmentInfo.actionLog': [...currentActionLog, actionLogEntry]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        orderId,
        shippingAddress
      }
    });

  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update address',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
