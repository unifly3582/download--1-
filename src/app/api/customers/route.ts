// src/app/api/customers/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server'; // Assuming this is your admin SDK init file
import { Customer, CustomerSchema } from '@/types/customers';
import { searchCustomersInCache, updateCustomerCache, getCacheStats } from '@/lib/cache/customerCache';
import { ensureCachePopulated } from '@/lib/cache/autoPopulate';
import admin from 'firebase-admin';
import type { firestore } from 'firebase-admin';
import { withAuth } from '@/lib/auth/withAuth'; // Import the security wrapper

// The handler's request parameter is typed as NextRequest
async function getCustomersHandler(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search');
  const segment = searchParams.get("segment");
  const tier = searchParams.get("tier");
  const region = searchParams.get("region");

  // This helper function ensures consistent data validation and transformation
  const processAndValidate = (doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): Customer | null => {
    const data = doc.data();
    if (!data) return null;
    
    // The schema expects a customerId, so we add it from the doc.id
    const validation = CustomerSchema.safeParse({ ...data, customerId: doc.id });
    if (validation.success) {
      return validation.data;
    } else {
      console.error(`[customers API] VALIDATION FAILED for doc ${doc.id}. Reason:`, validation.error.flatten().fieldErrors);
      return null;
    }
  };

  try {
    const customersRef = db.collection("customers");
    let customers: Customer[] = [];

    if (search) {
      // Ensure cache is populated (auto-populates if empty/expired)
      await ensureCachePopulated();
      
      // Try cache first (super fast, no Firestore reads)
      const cachedResults = searchCustomersInCache(search);
      
      if (cachedResults && cachedResults.length > 0) {
        console.log(`[CUSTOMERS] Cache hit: Found ${cachedResults.length} results for "${search}"`);
        customers = cachedResults;
      } else {
        console.log(`[CUSTOMERS] Cache miss: Searching Firestore for "${search}"`);
        
        // Efficient search: Try exact phone match first (most common use case)
        const cleanedSearch = search.replace(/\D/g, '');
        if (cleanedSearch.length === 10 || (cleanedSearch.length === 12 && cleanedSearch.startsWith('91'))) {
          // Phone number search - search by phone field, not document ID
          const formattedPhone = search.startsWith('+91') ? search : `+91${cleanedSearch.slice(-10)}`;
          
          try {
            const phoneQuery = customersRef.where('phone', '==', formattedPhone).limit(5);
            const phoneSnapshot = await phoneQuery.get();
            
            phoneSnapshot.forEach(doc => {
              const validatedCustomer = processAndValidate(doc);
              if (validatedCustomer) {
                customers.push(validatedCustomer);
              }
            });
            
            console.log(`[CUSTOMERS] Phone search for "${formattedPhone}": Found ${customers.length} results`);
          } catch (error: any) {
            console.error('[CUSTOMERS] Phone search failed:', error.message);
            // No fallback to document ID approach since customers are stored by customerId
          }
        } else {
          // Name/email/customerId search - try multiple approaches
          const searchLower = search.toLowerCase();
          
          // Try customerId exact match first (fastest)
          if (search.startsWith('CUS_')) {
            try {
              const customerDoc = await customersRef.doc(search).get();
              if (customerDoc.exists) {
                const validatedCustomer = processAndValidate(customerDoc);
                if (validatedCustomer) {
                  customers.push(validatedCustomer);
                }
              }
            } catch (error: any) {
              console.warn('[CUSTOMERS] CustomerId search failed:', error.message);
            }
          }
          
          // If no results yet, try name search with case-insensitive approach
          if (customers.length === 0) {
            try {
              // First try: search for names that start with the search term (case-insensitive)
              const searchWords = searchLower.split(' ').filter(word => word.length > 0);
              
              if (searchWords.length > 0) {
                // Try range query with first word (most likely to work)
                const firstWord = searchWords[0];
                const firstWordUpper = firstWord + '\uf8ff';
                
                const nameQuery = customersRef
                  .where('name', '>=', firstWord)
                  .where('name', '<=', firstWordUpper)
                  .limit(20);
                
                const nameSnapshot = await nameQuery.get();
                nameSnapshot.forEach(doc => {
                  const customerData = doc.data();
                  // Check if the full search term matches (case-insensitive)
                  if (customerData.name && customerData.name.toLowerCase().includes(searchLower)) {
                    const validatedCustomer = processAndValidate(doc);
                    if (validatedCustomer) {
                      customers.push(validatedCustomer);
                    }
                  }
                });
                
                console.log(`[CUSTOMERS] Name prefix search for "${search}": Found ${customers.length} results`);
              }
            } catch (error: any) {
              console.warn('[CUSTOMERS] Name prefix search failed:', error.message);
            }
            
            // If still no results, use comprehensive fallback scan
            if (customers.length === 0) {
              try {
                console.log(`[CUSTOMERS] Using fallback scan for "${search}"`);
                const limitedSnapshot = await customersRef.orderBy('createdAt', 'desc').limit(200).get();
                
                limitedSnapshot.forEach((doc) => {
                  const customerData = doc.data();
                  const nameMatch = customerData.name && customerData.name.toLowerCase().includes(searchLower);
                  const emailMatch = customerData.email && customerData.email.toLowerCase().includes(searchLower);
                  const customerIdMatch = customerData.customerId && customerData.customerId.toLowerCase().includes(searchLower);
                  
                  if ((nameMatch || emailMatch || customerIdMatch) && customers.length < 20) {
                    const validatedCustomer = processAndValidate(doc);
                    if (validatedCustomer) {
                      customers.push(validatedCustomer);
                    }
                  }
                });
                
                console.log(`[CUSTOMERS] Fallback search for "${search}": Found ${customers.length} results`);
              } catch (fallbackError: any) {
                console.error('[CUSTOMERS] Fallback search also failed:', fallbackError.message);
              }
            }
          }
        }
      }

    } else {
      let query: admin.firestore.Query = customersRef;
      if (segment && segment !== 'all') query = query.where("customerSegment", "==", segment);
      if (tier && tier !== 'all') query = query.where("loyaltyTier", "==", tier);
      if (region && region !== 'all') query = query.where("region", "==", region);

      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      snapshot.forEach(doc => {
          const validatedCustomer = processAndValidate(doc);
          if (validatedCustomer) {
              customers.push(validatedCustomer);
          }
      });
    }

    return NextResponse.json({ success: true, data: customers });

  } catch (error: any) {
    console.error("[customers API] Error fetching customers:", error);
    if (error.code === 'FAILED_PRECONDITION') {
      return NextResponse.json({ success: false, error: 'A database index may be required for this query.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "Failed to fetch customers due to a server error." }, { status: 500 });
  }
}

// Re-apply the security wrapper
export const GET = withAuth(['admin'])(getCustomersHandler as any);