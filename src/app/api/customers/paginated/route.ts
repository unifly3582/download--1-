import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { Customer, CustomerSchema } from '@/types/customers';
import { searchCustomersInCache, getCacheStats } from '@/lib/cache/customerCache';
import { ensureCachePopulated } from '@/lib/cache/autoPopulate';
import { withAuth } from '@/lib/auth/withAuth';
import admin from 'firebase-admin';

async function getPaginatedCustomersHandler(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search');
  const segment = searchParams.get('segment');
  const tier = searchParams.get('tier');
  const region = searchParams.get('region');
  const limit = parseInt(searchParams.get('limit') || '25');
  const cursor = searchParams.get('cursor');

  const processAndValidate = (doc: admin.firestore.QueryDocumentSnapshot): Customer | null => {
    const data = doc.data();
    if (!data) return null;
    
    const validation = CustomerSchema.safeParse({ ...data, customerId: doc.id });
    if (validation.success) {
      return validation.data;
    } else {
      console.error(`[customers API] VALIDATION FAILED for doc ${doc.id}`);
      return null;
    }
  };

  try {
    let customers: Customer[] = [];
    let nextCursor: string | undefined;
    let hasMore = false;

    if (search) {
      // Ensure cache is populated before searching
      await ensureCachePopulated();
      
      // For search, use cache if available (no pagination for search results)
      const cachedResults = searchCustomersInCache(search);
      
      if (cachedResults && cachedResults.length > 0) {
        // Apply pagination to cached search results
        const startIndex = cursor ? parseInt(cursor) : 0;
        const endIndex = startIndex + limit;
        
        customers = cachedResults.slice(startIndex, endIndex);
        hasMore = endIndex < cachedResults.length;
        nextCursor = hasMore ? endIndex.toString() : undefined;
        
        console.log(`[CUSTOMERS] Cache search: ${customers.length} results (${startIndex}-${endIndex})`);
      } else {
        // Fallback to Firestore search (limited results)
        const customersRef = db.collection('customers');
        let query = customersRef.orderBy('createdAt', 'desc').limit(limit);
        
        if (cursor) {
          try {
            const cursorDoc = await customersRef.doc(cursor).get();
            if (cursorDoc.exists) {
              query = query.startAfter(cursorDoc);
            }
          } catch (error: any) {
            if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
              console.log('[customers API] Firebase auth error on cursor doc, skipping pagination');
            } else {
              throw error;
            }
          }
        }

        let snapshot: admin.firestore.QuerySnapshot;
        try {
          snapshot = await query.get();
        } catch (firestoreError: any) {
          if (firestoreError.code === 16 || firestoreError.message?.includes('UNAUTHENTICATED')) {
            console.log('[customers API] Firebase auth error on search, returning empty results');
            customers = [];
            hasMore = false;
            nextCursor = undefined;
            return NextResponse.json({
              success: true,
              data: { data: customers, hasMore, nextCursor, total: 0 }
            });
          }
          throw firestoreError;
        }
        let lastDoc: admin.firestore.QueryDocumentSnapshot | undefined;

        snapshot.forEach(doc => {
          const customerData = doc.data();
          const searchLower = search.toLowerCase();
          
          // Filter by search term
          const nameMatch = customerData.name?.toLowerCase().includes(searchLower);
          const emailMatch = customerData.email?.toLowerCase().includes(searchLower);
          const phoneMatch = customerData.phone?.includes(search);
          
          if (nameMatch || emailMatch || phoneMatch) {
            const validatedCustomer = processAndValidate(doc);
            if (validatedCustomer) {
              customers.push(validatedCustomer);
              lastDoc = doc;
            }
          }
        });

        hasMore = snapshot.size === limit && customers.length === limit;
        nextCursor = hasMore && lastDoc ? lastDoc.id : undefined;
      }
    } else {
      // Regular filtered query with pagination
      const customersRef = db.collection('customers');
      let query: admin.firestore.Query = customersRef;

      // Apply filters
      if (segment && segment !== 'all') {
        query = query.where('customerSegment', '==', segment);
      }
      if (tier && tier !== 'all') {
        query = query.where('loyaltyTier', '==', tier);
      }
      if (region && region !== 'all') {
        query = query.where('region', '==', region);
      }

      // Apply ordering and pagination
      query = query.orderBy('createdAt', 'desc').limit(limit);

      if (cursor) {
        try {
          const cursorDoc = await customersRef.doc(cursor).get();
          if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
          }
        } catch (error: any) {
          if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
            console.log('[customers API] Firebase auth error on cursor doc, skipping pagination');
          } else {
            throw error;
          }
        }
      }

      let snapshot: admin.firestore.QuerySnapshot;
      
      snapshot = await query.get();
      
      let lastDoc: admin.firestore.QueryDocumentSnapshot | undefined;

      snapshot.forEach(doc => {
        const validatedCustomer = processAndValidate(doc);
        if (validatedCustomer) {
          customers.push(validatedCustomer);
          lastDoc = doc;
        }
      });

      hasMore = snapshot.size === limit;
      nextCursor = hasMore && lastDoc ? lastDoc.id : undefined;
    }

    return NextResponse.json({
      success: true,
      data: {
        data: customers,
        hasMore,
        nextCursor,
        total: customers.length
      }
    });

  } catch (error: any) {
    console.error('[customers paginated API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['admin'])(getPaginatedCustomersHandler as any);