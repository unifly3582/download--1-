import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import type { Product } from '@/types/products';
import { formatProductForCustomer, addCorsHeaders } from '@/lib/products/productUtils';

/**
 * GET /api/products/customer/search?q=query&category=&limit=
 * Optimized product search for customer store
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || searchParams.get('query');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query || query.trim().length < 2) {
      const response = NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters'
      }, { status: 400 });
      return addCorsHeaders(response);
    }
    
    const lowercasedQuery = query.toLowerCase().trim();
    
    // Get products (with category filter if specified)
    let productsQuery = db.collection('products').where('isActive', '==', true);
    
    if (category) {
      productsQuery = productsQuery.where('category', '==', category);
    }
    
    const snapshot = await productsQuery.get();
    
    if (snapshot.empty) {
      const response = NextResponse.json({
        success: true,
        data: [],
        query: query,
        total: 0,
        message: 'No products found'
      });
      return addCorsHeaders(response);
    }
    
    // Search and score products
    const searchResults: Array<{ product: Product; score: number }> = [];
    
    snapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() } as Product;
      let score = 0;
      
      // Exact name match (highest score)
      if (product.name.toLowerCase() === lowercasedQuery) {
        score += 100;
      }
      // Name starts with query
      else if (product.name.toLowerCase().startsWith(lowercasedQuery)) {
        score += 80;
      }
      // Name contains query
      else if (product.name.toLowerCase().includes(lowercasedQuery)) {
        score += 60;
      }
      
      // Tag matches
      if (product.tags) {
        product.tags.forEach(tag => {
          if (tag.toLowerCase() === lowercasedQuery) {
            score += 70;
          } else if (tag.toLowerCase().includes(lowercasedQuery)) {
            score += 40;
          }
        });
      }
      
      // Description match
      if (product.description && product.description.toLowerCase().includes(lowercasedQuery)) {
        score += 30;
      }
      
      // Variation name/SKU matches
      if (product.variations) {
        product.variations.forEach(variation => {
          if (variation.name.toLowerCase().includes(lowercasedQuery)) {
            score += 50;
          }
          if (variation.sku.toLowerCase().includes(lowercasedQuery)) {
            score += 45;
          }
        });
      }
      
      // Category match (if not already filtered)
      if (!category && product.category.toLowerCase().includes(lowercasedQuery)) {
        score += 35;
      }
      
      // Boost featured products
      if (product.isFeatured) {
        score += 10;
      }
      
      // Only include products with some relevance
      if (score > 0) {
        searchResults.push({ product, score });
      }
    });
    
    // Sort by score (highest first) and limit results
    searchResults.sort((a, b) => b.score - a.score);
    const limitedResults = searchResults.slice(0, limit);
    
    // Format for customer consumption
    const formattedProducts = limitedResults.map(result => 
      formatProductForCustomer(result.product)
    );
    
    const response = NextResponse.json({
      success: true,
      data: formattedProducts,
      query: query,
      category: category || null,
      total: formattedProducts.length,
      totalFound: searchResults.length
    });
    
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[PRODUCT SEARCH] Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Search failed'
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