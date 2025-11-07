/**
 * Metrics Endpoint
 * Collects client-side performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rateLimit';

async function handler(request: NextRequest) {
  try {
    const metrics = await request.json();
    
    // Log metrics for analysis
    logger.info('Client metrics received', metrics);
    
    // In production, you could send these to a metrics service
    // Example: CloudWatch, Datadog, New Relic, etc.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process metrics', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}

// Apply relaxed rate limiting for metrics
export const POST = withRateLimit(handler, rateLimitConfigs.relaxed);
