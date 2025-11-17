import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSettings } from '@/lib/oms/checkoutSettings';

/**
 * GET /api/customer/checkout-settings
 * Public endpoint to fetch checkout settings for customer app
 * No authentication required - used for form pre-filling
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getCheckoutSettings();
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('[CUSTOMER_CHECKOUT_SETTINGS] Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch checkout settings',
      // Return default settings on error
      data: {
        codCharges: { type: 'fixed', value: 25 },
        prepaidDiscount: { type: 'fixed', value: 0 }
      }
    }, { status: 200 }); // Still return 200 with defaults
  }
}
