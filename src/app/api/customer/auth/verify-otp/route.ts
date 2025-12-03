import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/whatsapp/otpService';
import { z } from 'zod';

const VerifyOTPSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

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
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const { phone, otp } = parseResult.data;
    
    // Verify OTP
    const result = await verifyOTP(phone, otp);
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
    
  } catch (error: any) {
    console.error('[AUTH] Error verifying OTP:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification failed'
    }, { status: 500 });
  }
}
