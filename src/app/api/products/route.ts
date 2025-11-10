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
 * Smart routing products API - serves both admin and customer requests
 * GET /api/products - List products with smart routing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const isAdmin = isAdminRequest(request);
    
    // Build query
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('products');
    
    // Filter by category
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Filter by featured (customer requests)
    if (featured === 'true' && !isAdmin) {
      query = query.where('isFeatured', '==', true);
    }
    
    // Filter active products for customers
    if (!isAdmin) {
      query = query.where('isActive', '==', true);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      const response = NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, hasMore: false } });
      return isAdmin ? response : addCorsHeaders(response);
    }
    
    let products: Product[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    // Handle search
    if (search) {
      const lowercasedSearch = search.toLowerCase();
      
      if (isAdmin) {
        // Admin search - return variations
        const searchableVariations: any[] = [];
        products.forEach(product => {
          if (product.variations && product.variations.length > 0) {
            product.variations.forEach(variation => {
              const fullVariationName = `${product.name} - ${variation.name}`;
              if (
                product.name.toLowerCase().includes(lowercasedSearch) ||
                fullVariationName.toLowerCase().includes(lowercasedSearch) ||
                variation.sku.toLowerCase().includes(lowercasedSearch) ||
                product.tags?.some(tag => tag.toLowerCase().includes(lowercasedSearch))
              ) {
                searchableVariations.push({
                  productId: product.id,
                  parentName: product.name,
                  variationId: variation.id,
                  variationName: fullVariationName,
                  sku: variation.sku,
                  price: variation.salePrice ?? variation.price,
                  stock: variation.stock,
                });
              }
            });
          }
        });
        return NextResponse.json({ success: true, data: searchableVariations.slice(0, 25) });
      } else {
        // Customer search - return products
        products = products.filter(product =>
          product.name.toLowerCase().includes(lowercasedSearch) ||
          product.tags?.some(tag => tag.toLowerCase().includes(lowercasedSearch))
        );
      }
    }
    
    // Pagination
    const total = products.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    // Format response based on requester
    const formattedProducts = paginatedProducts.map(product => 
      isAdmin ? formatProductForAdmin(product) : formatProductForCustomer(product)
    );
    
    const response = NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        hasMore: endIndex < total
      }
    });
    
    return isAdmin ? response : addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[PRODUCTS API] Error:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
    return isAdminRequest(request) ? response : addCorsHeaders(response);
  }
}

/**
 * POST /api/products - Redirect to correct create endpoint
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Use /api/products/admin/create for creating products',
    redirect: '/api/products/admin/create'
  }, { status: 405 });
}

/**
 * PUT /api/products - Redirect to correct update endpoint
 */
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Use /api/products/admin/update/[productId] for updating products',
    redirect: '/api/products/admin/update/[productId]'
  }, { status: 405 });
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}