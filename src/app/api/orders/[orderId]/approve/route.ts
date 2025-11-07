import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase/server';
import admin from 'firebase-admin';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

interface ApprovalRequestBody {
  action: 'approve' | 'reject';
}

async function approveOrderHandler(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
  }

  try {
    const body: ApprovalRequestBody = await request.json();
    const { action } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const newInternalStatus = action === 'approve' ? 'approved' : 'rejected_manual';

    await orderRef.update({
      'approval.status': newStatus,
      'approval.approvedBy': authContext.user.uid,
      'approval.approvedAt': admin.firestore.FieldValue.serverTimestamp(),
      internalStatus: newInternalStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[OMS][MANUAL_APPROVAL] Order ${orderId} has been manually ${newStatus}.`);

    return NextResponse.json({ success: true, message: `Order ${newStatus} successfully.` });

  } catch (error: any) {
    console.error(`[OMS][MANUAL_APPROVAL][ERROR] Failed to update order ${orderId}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(approveOrderHandler);
