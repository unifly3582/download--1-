import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { isAdminRequest, addCorsHeaders } from '@/lib/products/productUtils';

/**
 * GET /api/products/shared/variations/[productId]
 * Get product variations (shared utility for both admin and customer)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const isAdmin = isAdminRequest(request);
    
    const productRef = db.collection('products').doc(productId);
    const docSnap = await productRef.get();
    
    if (!docSnap.exists) {
      const response = NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
      return isAdmin ? response : addCorsHeaders(response);
    }
    
    const product = { id: docSnap.id, ...docSnap.data() } as Product;
    
    // For customers, only return active products
    if (!isAdmin && !product.isActive) {
      const response = NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
      return addCorsHeaders(response);
    }
    
    let variations = product.variations || [];
    
    // Filter variations based on requester
    if (!isAdmin) {
      // For customers, only show in-stock variations
      variations = variations.filter(v => v.stock > 0);
    }
    
    // Format variations based on requester
    const formattedVariations = variations.map(variation => {
      if (isAdmin) {
        // Admin gets all variation data
        return variation;
      } else {
        // Customer gets essential data only
        return {
          id: variation.id,
          name: variation.name,
          sku: variation.sku,
          price: variation.price,
          salePrice: variation.salePrice,
          stock: variation.stock,
          attributes: variation.attributes
          // Don't send: weight, dimensions, hsnCode
        };
      }
    });
    
    const response = NextResponse.json({
      success: true,
      data: {
        productId: product.id,
        productName: product.name,
        variations: formattedVariations,
        totalVariations: formattedVariations.length
      }
    });
    
    return isAdmin ? response : addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[PRODUCT VARIATIONS] Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to fetch variations'
    }, { status: 500 });
    return isAdminRequest(request) ? response : addCorsHeaders(response);
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}