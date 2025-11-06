
import { NextResponse } from 'next/server';
import { db } from "@/lib/firebase/server";
import admin from "firebase-admin";
import crypto from 'crypto';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req: Request) {
  console.log("[RAZORPAY_WEBHOOK] Received a request.");

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("[RAZORPAY_WEBHOOK] CRITICAL: Webhook secret is not configured.");
    return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
  }

  try {
    const text = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.warn("[RAZORPAY_WEBHOOK] Missing signature.");
      return NextResponse.json({ success: false, error: "Missing signature." }, { status: 400 });
    }

    // 1. VERIFY THE SIGNATURE
    const hmac = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET);
    hmac.update(text);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      console.warn("[RAZORPAY_WEBHOOK] Invalid signature.");
      return NextResponse.json({ success: false, error: "Invalid signature." }, { status: 403 });
    }

    // 2. PROCESS THE EVENT
    const event = JSON.parse(text);
    console.log(`[RAZORPAY_WEBHOOK] Processing event: ${event.event}`);

    if (event.event === 'order.paid') {
      const orderId = event.payload.order.entity.receipt;
      const paymentId = event.payload.payment.entity.id;

      if (!orderId) {
          console.warn("[RAZORPAY_WEBHOOK] 'order.paid' event is missing the receipt (orderId).");
          return NextResponse.json({ success: true }); // Acknowledge to prevent retries
      }

      const orderRef = db.collection('orders').doc(orderId);
      
      // 3. UPDATE THE ORDER IN FIRESTORE
      await orderRef.update({
        'paymentInfo.status': 'Completed',
        'paymentInfo.transactionId': paymentId,
        'internalStatus': 'created_pending', // Move to pending approval now that it's paid
        'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[RAZORPAY_WEBHOOK] Successfully updated order ${orderId} to paid status.`);
      
      // TODO: Potentially trigger auto-approval here if desired after payment.
      // const orderSnap = await orderRef.get();
      // if(orderSnap.exists) {
      //   runAutoApproval(orderSnap.data() as Order, orderId);
      // }

    } else {
      console.log(`[RAZORPAY_WEBHOOK] Ignoring event: ${event.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error processing webhook:", error.message);
    return NextResponse.json({ success: false, error: "Webhook processing failed." }, { status: 500 });
  }
}
