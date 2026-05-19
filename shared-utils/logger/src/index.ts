export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: Record<string, any>;
}

export type LogTransport = (log: LogMessage) => void;

const LogLevelPriorities: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export class Logger {
  private static globalLevel: LogLevel = 'INFO';
  private static globalTransport: LogTransport | null = null;
  
  private context: string;
  private instanceLevel?: LogLevel;

  constructor(context: string) {
    this.context = context;
  }

  public static setGlobalLevel(level: LogLevel) {
    Logger.globalLevel = level;
  }

  public static setGlobalTransport(transport: LogTransport) {
    Logger.globalTransport = transport;
  }

  public setInstanceLevel(level: LogLevel) {
    this.instanceLevel = level;
  }

  public debug(message: string, metadata?: Record<string, any>) {
    this.log('DEBUG', message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>) {
    this.log('INFO', message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>) {
    this.log('WARN', message, metadata);
  }

  public error(message: string, metadata?: Record<string, any>) {
    this.log('ERROR', message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const activeLevel = this.instanceLevel ?? Logger.globalLevel;
    
    if (LogLevelPriorities[level] < LogLevelPriorities[activeLevel]) {
      return; // Skip logging if below active threshold
    }

    const logMessage: LogMessage = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(metadata ? { metadata } : {}),
    };

    if (Logger.globalTransport) {
      Logger.globalTransport(logMessage);
    } else {
      this.defaultConsoleTransport(logMessage);
    }
  }

  private defaultConsoleTransport(log: LogMessage) {
    const formattedMeta = log.metadata ? ` | Meta: ${JSON.stringify(log.metadata)}` : '';
    const output = `[${log.timestamp}] [${log.level}] [${log.context}] ${log.message}${formattedMeta}`;

    switch (log.level) {
      case 'DEBUG':
        console.debug(output);
        break;
      case 'INFO':
        console.info(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        break;
    }
  }
}
