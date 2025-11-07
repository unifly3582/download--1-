/**
 * Unit Tests for Logger
 */

import { logger } from '@/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info messages in test environment', () => {
      logger.info('Test message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include context in log message', () => {
      const context = { userId: '123', action: 'test' };
      logger.info('Test with context', context);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test with context')
      );
    });
  });

  describe('error', () => {
    it('should always log errors', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include error details', () => {
      const error = new Error('Test error');
      logger.error('Error with context', error, { orderId: 'ORD_123' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error with context')
      );
    });
  });

  describe('warn', () => {
    it('should log warnings', () => {
      logger.warn('Warning message', { issue: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages in test environment', () => {
      logger.debug('Debug message', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
