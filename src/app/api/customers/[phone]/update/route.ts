import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { CustomerSchema } from '@/types/customers';
import { withAuth } from '@/lib/auth/withAuth';
import { updateSingleCustomerInCache } from '@/lib/cache/customerCache';

async function updateCustomerHandler(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone: phoneParam } = await params;
    const phone = decodeURIComponent(phoneParam);
    const body = await request.json();
    
    // Find the existing customer
    const customersRef = db.collection('customers');
    const customerQuery = customersRef.where('phone', '==', phone).limit(1);
    const customerSnapshot = await customerQuery.get();

    if (customerSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerDoc = customerSnapshot.docs[0];
    const existingData = customerDoc.data();

    // Validate the updated customer data
    const validation = CustomerSchema.safeParse({
      ...existingData,
      ...body,
      customerId: customerDoc.id,
      updatedAt: new Date().toISOString(),
      // Preserve system-calculated fields
      totalOrders: existingData.totalOrders || 0,
      totalSpent: existingData.totalSpent || 0,
      trustScore: existingData.trustScore || 50,
      avgOrderValue: existingData.avgOrderValue || 0,
      refundsCount: existingData.refundsCount || 0,
      returnRate: existingData.returnRate || 0,
      lifetimeValue: existingData.lifetimeValue || 0,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt
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

    // Convert ISO strings back to Firestore Timestamps for storage
    const firestoreData = {
      ...customerData,
      createdAt: existingData.createdAt, // Keep original creation date
      updatedAt: customerData.updatedAt ? new Date(customerData.updatedAt) : new Date()
    };

    // Update the customer document
    await customerDoc.ref.update(firestoreData);

    // Update cache
    try {
      updateSingleCustomerInCache(customerData);
    } catch (cacheError) {
      console.warn('[UPDATE CUSTOMER] Cache update failed:', cacheError);
      // Don't fail the request if cache update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: customerData
    });

  } catch (error: any) {
    console.error('[UPDATE CUSTOMER] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(['admin'])(updateCustomerHandler as any);