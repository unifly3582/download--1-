import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snapshot = await db.collection('salaryPayments')
      .where('employeeId', '==', params.id)
      .orderBy('year', 'desc')
      .orderBy('month', 'desc')
      .limit(50)
      .get();

    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching salary payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary payments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    await db.collection('salaryPayments').add({
      employeeId: params.id,
      ...data,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording salary payment:', error);
    return NextResponse.json(
      { error: 'Failed to record salary payment' },
      { status: 500 }
    );
  }
}
