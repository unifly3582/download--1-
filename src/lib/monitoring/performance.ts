/**
 * Performance Monitoring
 * Tracks application performance metrics
 */

import { logger } from '@/lib/logger';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
    };
  }

  /**
   * Record a metric
   */
  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && value > 1000) {
      logger.warn('Slow operation detected', { label, duration: value });
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(label: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * Get all metrics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [label, _] of this.metrics) {
      stats[label] = this.getStats(label);
    }
    
    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Report metrics (can be sent to external service)
   */
  report(): void {
    const stats = this.getAllStats();
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('Performance metrics', stats);
    }
    
    // In production, send to monitoring service
    // Example: Send to custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/metrics', {
      //   method: 'POST',
      //   body: JSON.stringify(stats),
      // }).catch(err => logger.error('Failed to report metrics', err));
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Helper function for easy timing
export function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const endTimer = performanceMonitor.startTimer(label);
  
  return fn().finally(() => {
    endTimer();
  });
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceMonitor.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          performanceMonitor.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            performanceMonitor.recordMetric('CLS', clsScore);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.error('Failed to track web vitals', error);
    }
  }
}
