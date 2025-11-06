import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { addCorsHeaders } from '@/lib/products/productUtils';

/**
 * GET /api/products/customer/categories
 * Get product categories with counts for customer store
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active products
    const productsRef = db.collection('products');
    const snapshot = await productsRef
      .where('isActive', '==', true)
      .get();
    
    if (snapshot.empty) {
      const response = NextResponse.json({
        success: true,
        data: [],
        message: 'No categories found'
      });
      return addCorsHeaders(response);
    }
    
    // Count products by category
    const categoryCount: { [key: string]: number } = {};
    const categoryProducts: { [key: string]: Product[] } = {};
    
    snapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() } as Product;
      const category = product.category;
      
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        
        if (!categoryProducts[category]) {
          categoryProducts[category] = [];
        }
        categoryProducts[category].push(product);
      }
    });
    
    // Format categories with metadata
    const categories = Object.entries(categoryCount).map(([name, count]) => {
      const products = categoryProducts[name];
      const featuredProducts = products.filter(p => p.isFeatured);
      
      // Get price range for category
      let minPrice = Infinity;
      let maxPrice = 0;
      
      products.forEach(product => {
        product.variations.forEach(variation => {
          const price = variation.salePrice || variation.price;
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        });
      });
      
      return {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        count,
        featuredCount: featuredProducts.length,
        priceRange: {
          min: minPrice === Infinity ? 0 : minPrice,
          max: maxPrice
        },
        // Sample product for category image
        sampleProduct: products[0] ? {
          id: products[0].id,
          name: products[0].name,
          image: products[0].media?.[0]?.url || null
        } : null
      };
    });
    
    // Sort by product count (most popular first)
    categories.sort((a, b) => b.count - a.count);
    
    const response = NextResponse.json({
      success: true,
      data: categories,
      total: categories.length
    });
    
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[PRODUCT CATEGORIES] Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
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