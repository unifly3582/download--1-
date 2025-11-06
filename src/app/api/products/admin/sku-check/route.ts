import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

/**
 * GET /api/products/admin/sku-check?sku=XXX&productId=XXX
 * Check if a product SKU is unique across the catalog (admin only)
 */
async function checkSkuUniquenessHandler(request: NextRequest, context: any, authContext: AuthContext) {
  const { searchParams } = request.nextUrl;
  const sku = searchParams.get('sku');
  const currentProductId = searchParams.get('productId'); // ID of the product being edited

  if (!sku) {
    return NextResponse.json({ 
      success: false, 
      error: 'SKU parameter is required' 
    }, { status: 400 });
  }

  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        data: { isUnique: true } 
      });
    }

    // Check all products for SKU conflicts
    let foundInProductId = null;
    let foundInProduct = null;

    snapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() } as Product;
      if (product.variations && product.variations.length > 0) {
        const hasConflictingSku = product.variations.some(variation => 
          variation.sku.toLowerCase() === sku.toLowerCase()
        );
        
        if (hasConflictingSku) {
          foundInProductId = product.id;
          foundInProduct = product.name;
        }
      }
    });

    if (!foundInProductId) {
      // No product found with this SKU, so it's unique
      return NextResponse.json({ 
        success: true, 
        data: { isUnique: true } 
      });
    }

    if (currentProductId && foundInProductId === currentProductId) {
      // The SKU was found, but only in the product being edited, which is allowed
      return NextResponse.json({ 
        success: true, 
        data: { isUnique: true } 
      });
    }

    // The SKU was found in a different product, so it's a duplicate
    return NextResponse.json({ 
      success: true, 
      data: { 
        isUnique: false, 
        foundInProductId,
        foundInProduct 
      } 
    });

  } catch (error: any) {
    console.error(`[ADMIN PRODUCTS] Error checking SKU '${sku}':`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check SKU uniqueness' 
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(checkSkuUniquenessHandler);