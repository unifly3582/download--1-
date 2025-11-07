/**
 * Production-ready logging utility
 * Automatically disabled in production unless explicitly enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isProduction: boolean;
  private enabledInProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.enabledInProduction = process.env.ENABLE_LOGGING === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true;
    
    // In production, only log if explicitly enabled
    if (this.isProduction) {
      return this.enabledInProduction;
    }
    
    // In development, log everything
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }

    // In production, send errors to external logging service
    if (this.isProduction && level === 'error') {
      // Send to Sentry if configured
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        Sentry.captureException(new Error(message), { extra: context });
      } else if (typeof global !== 'undefined' && (global as any).Sentry) {
        const Sentry = (global as any).Sentry;
        Sentry.captureException(new Error(message), { extra: context });
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    this.log('error', message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel, LogContext };
