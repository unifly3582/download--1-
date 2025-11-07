import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { 
  isAdminRequest, 
  formatProductForAdmin, 
  formatProductForCustomer,
  addCorsHeaders 
} from '@/lib/products/productUtils';

/**
 * Smart routing single product API - serves both admin and customer requests
 * GET /api/products/[productId] - Get single product with smart routing
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
      const response = NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
      return isAdmin ? response : addCorsHeaders(response);
    }
    
    const productData = { id: docSnap.id, ...docSnap.data() } as Product;
    
    // For customers, only return active products
    if (!isAdmin && !productData.isActive) {
      const response = NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Format response based on requester
    const formattedProduct = isAdmin 
      ? formatProductForAdmin(productData)
      : formatProductForCustomer(productData);
    
    const response = NextResponse.json({
      success: true,
      data: formattedProduct
    });
    
    return isAdmin ? response : addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[SINGLE PRODUCT API] Error:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
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