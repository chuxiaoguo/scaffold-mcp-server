/**
 * 日志记录工具
 * 提供统一的日志记录接口
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    if (context) {
      logEntry.context = context;
    }
    if (data !== undefined) {
      logEntry.data = data;
    }
    if (error) {
      logEntry.error = error;
    }

    this.logs.push(logEntry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 输出到控制台
    this.outputToConsole(logEntry);
  }

  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.data);
        break;
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats(): {
    totalLogs: number;
    debugCount: number;
    infoCount: number;
    warnCount: number;
    errorCount: number;
  } {
    const stats = {
      totalLogs: this.logs.length,
      debugCount: 0,
      infoCount: 0,
      warnCount: 0,
      errorCount: 0
    };

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.DEBUG:
          stats.debugCount++;
          break;
        case LogLevel.INFO:
          stats.infoCount++;
          break;
        case LogLevel.WARN:
          stats.warnCount++;
          break;
        case LogLevel.ERROR:
          stats.errorCount++;
          break;
      }
    });

    return stats;
  }
}

// 导出单例实例
export const logger = Logger.getInstance();