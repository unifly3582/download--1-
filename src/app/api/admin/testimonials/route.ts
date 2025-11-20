import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { CreateTestimonialSchema } from '@/types/testimonial';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/testimonials
 * Fetch all testimonials (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isActive = searchParams.get('isActive');
    
    let query: any = db.collection('testimonials');
    
    // Filter by active status if provided
    if (isActive !== null) {
      query = query.where('isActive', '==', isActive === 'true');
    }
    
    // Try with composite index first, fallback to simple query if index not ready
    let snapshot;
    try {
      snapshot = await query
        .orderBy('displayOrder', 'asc')
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError: any) {
      // If index not ready, fetch without ordering and sort in memory
      console.warn('Composite index not ready, using fallback query');
      snapshot = await query.get();
    }
    
    let testimonials = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    
    // Sort in memory if we used the fallback query
    testimonials.sort((a: any, b: any) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json({
      success: true,
      data: testimonials,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
    
  } catch (error: any) {
    console.error('[ADMIN_TESTIMONIALS_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch testimonials',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/testimonials
 * Create a new testimonial (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parseResult = CreateTestimonialSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid testimonial data',
        details: parseResult.error.flatten(),
      }, { status: 400 });
    }
    
    const testimonialData = parseResult.data;
    const now = new Date().toISOString();
    
    const docRef = await db.collection('testimonials').add({
      ...testimonialData,
      createdAt: now,
      updatedAt: now,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...testimonialData,
        createdAt: now,
        updatedAt: now,
      },
      message: 'Testimonial created successfully',
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[ADMIN_TESTIMONIALS_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create testimonial',
      details: error.message,
    }, { status: 500 });
  }
}
