// Debug endpoint to test authentication
import { NextResponse, NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

async function debugAuthHandler(request: NextRequest, context: any, authContext: AuthContext) {
  return NextResponse.json({ 
    success: true, 
    message: 'Authentication successful!',
    user: {
      uid: authContext.user.uid,
      email: (authContext.user as any).email || 'N/A',
      admin: (authContext.user as any).admin || false
    }
  });
}

export const GET = withAuth(['admin'])(debugAuthHandler);