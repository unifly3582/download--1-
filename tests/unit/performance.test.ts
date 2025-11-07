/**
 * Unit Tests for Performance Monitoring
 */

import { performanceMonitor, measureAsync } from '@/lib/monitoring/performance';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  describe('startTimer', () => {
    it('should record timing for operations', () => {
      const endTimer = performanceMonitor.startTimer('test_operation');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      endTimer();
      
      const stats = performanceMonitor.getStats('test_operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBeGreaterThan(0);
    });

    it('should record multiple measurements', () => {
      for (let i = 0; i < 5; i++) {
        const endTimer = performanceMonitor.startTimer('multi_test');
        endTimer();
      }
      
      const stats = performanceMonitor.getStats('multi_test');
      expect(stats!.count).toBe(5);
    });
  });

  describe('measureAsync', () => {
    it('should measure async operations', async () => {
      const result = await measureAsync('async_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test_result';
      });
      
      expect(result).toBe('test_result');
      
      const stats = performanceMonitor.getStats('async_test');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it('should handle errors in async operations', async () => {
      await expect(
        measureAsync('error_test', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      // Should still record the timing
      const stats = performanceMonitor.getStats('error_test');
      expect(stats).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return null for non-existent metrics', () => {
      const stats = performanceMonitor.getStats('non_existent');
      expect(stats).toBeNull();
    });

    it('should calculate correct statistics', () => {
      performanceMonitor.recordMetric('test', 10);
      performanceMonitor.recordMetric('test', 20);
      performanceMonitor.recordMetric('test', 30);
      
      const stats = performanceMonitor.getStats('test');
      expect(stats!.avg).toBe(20);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(30);
      expect(stats!.count).toBe(3);
    });
  });

  describe('getAllStats', () => {
    it('should return all recorded metrics', () => {
      performanceMonitor.recordMetric('metric1', 100);
      performanceMonitor.recordMetric('metric2', 200);
      
      const allStats = performanceMonitor.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(2);
      expect(allStats.metric1).toBeDefined();
      expect(allStats.metric2).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      performanceMonitor.recordMetric('test', 100);
      performanceMonitor.clear();
      
      const stats = performanceMonitor.getStats('test');
      expect(stats).toBeNull();
    });
  });
});
