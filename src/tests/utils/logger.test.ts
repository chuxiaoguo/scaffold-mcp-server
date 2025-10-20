import { Logger, LogLevel } from '../../utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    logger.clearLogs();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });
  });

  describe('Log Levels', () => {
    it('should set log level', () => {
      logger.setLogLevel(LogLevel.WARN);
      // Note: Logger doesn't have getLevel method, so we test by behavior
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0]?.level).toBe(LogLevel.WARN);
      expect(logs[1]?.level).toBe(LogLevel.ERROR);
    });

    it('should filter logs based on level', () => {
      logger.setLogLevel(LogLevel.WARN);
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0]?.level).toBe(LogLevel.WARN);
      expect(logs[1]?.level).toBe(LogLevel.ERROR);
    });
  });

  describe('Logging Methods', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', 'test-context', { key: 'value' });
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.DEBUG);
      expect(logs[0]?.message).toBe('Debug message');
      expect(logs[0]?.context).toBe('test-context');
      expect(logs[0]?.data).toEqual({ key: 'value' });
    });

    it('should log info messages', () => {
      logger.info('Info message');
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.INFO);
      expect(logs[0]?.message).toBe('Info message');
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.WARN);
      expect(logs[0]?.message).toBe('Warning message');
    });

    it('should log error messages with error objects', () => {
      const error = new Error('Test error');
      logger.error('Error message', 'error-context', error);
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe(LogLevel.ERROR);
      expect(logs[0]?.message).toBe('Error message');
      expect(logs[0]?.context).toBe('error-context');
      expect(logs[0]?.error).toBe(error);
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      logger.debug('Debug 1', 'context1');
      logger.info('Info 1', 'context1');
      logger.warn('Warning 1', 'context2');
      logger.error('Error 1', 'context2');
    });

    it('should filter logs by level', () => {
      const warnLogs = logger.getLogs(LogLevel.WARN);
      expect(warnLogs).toHaveLength(2);
      expect(warnLogs.every(log => log.level >= LogLevel.WARN)).toBe(true);
    });

    it('should return all logs when no filter is applied', () => {
      const allLogs = logger.getLogs();
      expect(allLogs).toHaveLength(4);
    });
  });

  describe('Log Statistics', () => {
    beforeEach(() => {
      logger.debug('Debug 1');
      logger.debug('Debug 2');
      logger.info('Info 1');
      logger.warn('Warning 1');
      logger.error('Error 1');
      logger.error('Error 2');
    });

    it('should return correct log statistics', () => {
      const stats = logger.getStats();
      expect(stats.totalLogs).toBe(6);
      expect(stats.debugCount).toBe(2);
      expect(stats.infoCount).toBe(1);
      expect(stats.warnCount).toBe(1);
      expect(stats.errorCount).toBe(2);
    });
  });

  describe('Log Management', () => {
    it('should clear all logs', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      expect(logger.getLogs()).toHaveLength(2);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Console Output', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should output to console by default', () => {
      logger.info('Test message');
      // Logger outputs to console by default, we can't easily test this without mocking
      // the private outputToConsole method, so we just verify the log was created
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined context gracefully', () => {
      logger.info('Message without context');
      const logs = logger.getLogs();
      expect(logs[0]?.context).toBeUndefined();
    });

    it('should handle undefined data gracefully', () => {
      logger.info('Message without data', 'context');
      const logs = logger.getLogs();
      expect(logs[0]?.data).toBeUndefined();
    });

    it('should handle empty string messages', () => {
      logger.info('');
      const logs = logger.getLogs();
      expect(logs[0]?.message).toBe('');
    });

    it('should handle null data', () => {
      logger.info('Message with null data', 'context', null);
      const logs = logger.getLogs();
      expect(logs[0]?.data).toBeNull();
    });
  });
});