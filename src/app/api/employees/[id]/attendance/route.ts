import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const date = searchParams.get('date');

    let query = db.collection('attendance')
      .where('employeeId', '==', params.id)
      .orderBy('date', 'desc');

    if (date) {
      // Fetch specific date
      query = query.where('date', '==', date);
    } else if (month && year) {
      // Fetch month range
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }

    const snapshot = await query.limit(100).get();

    const attendance = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
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

    // Check if attendance already exists for this date
    const existingSnapshot = await db.collection('attendance')
      .where('employeeId', '==', params.id)
      .where('date', '==', data.date)
      .get();

    if (!existingSnapshot.empty) {
      // Update existing record
      const docId = existingSnapshot.docs[0].id;
      await db.collection('attendance').doc(docId).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new record
      await db.collection('attendance').add({
        employeeId: params.id,
        ...data,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
