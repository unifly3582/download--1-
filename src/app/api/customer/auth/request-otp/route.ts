import { NextRequest, NextResponse } from 'next/server';
import { requestOTP } from '@/lib/whatsapp/otpService';
import { z } from 'zod';

const RequestOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
});

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

/**
 * OPTIONS /api/customer/auth/request-otp
 * Handle preflight CORS requests
 */
export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

/**
 * POST /api/customer/auth/request-otp
 * Request OTP for customer login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const parseResult = RequestOTPSchema.safeParse(body);
    if (!parseResult.success) {
      const response = NextResponse.json({
        success: false,
        error: 'Invalid phone number',
        details: parseResult.error.flatten()
      }, { status: 400 });
      return addCorsHeaders(response);
    }
    
    const { phone } = parseResult.data;
    
    // Request OTP
    const result = await requestOTP(phone);
    
    const response = NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[AUTH] Error requesting OTP:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to send OTP'
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}
