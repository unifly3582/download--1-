import { NextResponse, NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { CombinationService } from '@/lib/oms/combinationService';
import { z } from 'zod';

const UpdateCombinationSchema = z.object({
  weight: z.number().positive(),
  dimensions: z.object({
    l: z.number().positive(),
    b: z.number().positive(),
    h: z.number().positive(),
  }),
  notes: z.string().optional(),
});

/**
 * GET /api/combinations/[hash]
 * Get a specific combination
 */
async function getCombinationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> },
  authContext: AuthContext
) {
  try {
    const { hash } = await params;
    const combination = await CombinationService.getCombination(hash);

    if (!combination) {
      return NextResponse.json({
        success: false,
        error: 'Combination not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: combination
    });

  } catch (error: any) {
    console.error('[COMBINATION_API] Error fetching combination:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch combination'
    }, { status: 500 });
  }
}

/**
 * PUT /api/combinations/[hash]
 * Update a combination's weight and dimensions
 */
async function updateCombinationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> },
  authContext: AuthContext
) {
  try {
    const { hash } = await params;
    const body = await request.json();
    const parseResult = UpdateCombinationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid update data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }

    const { weight, dimensions, notes } = parseResult.data;

    await CombinationService.updateCombination(
      hash,
      weight,
      dimensions,
      authContext.user.uid,
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Combination updated successfully'
    });

  } catch (error: any) {
    console.error('[COMBINATION_API] Error updating combination:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update combination'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/combinations/[hash]
 * Deactivate a combination (soft delete)
 */
async function deleteCombinationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> },
  authContext: AuthContext
) {
  try {
    const { hash } = await params;

    await CombinationService.deactivateCombination(hash, authContext.user.uid);

    return NextResponse.json({
      success: true,
      message: 'Combination deactivated successfully'
    });

  } catch (error: any) {
    console.error('[COMBINATION_API] Error deactivating combination:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to deactivate combination'
    }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCombinationHandler);
export const PUT = withAuth(['admin'])(updateCombinationHandler);
export const DELETE = withAuth(['admin'])(deleteCombinationHandler);