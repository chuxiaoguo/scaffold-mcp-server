import { logger } from './logger';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  FILE_SYSTEM = 'FILE_SYSTEM',
  TEMPLATE = 'TEMPLATE',
  CONFIGURATION = 'CONFIGURATION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * 自定义错误类
 */
export class ScaffoldError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context?: string;
  public readonly originalError?: Error;
  public readonly timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ScaffoldError';
    this.type = type;
    this.severity = severity;
    this.timestamp = new Date().toISOString();

    if (context) {
      this.context = context;
    }
    if (originalError) {
      this.originalError = originalError;
    }

    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScaffoldError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<ErrorType, number> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handle(error: Error | ScaffoldError, context?: string): ScaffoldError {
    let scaffoldError: ScaffoldError;

    if (error instanceof ScaffoldError) {
      scaffoldError = error;
    } else {
      scaffoldError = this.classifyError(error, context);
    }

    // 记录错误统计
    const currentCount = this.errorCounts.get(scaffoldError.type) || 0;
    this.errorCounts.set(scaffoldError.type, currentCount + 1);

    // 记录日志
    logger.error(
      scaffoldError.message,
      scaffoldError.context || context,
      scaffoldError.originalError || scaffoldError,
      {
        type: scaffoldError.type,
        severity: scaffoldError.severity,
        timestamp: scaffoldError.timestamp
      }
    );

    return scaffoldError;
  }

  /**
   * 分类错误
   */
  private classifyError(error: Error, context?: string): ScaffoldError {
    const message = error.message.toLowerCase();

    // 网络错误
    if (message.includes('network') || message.includes('timeout') || 
        message.includes('connection') || message.includes('fetch')) {
      return new ScaffoldError(
        error.message,
        ErrorType.NETWORK,
        ErrorSeverity.HIGH,
        context,
        error
      );
    }

    // 文件系统错误
    if (message.includes('enoent') || message.includes('eacces') || 
        message.includes('file') || message.includes('directory')) {
      return new ScaffoldError(
        error.message,
        ErrorType.FILE_SYSTEM,
        ErrorSeverity.MEDIUM,
        context,
        error
      );
    }

    // 验证错误
    if (message.includes('invalid') || message.includes('validation') || 
        message.includes('required') || message.includes('missing')) {
      return new ScaffoldError(
        error.message,
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        context,
        error
      );
    }

    // 模板错误
    if (message.includes('template') || message.includes('scaffold')) {
      return new ScaffoldError(
        error.message,
        ErrorType.TEMPLATE,
        ErrorSeverity.MEDIUM,
        context,
        error
      );
    }

    // 配置错误
    if (message.includes('config') || message.includes('setting')) {
      return new ScaffoldError(
        error.message,
        ErrorType.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        context,
        error
      );
    }

    // 未知错误
    return new ScaffoldError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      context,
      error
    );
  }

  /**
   * 创建特定类型的错误
   */
  createValidationError(message: string, context?: string): ScaffoldError {
    return new ScaffoldError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, context);
  }

  createNetworkError(message: string, context?: string, originalError?: Error): ScaffoldError {
    return new ScaffoldError(message, ErrorType.NETWORK, ErrorSeverity.HIGH, context, originalError);
  }

  createFileSystemError(message: string, context?: string, originalError?: Error): ScaffoldError {
    return new ScaffoldError(message, ErrorType.FILE_SYSTEM, ErrorSeverity.MEDIUM, context, originalError);
  }

  createTemplateError(message: string, context?: string, originalError?: Error): ScaffoldError {
    return new ScaffoldError(message, ErrorType.TEMPLATE, ErrorSeverity.MEDIUM, context, originalError);
  }

  createConfigurationError(message: string, context?: string, originalError?: Error): ScaffoldError {
    return new ScaffoldError(message, ErrorType.CONFIGURATION, ErrorSeverity.MEDIUM, context, originalError);
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = this.errorCounts.get(type) || 0;
    });

    return stats;
  }

  /**
   * 清除错误统计
   */
  clearStats(): void {
    this.errorCounts.clear();
  }

  /**
   * 安全执行函数，自动处理错误
   */
  async safeExecute<T>(
    fn: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<{ success: boolean; data?: T; error?: ScaffoldError }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const scaffoldError = this.handle(error as Error, context);
      const result: { success: boolean; data?: T; error?: ScaffoldError } = { 
        success: false, 
        error: scaffoldError
      };
      if (fallback !== undefined) {
        result.data = fallback;
      }
      return result;
    }
  }

  /**
   * 同步版本的安全执行
   */
  safeExecuteSync<T>(
    fn: () => T,
    context?: string,
    fallback?: T
  ): { success: boolean; data?: T; error?: ScaffoldError } {
    try {
      const data = fn();
      return { success: true, data };
    } catch (error) {
      const scaffoldError = this.handle(error as Error, context);
      const result: { success: boolean; data?: T; error?: ScaffoldError } = { 
        success: false, 
        error: scaffoldError
      };
      if (fallback !== undefined) {
        result.data = fallback;
      }
      return result;
    }
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便捷函数
export function handleError(error: Error | ScaffoldError, context?: string): ScaffoldError {
  return errorHandler.handle(error, context);
}

export function safeExecute<T>(
  fn: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<{ success: boolean; data?: T; error?: ScaffoldError }> {
  return errorHandler.safeExecute(fn, context, fallback);
}

export function safeExecuteSync<T>(
  fn: () => T,
  context?: string,
  fallback?: T
): { success: boolean; data?: T; error?: ScaffoldError } {
  return errorHandler.safeExecuteSync(fn, context, fallback);
}