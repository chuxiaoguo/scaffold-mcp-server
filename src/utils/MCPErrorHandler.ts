import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP专用错误处理器
 * 专门处理MCP协议相关的错误逻辑
 */
export class MCPErrorHandler {
  /**
   * 处理工具执行错误
   */
  static handleToolError(error: unknown, toolName: string): McpError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${errorMessage}`
    );
  }

  /**
   * 处理参数验证错误
   */
  static handleValidationError(message: string): McpError {
    return new McpError(
      ErrorCode.InvalidParams,
      message
    );
  }

  /**
   * 处理未知工具错误
   */
  static handleUnknownTool(toolName: string): McpError {
    return new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${toolName}`
    );
  }

  /**
   * 包装异步处理器，统一错误处理
   */
  static async wrapAsyncHandler<T>(
    handler: () => Promise<T>,
    toolName: string
  ): Promise<T> {
    try {
      return await handler();
    } catch (error) {
      throw this.handleToolError(error, toolName);
    }
  }

  /**
   * 验证参数是否存在
   */
  static validateRequiredParam(
    args: unknown,
    paramName: string
  ): asserts args is Record<string, unknown> {
    if (!args || typeof args !== 'object' || !(paramName in args)) {
      throw this.handleValidationError(`Missing required parameter: ${paramName}`);
    }
  }

  /**
   * 安全地提取错误消息
   */
  static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  /**
   * 检查是否为MCP错误
   */
  static isMcpError(error: unknown): error is McpError {
    return error instanceof McpError;
  }

  /**
   * 创建通用的内部错误
   */
  static createInternalError(message: string): McpError {
    return new McpError(ErrorCode.InternalError, message);
  }

  /**
   * 处理生成脚手架的特定错误
   */
  static handleScaffoldError(error: unknown): McpError {
    const message = this.extractErrorMessage(error);
    
    // 根据错误消息类型返回不同的错误码
    if (message.includes('Missing required parameter')) {
      return new McpError(ErrorCode.InvalidParams, message);
    }
    
    if (message.includes('Template not found') || message.includes('模板未找到')) {
      return new McpError(ErrorCode.InvalidRequest, message);
    }
    
    if (message.includes('Permission denied') || message.includes('权限')) {
      return new McpError(ErrorCode.InvalidRequest, message);
    }
    
    return new McpError(ErrorCode.InternalError, message);
  }
}