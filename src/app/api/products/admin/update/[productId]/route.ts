import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { ProductFormValues } from '@/app/(dashboard)/products/product-form';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import admin from 'firebase-admin';

/**
 * PUT /api/products/admin/update/[productId]
 * Update existing product (admin only)
 */
async function updateProductHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ productId: string }> }, 
  authContext: AuthContext
) {
  try {
    const { productId } = await params;
    const body: ProductFormValues = await request.json();

    const productRef = db.collection('products').doc(productId);
    const docSnap = await productRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Transform form data to match the database structure
    const productDataForDb = {
      ...body,
      tags: body.tags ? body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      media: body.media || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      variations: body.variations.map(v => {
        // Find existing variation by SKU to preserve its ID, or generate a new one
        const existingVariation = (docSnap.data()?.variations || []).find((dbVar: any) => dbVar.sku === v.sku);
        return {
          id: existingVariation?.id || db.collection('products').doc().id,
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

    await productRef.update(productDataForDb);
    console.log(`[ADMIN PRODUCTS] Product updated: ${productId} by user ${authContext.user.uid}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Product updated successfully' 
    });

  } catch (error: any) {
    console.error(`[ADMIN PRODUCTS] Error updating product:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update product' 
    }, { status: 500 });
  }
}

export const PUT = withAuth(['admin'])(updateProductHandler);