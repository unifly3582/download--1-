import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { CreateCouponSchema } from '@/types/coupon';
import { createCoupon } from '@/lib/oms/couponSystem';
import { db } from '@/lib/firebase/server';

/**
 * GET /api/admin/coupons
 * List all coupons with optional filtering
 */
async function getCouponsHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { searchParams } = request.nextUrl;
    const isActive = searchParams.get('isActive');
    const usageType = searchParams.get('usageType');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get all coupons first, then filter in memory to avoid index requirements
    const snapshot = await db.collection('coupons')
      .orderBy('createdAt', 'desc')
      .limit(limit * 2) // Get more to account for filtering
      .get();
    
    let coupons = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply filters in memory
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      coupons = coupons.filter(coupon => coupon.isActive === activeFilter);
    }
    
    if (usageType) {
      coupons = coupons.filter(coupon => coupon.usageType === usageType);
    }
    
    // Limit results after filtering
    coupons = coupons.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: coupons,
      count: coupons.length
    });
    
  } catch (error: any) {
    console.error('[ADMIN_COUPONS] Error fetching coupons:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupons',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon
 */
async function createCouponHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const body = await request.json();
    
    // Validate coupon data
    const parseResult = CreateCouponSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const couponData = parseResult.data;
    
    // Validate dates
    const validFrom = new Date(couponData.validFrom);
    const validUntil = new Date(couponData.validUntil);
    
    if (validFrom >= validUntil) {
      return NextResponse.json({
        success: false,
        error: 'Valid from date must be before valid until date'
      }, { status: 400 });
    }
    
    // Create coupon
    const couponId = await createCoupon(couponData, authContext.user.uid);
    
    return NextResponse.json({
      success: true,
      couponId,
      message: 'Coupon created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[ADMIN_COUPONS] Error creating coupon:', error);
    
    if (error.message === 'Coupon code already exists') {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create coupon',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCouponsHandler);
export const POST = withAuth(['admin'])(createCouponHandler);