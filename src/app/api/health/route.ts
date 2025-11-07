/**
 * Health Check Endpoint
 * Used for monitoring and load balancer health checks
 */

import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    // Add performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      (health as any).metrics = performanceMonitor.getAllStats();
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
