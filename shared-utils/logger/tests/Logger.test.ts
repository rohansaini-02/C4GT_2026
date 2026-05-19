import { Logger, LogMessage } from '../src/index';

describe('Logger Utility', () => {
  let mockTransport: jest.Mock;

  beforeEach(() => {
    mockTransport = jest.fn();
    Logger.setGlobalTransport(mockTransport);
    Logger.setGlobalLevel('INFO');
  });

  afterEach(() => {
    Logger.setGlobalTransport(null as any);
  });

  it('should initialize with context', () => {
    const logger = new Logger('TestContext');
    logger.info('Hello');
    expect(mockTransport).toHaveBeenCalledTimes(1);
    
    const logArg = mockTransport.mock.calls[0][0] as LogMessage;
    expect(logArg.context).toBe('TestContext');
    expect(logArg.message).toBe('Hello');
    expect(logArg.level).toBe('INFO');
  });

  it('should format metadata correctly', () => {
    const logger = new Logger('TestContext');
    logger.error('Failed', { code: 500, retry: false });
    
    const logArg = mockTransport.mock.calls[0][0] as LogMessage;
    expect(logArg.metadata).toEqual({ code: 500, retry: false });
  });

  it('should respect global log levels', () => {
    const logger = new Logger('TestContext');
    Logger.setGlobalLevel('WARN'); // Ignore DEBUG and INFO

    logger.debug('Debug log');
    logger.info('Info log');
    logger.warn('Warn log');
    logger.error('Error log');

    expect(mockTransport).toHaveBeenCalledTimes(2); // Only WARN and ERROR
    expect((mockTransport.mock.calls[0][0] as LogMessage).level).toBe('WARN');
    expect((mockTransport.mock.calls[1][0] as LogMessage).level).toBe('ERROR');
  });

  it('should respect instance log levels over global log levels', () => {
    const logger = new Logger('TestContext');
    Logger.setGlobalLevel('ERROR'); // Global is restrictive
    logger.setInstanceLevel('DEBUG'); // Instance is permissive

    logger.debug('Debug log');
    logger.info('Info log');

    expect(mockTransport).toHaveBeenCalledTimes(2);
  });

  it('should fallback to console when no transport is provided', () => {
    Logger.setGlobalTransport(null as any);
    
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    
    const logger = new Logger('TestContext');
    logger.info('Console fallback test');
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should fallback to console for all levels', () => {
    Logger.setGlobalTransport(null as any);
    Logger.setGlobalLevel('DEBUG');
    
    const consoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const logger = new Logger('TestContext');
    logger.debug('Debug log');
    logger.info('Info log');
    logger.warn('Warn log');
    logger.error('Error log');
    
    expect(consoleDebug).toHaveBeenCalled();
    expect(consoleInfo).toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleDebug.mockRestore();
    consoleInfo.mockRestore();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });
});
