import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon, calculateDiscount } from '@/lib/oms/couponSystem';

// Validation request schema
const CouponValidationRequestSchema = z.object({
  couponCode: z.string().min(1),
  customerId: z.string().optional(),
  customerPhone: z.string().optional(),
  orderValue: z.number().min(0),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    sku: z.string()
  })).optional()
});

/**
 * POST /api/customer/coupons/validate
 * Validate coupon code for customer (no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const parseResult = CouponValidationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid validation request',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const { couponCode, customerId, customerPhone, orderValue, items } = parseResult.data;
    
    // Validate coupon
    const validation = await validateCoupon(
      couponCode,
      customerId,
      customerPhone,
      orderValue,
      items as any
    );
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (validation.couponDetails) {
      discountAmount = calculateDiscount(validation.couponDetails, orderValue, items as any);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        discountAmount,
        couponType: validation.couponDetails?.type,
        description: validation.couponDetails?.description,
        finalAmount: orderValue - discountAmount
      }
    });
    
  } catch (error: any) {
    console.error('[COUPON_VALIDATION] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to validate coupon',
      details: error.message
    }, { status: 500 });
  }
}