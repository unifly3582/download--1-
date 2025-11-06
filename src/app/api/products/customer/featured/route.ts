import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { formatProductForCustomer, addCorsHeaders } from '@/lib/products/productUtils';

/**
 * GET /api/products/customer/featured
 * Get featured products optimized for customer store
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '8');
    
    // Query featured and active products
    const productsRef = db.collection('products');
    const snapshot = await productsRef
      .where('isFeatured', '==', true)
      .where('isActive', '==', true)
      .limit(limit)
      .get();
    
    if (snapshot.empty) {
      const response = NextResponse.json({
        success: true,
        data: [],
        message: 'No featured products found'
      });
      return addCorsHeaders(response);
    }
    
    const products: Product[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    // Format for customer consumption
    const formattedProducts = products.map(product => formatProductForCustomer(product));
    
    const response = NextResponse.json({
      success: true,
      data: formattedProducts,
      total: formattedProducts.length
    });
    
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[FEATURED PRODUCTS] Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to fetch featured products'
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}