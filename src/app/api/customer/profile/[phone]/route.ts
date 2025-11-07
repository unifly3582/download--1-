import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByPhone } from '@/lib/oms/customerUtils';
import { addCorsHeaders } from '@/lib/products/productUtils';

/**
 * GET /api/customer/profile/[phone]
 * Get public customer profile by phone (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone: phoneParam } = await params;
    const phone = decodeURIComponent(phoneParam);
    
    const customer = await getCustomerByPhone(phone);
    
    if (!customer) {
      const response = NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 });
      return addCorsHeaders(response);
    }
    
    // Return minimal public profile data
    const publicProfile = {
      customerId: customer.customerId,
      name: customer.name,
      phone: customer.phone,
      loyaltyTier: customer.loyaltyTier,
      totalOrders: customer.totalOrders,
      memberSince: customer.createdAt,
      // Don't expose: email, addresses, sensitive data
    };
    
    const response = NextResponse.json({
      success: true,
      data: publicProfile
    });
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[PUBLIC PROFILE] Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}