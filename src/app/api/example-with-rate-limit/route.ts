/**
 * Example API Route with Rate Limiting
 * Copy this pattern for your API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/monitoring/performance';

async function handler(request: NextRequest) {
  const endTimer = performanceMonitor.startTimer('api_example');
  
  try {
    // Your API logic here
    const data = { message: 'Success' };
    
    endTimer();
    return NextResponse.json(data);
  } catch (error) {
    endTimer();
    logger.error('API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting
export const POST = withRateLimit(handler, rateLimitConfigs.standard);
