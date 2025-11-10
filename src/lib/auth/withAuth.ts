// src/lib/auth/withAuth.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // This import is essential
import { auth } from '@/lib/firebase/server';
import { DecodedIdToken } from 'firebase-admin/auth';

// Define the allowed roles our system understands
type Role = 'admin' | 'machine';

// Define a type for the authentication context we'll pass to handlers
export interface AuthContext {
  user: DecodedIdToken | { uid: string, role: 'machine' };
}

/**
 * A Higher-Order Function to protect API routes. It is compatible with the Next.js App Router.
 * @param allowedRoles An array of roles that are allowed to access the endpoint.
 * @returns A wrapped API handler that includes authentication and authorization checks.
 */
export function withAuth(allowedRoles: Role[]) {
  // This signature MUST accept a handler that uses NextRequest
  return (handler: (request: NextRequest, context: any, authContext: AuthContext) => Promise<NextResponse>) => {
    
    // This signature MUST use NextRequest
    return async (request: NextRequest, context: any): Promise<NextResponse> => {
      
      // Check 1: Firebase Admin User (via Bearer Token)
      const authorization = request.headers.get('Authorization');
      if (authorization && authorization.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
          const decodedToken = await auth.verifyIdToken(idToken);
          
          console.log('🔍 Auth Debug - User email:', decodedToken.email);
          console.log('🔍 Auth Debug - Admin claim:', decodedToken.admin);
          
          // Temporary admin access for specific users while they refresh their tokens
          const isTemporaryAdmin = decodedToken.email === 'vaibhav@gmail.com' || decodedToken.email === 'uniflyinsect@gmail.com';
          console.log('🔍 Auth Debug - Is temporary admin:', isTemporaryAdmin);
          
          if ((decodedToken.admin === true || isTemporaryAdmin) && allowedRoles.includes('admin')) {
            console.log('✅ Auth Debug - Access granted');
            return handler(request, context, { user: decodedToken });
          } else {
            console.log('❌ Auth Debug - Access denied - admin:', decodedToken.admin, 'tempAdmin:', isTemporaryAdmin);
          }
        } catch (error: any) {
          console.log('❌ Auth Debug - Token verification failed:', error.message);
          // Token is invalid or expired.
        }
      } else {
        console.log('❌ Auth Debug - No authorization header or invalid format');
      }

      // Check 2: Machine User (via API Key)
      const apiKey = request.headers.get('X-API-Key');
      if (apiKey) {
        if (apiKey === process.env.AI_AGENT_API_KEY && allowedRoles.includes('machine')) {
          const machineUser = { uid: 'ai-agent-service', role: 'machine' as const };
          return handler(request, context, { user: machineUser });
        }
      }

      // If all authentication checks fail, deny access.
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    };
  };
}