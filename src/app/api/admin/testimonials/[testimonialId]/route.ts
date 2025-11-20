import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { UpdateTestimonialSchema } from '@/types/testimonial';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/testimonials/[testimonialId]
 * Fetch a single testimonial (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const { testimonialId } = await params;
    
    const docRef = db.collection('testimonials').doc(testimonialId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Testimonial not found',
      }, { status: 404 });
    }
    
    const data = doc.data()!;
    
    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      },
    });
    
  } catch (error: any) {
    console.error('[ADMIN_TESTIMONIAL_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch testimonial',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/testimonials/[testimonialId]
 * Update a testimonial (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const { testimonialId } = await params;
    const body = await request.json();
    
    const parseResult = UpdateTestimonialSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid testimonial data',
        details: parseResult.error.flatten(),
      }, { status: 400 });
    }
    
    const updateData = parseResult.data;
    const docRef = db.collection('testimonials').doc(testimonialId);
    
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Testimonial not found',
      }, { status: 404 });
    }
    
    await docRef.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data()!;
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      },
      message: 'Testimonial updated successfully',
    });
    
  } catch (error: any) {
    console.error('[ADMIN_TESTIMONIAL_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update testimonial',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/testimonials/[testimonialId]
 * Delete a testimonial (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const { testimonialId } = await params;
    
    const docRef = db.collection('testimonials').doc(testimonialId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Testimonial not found',
      }, { status: 404 });
    }
    
    await docRef.delete();
    
    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
    
  } catch (error: any) {
    console.error('[ADMIN_TESTIMONIAL_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete testimonial',
      details: error.message,
    }, { status: 500 });
  }
}
