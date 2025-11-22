import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snapshot = await db.collection('advances')
      .where('employeeId', '==', id)
      .orderBy('dateGiven', 'desc')
      .limit(50)
      .get();

    const advances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ advances });
  } catch (error) {
    console.error('Error fetching advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    await db.collection('advances').add({
      employeeId: id,
      ...data,
      amountRepaid: 0,
      amountRemaining: data.amount,
      repaymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording advance:', error);
    return NextResponse.json(
      { error: 'Failed to record advance' },
      { status: 500 }
    );
  }
}
