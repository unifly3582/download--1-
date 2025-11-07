import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { ProductFormValues } from '@/app/(dashboard)/products/product-form';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import admin from 'firebase-admin';

/**
 * POST /api/products/admin/create
 * Create new product (admin only)
 */
async function createProductHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const body: ProductFormValues = await request.json();

    if (!body.name || !body.category || !body.variations || body.variations.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required product fields.' 
      }, { status: 400 });
    }

    const newProductData = {
      ...body,
      tags: body.tags ? body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      media: body.media || [],
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      isCodAvailable: body.isCodAvailable ?? true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      variations: body.variations.map(v => {
        const newVariationId = db.collection('products').doc().id;
        return {
          id: newVariationId,
          name: v.name,
          sku: v.sku,
          hsnCode: v.hsnCode || '',
          price: v.regularPrice,
          salePrice: v.salePrice || null,
          stock: v.stock,
          attributes: {},
          weight: v.weight,
          dimensions: { 
            l: v.length || 0, 
            b: v.b || 0,
            h: v.height || 0 
          }
        };
      })
    };

    const newProductRef = db.collection('products').doc();
    await newProductRef.set(newProductData);
    
    console.log(`[ADMIN PRODUCTS] New product created: ${newProductRef.id} by user ${authContext.user.uid}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Product created successfully', 
      data: { id: newProductRef.id, ...newProductData } 
    }, { status: 201 });

  } catch (error: any) {
    console.error(`[ADMIN PRODUCTS] Error creating product:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create product' 
    }, { status: 500 });
  }
}

export const POST = withAuth(['admin'])(createProductHandler);