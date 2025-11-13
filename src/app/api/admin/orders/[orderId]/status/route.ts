// API endpoint to update order status and trigger notifications
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/server';
import { Order, OrderSchema } from '@/types/order';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { triggerOrderStatusNotification } from '@/lib/oms/notifications';
import admin from 'firebase-admin';

const UpdateOrderStatusSchema = z.object({
  internalStatus: z.enum([
    "created_pending", "approved", "ready_for_shipping",
    "shipped", "in_transit", "pending", "delivered",
    "return_initiated", "returned", "cancelled", "needs_manual_verification"
  ]),
  shipmentInfo: z.object({
    courierPartner: z.string().optional(),
    awb: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    currentTrackingStatus: z.string().optional(),
    trackingLocation: z.string().optional(),
  }).optional(),
  deliveryEstimate: z.object({
    expectedDate: z.string().datetime(),
    earliestDate: z.string().datetime().optional(),
    latestDate: z.string().datetime().optional(),
  }).optional(),
  notes: z.string().optional()
});

async function updateOrderStatusHandler(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
  authContext: AuthContext
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    
    const parseResult = UpdateOrderStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }

    const updateData = parseResult.data;

    // Get current order
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const currentOrderData = orderDoc.data();
    const previousStatus = currentOrderData?.internalStatus;

    // Prepare update object
    const updateObject: any = {
      internalStatus: updateData.internalStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update shipment info if provided
    if (updateData.shipmentInfo) {
      Object.keys(updateData.shipmentInfo).forEach(key => {
        if (updateData.shipmentInfo![key as keyof typeof updateData.shipmentInfo] !== undefined) {
          updateObject[`shipmentInfo.${key}`] = updateData.shipmentInfo![key as keyof typeof updateData.shipmentInfo];
        }
      });
    }

    // Update delivery estimate if provided
    if (updateData.deliveryEstimate) {
      updateObject.deliveryEstimate = updateData.deliveryEstimate;
    }

    // Add status change log
    if (updateData.notes) {
      const statusChangeLog = {
        timestamp: new Date().toISOString(),
        previousStatus,
        newStatus: updateData.internalStatus,
        changedBy: authContext.user.uid,
        notes: updateData.notes
      };

      updateObject['shipmentInfo.actionLog'] = admin.firestore.FieldValue.arrayUnion(statusChangeLog);
    }

    // Update the order
    await orderRef.update(updateObject);

    // Get updated order for notification
    const updatedOrderDoc = await orderRef.get();
    const updatedOrderData = updatedOrderDoc.data();

    // Convert Firestore timestamps to ISO strings for validation
    const orderForValidation = {
      ...updatedOrderData,
      createdAt: updatedOrderData?.createdAt?.toDate?.()?.toISOString() || updatedOrderData?.createdAt,
      updatedAt: updatedOrderData?.updatedAt?.toDate?.()?.toISOString() || updatedOrderData?.updatedAt,
      approval: {
        ...updatedOrderData?.approval,
        approvedAt: updatedOrderData?.approval?.approvedAt?.toDate?.()?.toISOString() || updatedOrderData?.approval?.approvedAt
      }
    };

    const orderValidation = OrderSchema.safeParse(orderForValidation);
    
    if (orderValidation.success) {
      // Trigger notification if status changed
      if (previousStatus !== updateData.internalStatus) {
        try {
          await triggerOrderStatusNotification(orderValidation.data, previousStatus);
          console.log(`[Order Status] Notification triggered for ${orderId}: ${previousStatus} -> ${updateData.internalStatus}`);
        } catch (notificationError) {
          console.error(`[Order Status] Notification failed for ${orderId}:`, notificationError);
          // Don't fail the status update if notification fails
        }
      }
    } else {
      console.warn(`[Order Status] Order validation failed for ${orderId}:`, orderValidation.error.flatten());
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      orderId,
      previousStatus,
      newStatus: updateData.internalStatus,
      notificationTriggered: previousStatus !== updateData.internalStatus
    });

  } catch (error: any) {
    console.error('[Order Status] Update failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update order status',
      details: error.message
    }, { status: 500 });
  }
}

// Bulk status update endpoint
async function bulkUpdateStatusHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const body = await request.json();
    const { orderIds, status, shipmentInfo, notes } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order IDs array is required'
      }, { status: 400 });
    }

    const results = [];
    
    for (const orderId of orderIds) {
      try {
        const updateData = {
          internalStatus: status,
          ...(shipmentInfo && { shipmentInfo }),
          ...(notes && { notes })
        };

        // Use the same logic as single update
        const mockContext = { params: Promise.resolve({ orderId }) };
        const mockRequest = {
          json: async () => updateData
        } as NextRequest;

        await updateOrderStatusHandler(mockRequest, mockContext, authContext);
        results.push({ orderId, success: true });
      } catch (error: any) {
        results.push({ orderId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Updated ${successCount}/${orderIds.length} orders`,
      results
    });

  } catch (error: any) {
    console.error('[Bulk Order Status] Update failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to bulk update order status',
      details: error.message
    }, { status: 500 });
  }
}

export const PUT = withAuth(['admin'])(updateOrderStatusHandler);
export const PATCH = withAuth(['admin'])(bulkUpdateStatusHandler);