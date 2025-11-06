// src/app/api/products/sku-check/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

/**
 * GET handler to check if a product SKU is unique across the catalog.
 * Secured for admin access only.
 */
async function checkSkuUniquenessHandler(request: NextRequest, context: any, authContext: AuthContext) {
  const { searchParams } = request.nextUrl;
  const sku = searchParams.get('sku');
  const currentProductId = searchParams.get('productId'); // ID of the product being edited

  if (!sku) {
    return NextResponse.json({ success: false, error: 'SKU parameter is required.' }, { status: 400 });
  }

  try {
    const productsRef = db.collection('products');
    // More efficient query: Find any product that has the given SKU in its variations array.
    // This requires a specific Firestore index.
    const querySnapshot = await productsRef.where('variations.sku', '==', sku).get();

    if (querySnapshot.empty) {
      // No product found with this SKU, so it's unique.
      return NextResponse.json({ success: true, data: { isUnique: true } });
    }

    // A product with this SKU exists. Now, check if it's the same product we're currently editing.
    const foundDoc = querySnapshot.docs[0];
    const foundInProductId = foundDoc.id;

    if (currentProductId && foundInProductId === currentProductId) {
      // The SKU was found, but only in the product being edited, which is allowed.
      return NextResponse.json({ success: true, data: { isUnique: true } });
    }

    // The SKU was found in a *different* product, so it's a duplicate.
    return NextResponse.json({ success: true, data: { isUnique: false, foundInProductId } });

  } catch (error: any) {
    console.error(`[API /products/sku-check] Error checking SKU '${sku}' for user ${authContext.user.uid}:`, error.message);
    
    if (error.code === 'FAILED_PRECONDITION') {
        return NextResponse.json({ success: false, error: 'A database index is required for this query. Please check server logs for a link to create it.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: false, error: 'Failed to check SKU uniqueness.' }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(checkSkuUniquenessHandler);