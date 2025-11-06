import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { CustomerSchema } from '@/types/customers';
import { withAuth } from '@/lib/auth/withAuth';
import { updateSingleCustomerInCache } from '@/lib/cache/customerCache';

async function createCustomerHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the customer data
    const validation = CustomerSchema.safeParse({
      ...body,
      customerId: `CUS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      trustScore: 50,
      avgOrderValue: 0,
      refundsCount: 0,
      returnRate: 0,
      lifetimeValue: 0
    });

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid customer data',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const customerData = validation.data;

    // Check if customer with this phone already exists
    const existingCustomerQuery = db.collection('customers')
      .where('phone', '==', customerData.phone)
      .limit(1);
    
    const existingSnapshot = await existingCustomerQuery.get();
    
    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Customer with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create the customer document
    const customerRef = db.collection('customers').doc(customerData.customerId);
    
    // Convert ISO strings back to Firestore Timestamps for storage
    const firestoreData = {
      ...customerData,
      createdAt: customerData.createdAt ? new Date(customerData.createdAt) : new Date(),
      updatedAt: customerData.updatedAt ? new Date(customerData.updatedAt) : new Date()
    };

    await customerRef.set(firestoreData);

    // Update cache
    try {
      updateSingleCustomerInCache(customerData);
    } catch (cacheError) {
      console.warn('[CREATE CUSTOMER] Cache update failed:', cacheError);
      // Don't fail the request if cache update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      data: customerData
    });

  } catch (error: any) {
    console.error('[CREATE CUSTOMER] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(['admin'])(createCustomerHandler as any);