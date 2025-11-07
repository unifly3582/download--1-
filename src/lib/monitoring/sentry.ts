/**
 * Sentry Error Monitoring Configuration
 * Captures and tracks errors in production
 */

// This file will be used when Sentry is installed
// Install with: npm install @sentry/nextjs

export function initSentry() {
  // Sentry will be initialized via instrumentation.ts
  // This is a placeholder for custom Sentry configuration
}

export const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Error Filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // User cancellations
    'AbortError',
    'cancelled',
  ],
  
  // Privacy
  beforeSend(event: any) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
};

// Export for use in instrumentation.ts
export default sentryConfig;
