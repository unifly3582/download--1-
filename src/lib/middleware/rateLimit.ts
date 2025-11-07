/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  message?: string;
}

// In-memory store (use Redis in production for distributed systems)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 60, // 60 requests per minute default
    message = 'Too many requests, please try again later.',
  } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get client identifier (IP address or user ID)
    const identifier = getClientIdentifier(request);
    
    if (!identifier) {
      // If we can't identify the client, allow the request
      return null;
    }

    const now = Date.now();
    const key = `${identifier}:${request.nextUrl.pathname}`;
    
    // Get or create rate limit entry
    let entry = requestCounts.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(key, entry);
      return null; // Allow request
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        path: request.nextUrl.pathname,
        count: entry.count,
        limit: maxRequests,
      });

      return NextResponse.json(
        {
          error: message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetTime),
          },
        }
      );
    }

    // Add rate limit headers to response
    return null; // Allow request, headers will be added by wrapper
  };
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string | null {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp;
  
  if (ip) {
    return ip.trim();
  }

  // Fallback to user agent (less reliable)
  return request.headers.get('user-agent') || null;
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict: For sensitive operations (login, password reset)
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many attempts, please try again in 15 minutes.',
  },

  // Standard: For general API endpoints
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many requests, please try again in a minute.',
  },

  // Relaxed: For public endpoints
  relaxed: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
    message: 'Too many requests, please slow down.',
  },

  // Order creation: Prevent spam orders
  orderCreation: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many order attempts, please wait before trying again.',
  },

  // WhatsApp: Prevent notification spam
  whatsapp: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many notification requests, please wait.',
  },
};

/**
 * Wrapper function to apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimit(config)(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}
