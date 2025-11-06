import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { migrateCustomerOrders } from '@/scripts/migrate-customer-orders';

/**
 * POST /api/admin/migrate-customer-orders
 * One-time migration to sync existing orders to customerOrders collection
 */
async function migrateCustomerOrdersHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    console.log(`[MIGRATION] Customer orders migration started by user ${authContext.user.uid}`);
    
    await migrateCustomerOrders();
    
    return NextResponse.json({
      success: true,
      message: 'Customer orders migration completed successfully'
    });
    
  } catch (error: any) {
    console.error('[MIGRATION] Customer orders migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
}

// Only admins can trigger migration
export const POST = withAuth(['admin'])(migrateCustomerOrdersHandler);