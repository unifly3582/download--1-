import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';

/**
 * GET /api/customer/testimonials
 * Fetch active testimonials for customer-facing website (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Try with composite index first, fallback to simple query if index not ready
    let snapshot;
    try {
      snapshot = await db
        .collection('testimonials')
        .where('isActive', '==', true)
        .orderBy('displayOrder', 'asc')
        .orderBy('createdAt', 'desc')
        .limit(Math.min(limit, 50))
        .get();
    } catch (indexError: any) {
      // If index not ready, fetch all active and sort in memory
      console.warn('Composite index not ready, using fallback query');
      snapshot = await db
        .collection('testimonials')
        .where('isActive', '==', true)
        .get();
    }
    
    let testimonials = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        youtubeVideoId: data.youtubeVideoId,
        customerName: data.customerName,
        customerLocation: data.customerLocation,
        title: data.title,
        description: data.description,
        displayOrder: data.displayOrder,
        createdAt: data.createdAt,
        // Generate YouTube URLs for convenience
        thumbnailUrl: `https://img.youtube.com/vi/${data.youtubeVideoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${data.youtubeVideoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${data.youtubeVideoId}`,
      };
    });
    
    // Sort in memory if we used the fallback query
    testimonials.sort((a: any, b: any) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply limit if using fallback
    testimonials = testimonials.slice(0, Math.min(limit, 50));
    
    return NextResponse.json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
    
  } catch (error: any) {
    console.error('[CUSTOMER_TESTIMONIALS_API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch testimonials',
      details: error.message,
    }, { status: 500 });
  }
}
