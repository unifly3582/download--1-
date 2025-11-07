import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

/**
 * DELETE /api/products/admin/delete/[productId]
 * Delete product (admin only)
 */
async function deleteProductHandler(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
  authContext: AuthContext
) {
  try {
    const { productId } = await params;
    const productRef = db.collection('products').doc(productId);

    const docSnap = await productRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    await productRef.delete();
    console.log(`[ADMIN PRODUCTS] Product deleted: ${productId} by user ${authContext.user.uid}`);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error(`[ADMIN PRODUCTS] Error deleting product:`, error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete product'
    }, { status: 500 });
  }
}

export const DELETE = withAuth(['admin'])(deleteProductHandler);