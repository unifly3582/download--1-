import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/whatsapp/otpService';
import { z } from 'zod';

const VerifyOTPSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be 6 digits')
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
 * OPTIONS /api/customer/auth/verify-otp
 * Handle preflight CORS requests
 */
export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

/**
 * POST /api/customer/auth/verify-otp
 * Verify OTP and get Firebase custom token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const parseResult = VerifyOTPSchema.safeParse(body);
    if (!parseResult.success) {
      const response = NextResponse.json({
        success: false,
        error: 'Invalid request',
        details: parseResult.error.flatten()
      }, { status: 400 });
      return addCorsHeaders(response);
    }
    
    const { phone, otp } = parseResult.data;
    
    // Verify OTP
    const result = await verifyOTP(phone, otp);
    
    const response = NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[AUTH] Error verifying OTP:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Verification failed'
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}
