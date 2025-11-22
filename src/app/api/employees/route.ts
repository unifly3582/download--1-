import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const employeesRef = db.collection('employees');
    const snapshot = await employeesRef.orderBy('createdAt', 'desc').get();

    const employees = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate employee ID
    const employeeId = `EMP${Date.now().toString().slice(-6)}`;

    const employeeData = {
      employeeId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('employees').add(employeeData);

    return NextResponse.json({
      success: true,
      employee: { id: docRef.id, ...employeeData },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
