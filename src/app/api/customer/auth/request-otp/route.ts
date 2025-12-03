import { NextRequest, NextResponse } from 'next/server';
import { requestOTP } from '@/lib/whatsapp/otpService';
import { z } from 'zod';

const RequestOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
});

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
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const { phone } = parseResult.data;
    
    // Request OTP
    const result = await requestOTP(phone);
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
    
  } catch (error: any) {
    console.error('[AUTH] Error requesting OTP:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send OTP'
    }, { status: 500 });
  }
}
