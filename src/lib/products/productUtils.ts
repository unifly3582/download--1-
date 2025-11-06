import { Product, ProductVariation } from '@/types/products';

/**
 * Utility functions for product data processing
 */

// Calculate price range from variations
export function calculatePriceRange(variations: ProductVariation[]) {
  if (!variations || variations.length === 0) {
    return { min: 0, max: 0 };
  }

  const salePrices = variations.map(v => v.salePrice || v.price);
  const regularPrices = variations.map(v => v.price);
  
  return {
    priceRange: {
      min: Math.min(...salePrices),
      max: Math.max(...salePrices)
    },
    originalPrice: {
      min: Math.min(...regularPrices),
      max: Math.max(...regularPrices)
    }
  };
}

// Get available options from variations
export function getAvailableOptions(variations: ProductVariation[]) {
  const availableVariations = variations.filter(v => v.stock > 0);
  
  const colors = new Set<string>();
  const sizes = new Set<string>();
  const otherAttributes: { [key: string]: Set<string> } = {};

  availableVariations.forEach(variation => {
    Object.entries(variation.attributes).forEach(([key, value]) => {
      if (key.toLowerCase() === 'color') {
        colors.add(value);
      } else if (key.toLowerCase() === 'size') {
        sizes.add(value);
      } else {
        if (!otherAttributes[key]) {
          otherAttributes[key] = new Set();
        }
        otherAttributes[key].add(value);
      }
    });
  });

  return {
    colors: Array.from(colors),
    sizes: Array.from(sizes),
    ...Object.fromEntries(
      Object.entries(otherAttributes).map(([key, values]) => [key, Array.from(values)])
    )
  };
}

// Format product for customer (remove admin-only fields)
export function formatProductForCustomer(product: Product) {
  const { createdAt, updatedAt, isActive, ...customerProduct } = product;
  
  // Only include in-stock variations
  const availableVariations = product.variations.filter(v => v.stock > 0);
  
  // Calculate pricing info
  const pricingInfo = calculatePriceRange(availableVariations);
  const availableOptions = getAvailableOptions(availableVariations);
  
  return {
    ...customerProduct,
    ...pricingInfo,
    availableOptions,
    inStock: availableVariations.length > 0,
    defaultVariation: availableVariations[0] || null,
    variations: availableVariations.map(v => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      stock: v.stock,
      attributes: v.attributes
      // Don't send: weight, dimensions, hsnCode
    }))
  };
}

// Format product for admin (include all fields)
export function formatProductForAdmin(product: Product) {
  return {
    ...product,
    createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : product.createdAt,
    updatedAt: product.updatedAt?.toDate ? product.updatedAt.toDate().toISOString() : product.updatedAt
  };
}

// Determine if request is from admin
export function isAdminRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const userAgent = request.headers.get('user-agent');
  
  // Check for admin authentication
  if (authHeader && (authHeader.includes('admin') || authHeader.includes('Bearer'))) {
    return true;
  }
  
  // Check user agent for admin dashboard
  if (userAgent && userAgent.includes('admin-dashboard')) {
    return true;
  }
  
  return false;
}

// Add CORS headers for customer requests
export function addCorsHeaders(response: Response): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.CUSTOMER_DOMAIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  };
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}