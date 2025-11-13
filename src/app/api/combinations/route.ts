import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

async function getCombinationsHandler(request: Request, authContext: AuthContext) {
  try {
    const snapshot = await db.collection('verifiedCombinations')
      .orderBy('verifiedAt', 'desc')
      .get();

    const combinations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        combinationHash: doc.id,
        ...data,
        verifiedAt: data.verifiedAt?.toDate?.()?.toISOString() || data.verifiedAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() || data.lastUsedAt,
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: combinations 
    });

  } catch (error: any) {
    console.error('[API /combinations] Error fetching combinations:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch combinations' 
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCombinationsHandler);
