/**
 * Next.js Instrumentation
 * Initializes monitoring and observability tools
 */

export async function register() {
  // Only run in Node.js runtime (server-side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side
    // Uncomment when Sentry is installed: npm install @sentry/nextjs
    /*
    const Sentry = await import('@sentry/nextjs');
    const sentryConfig = await import('./src/lib/monitoring/sentry');
    
    Sentry.init({
      dsn: sentryConfig.default.dsn,
      environment: sentryConfig.default.environment,
      enabled: sentryConfig.default.enabled,
      tracesSampleRate: sentryConfig.default.tracesSampleRate,
      beforeSend: sentryConfig.default.beforeSend,
    });
    */
  }

  // Initialize for Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization if needed
  }
}
