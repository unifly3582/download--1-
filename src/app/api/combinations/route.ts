import { NextResponse, NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { CombinationService } from '@/lib/oms/combinationService';
import { z } from 'zod';

// Schema for creating a combination
const CreateCombinationBodySchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    sku: z.string(),
    productName: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    variationId: z.string().optional(),
    weight: z.number().optional(),
    dimensions: z.object({
      l: z.number(),
      b: z.number(),
      h: z.number(),
    }).optional(),
  })),
  weight: z.number().positive(),
  dimensions: z.object({
    l: z.number().positive(),
    b: z.number().positive(),
    h: z.number().positive(),
  }),
  notes: z.string().optional(),
});

/**
 * GET /api/combinations
 * List all active combinations
 */
async function getCombinationsHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50');
    const productId = searchParams.get('productId');

    let combinations;
    
    if (productId) {
      combinations = await CombinationService.findCombinationsWithProduct(productId);
    } else {
      combinations = await CombinationService.listCombinations(limit);
    }

    return NextResponse.json({
      success: true,
      data: combinations,
      count: combinations.length
    });

  } catch (error: any) {
    console.error('[COMBINATIONS_API] Error fetching combinations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch combinations'
    }, { status: 500 });
  }
}

/**
 * POST /api/combinations
 * Create a new verified combination
 */
async function createCombinationHandler(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const body = await request.json();
    const parseResult = CreateCombinationBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid combination data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }

    const { items, weight, dimensions, notes } = parseResult.data;

    const combinationHash = await CombinationService.saveCombination(
      items,
      weight,
      dimensions,
      authContext.user.uid,
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Combination created successfully',
      combinationHash
    }, { status: 201 });

  } catch (error: any) {
    console.error('[COMBINATIONS_API] Error creating combination:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create combination'
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCombinationsHandler);
export const POST = withAuth(['admin'])(createCombinationHandler);