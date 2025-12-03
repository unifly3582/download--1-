import { NextRequest, NextResponse } from 'next/server';
import { resendOTP } from '@/lib/whatsapp/otpService';
import { z } from 'zod';

const ResendOTPSchema = z.object({
  phone: z.string().min(10)
});

/**
 * POST /api/customer/auth/resend-otp
 * Resend OTP for customer login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const parseResult = ResendOTPSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const { phone } = parseResult.data;
    
    // Resend OTP
    const result = await resendOTP(phone);
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
    
  } catch (error: any) {
    console.error('[AUTH] Error resending OTP:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to resend OTP'
    }, { status: 500 });
  }
}
