import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase/server';
import { getCouponStats } from '@/lib/oms/couponSystem';

/**
 * GET /api/admin/coupons/[couponId]
 * Get specific coupon details
 */
async function getCouponHandler(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> },
  authContext: AuthContext
) {
  try {
    const { couponId } = await params;
    
    const couponDoc = await db.collection('coupons').doc(couponId).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }
    
    const couponData = {
      id: couponDoc.id,
      ...couponDoc.data()
    };
    
    return NextResponse.json({
      success: true,
      data: couponData
    });
    
  } catch (error: any) {
    console.error('[ADMIN_COUPON_DETAIL] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupon details',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/coupons/[couponId]
 * Update coupon
 */
async function updateCouponHandler(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> },
  authContext: AuthContext
) {
  try {
    const { couponId } = await params;
    const body = await request.json();
    
    // Check if coupon exists
    const couponDoc = await db.collection('coupons').doc(couponId).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }
    
    // Update coupon
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // Remove fields that shouldn't be updated
    delete updateData.couponId;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.currentUsageCount;
    
    await db.collection('coupons').doc(couponId).update(updateData);
    
    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully'
    });
    
  } catch (error: any) {
    console.error('[ADMIN_COUPON_UPDATE] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update coupon',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/coupons/[couponId]
 * Delete coupon (soft delete by setting isActive to false)
 */
async function deleteCouponHandler(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> },
  authContext: AuthContext
) {
  try {
    const { couponId } = await params;
    
    // Check if coupon exists
    const couponDoc = await db.collection('coupons').doc(couponId).get();
    
    if (!couponDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }
    
    // Soft delete by setting isActive to false
    await db.collection('coupons').doc(couponId).update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Coupon deactivated successfully'
    });
    
  } catch (error: any) {
    console.error('[ADMIN_COUPON_DELETE] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to deactivate coupon',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCouponHandler);
export const PUT = withAuth(['admin'])(updateCouponHandler);
export const DELETE = withAuth(['admin'])(deleteCouponHandler);