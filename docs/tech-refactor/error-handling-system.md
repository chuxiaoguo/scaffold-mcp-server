# 错误处理系统分析

## 模块概述

错误处理系统负责统一处理项目中的各种错误，包括参数验证错误、网络错误、文件系统错误等。该系统主要由 [MCPErrorHandler.ts](file:///Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/src/utils/MCPErrorHandler.ts)、[errorHandler.ts](file:///Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/src/utils/errorHandler.ts) 和 [ResponseFormatter.ts](file:///Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/src/utils/ResponseFormatter.ts) 等模块组成。

## 核心功能

### 1. MCP 错误处理器 (MCPErrorHandler.ts)

```typescript
export class MCPErrorHandler {
  static handleToolError(error: unknown, toolName: string): McpError
  static handleValidationError(message: string): McpError
  static handleUnknownTool(toolName: string): McpError
}
```

**功能说明**：
- 处理 MCP 协议相关的错误
- 提供统一的错误格式化接口

**合理性评估**：
- ✅ 符合 MCP 协议规范
- ✅ 错误类型分类清晰

### 2. 通用错误处理器 (errorHandler.ts)

```typescript
export class ErrorHandler {
  handle(error: Error | ScaffoldError, context?: string): ScaffoldError
  safeExecute<T>(fn: () => Promise<T>, context?: string, fallback?: T): Promise<{ success: boolean; data?: T; error?: ScaffoldError }>
}
```

**功能说明**：
- 处理各种类型的错误
- 提供安全执行函数

**合理性评估**：
- ✅ 错误分类详细
- ✅ 安全执行机制完善

### 3. 响应格式化器 (ResponseFormatter.ts)

```typescript
export class ResponseFormatter {
  static formatSuccess(result: GenerateResult): MCPResponse
  static formatError(error: string, result?: Partial<GenerateResult>): MCPResponse
}
```

**功能说明**：
- 格式化 MCP 响应
- 提供成功和错误响应格式

**合理性评估**：
- ✅ 响应格式统一
- ✅ 信息展示完整

## 依赖关系

### 直接依赖

1. [@modelcontextprotocol/sdk](file:///Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/node_modules/.pnpm/@modelcontextprotocol+sdk@1.0.3/node_modules/@modelcontextprotocol/sdk/dist/index.d.ts) - MCP 协议 SDK
2. [types/index.ts](file:///Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/src/types/index.ts) - 类型定义
3. [utils/logger.ts](file:///Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/src/utils/logger.ts) - 日志工具

## 现有实现方案评估

### 优点

1. **错误处理完善**：覆盖各种错误类型
2. **安全执行机制**：提供安全执行函数避免程序崩溃
3. **响应格式统一**：MCP 响应格式一致

### 不足之处

1. **错误信息不够详细**：部分错误缺少上下文信息
2. **缺少错误统计**：无法了解错误发生频率
3. **恢复机制有限**：缺少自动恢复机制

## 优化建议

### 1. 增强错误信息详细度

**问题**：当前部分错误缺少上下文信息，不利于问题排查。

**建议**：
- 增加上下文信息收集
- 提供详细的错误堆栈

```typescript
// 建议的改进方案
class DetailedErrorHandler {
  handle(error: Error | ScaffoldError, context?: string, additionalInfo?: any): ScaffoldError {
    let scaffoldError: ScaffoldError;
    
    if (error instanceof ScaffoldError) {
      scaffoldError = error;
    } else {
      scaffoldError = new ScaffoldError(
        error.message,
        this.classifyError(error),
        this.determineSeverity(error),
        context,
        error
      );
    }
    
    // 添加额外信息
    if (additionalInfo) {
      scaffoldError.additionalInfo = additionalInfo;
    }
    
    // 记录详细日志
    logger.error(
      scaffoldError.message,
      scaffoldError.context,
      scaffoldError.originalError,
      {
        type: scaffoldError.type,
        severity: scaffoldError.severity,
        timestamp: scaffoldError.timestamp,
        additionalInfo: scaffoldError.additionalInfo,
        stack: scaffoldError.stack
      }
    );
    
    return scaffoldError;
  }
}
```

### 2. 实现错误统计和分析

**问题**：当前无法了解错误发生频率和趋势。

**建议**：
- 引入错误统计机制
- 提供错误分析接口

```typescript
// 建议的改进方案
class ErrorHandlerWithStats {
  private errorStats: Map<string, ErrorStat> = new Map();
  
  handle(error: Error | ScaffoldError, context?: string): ScaffoldError {
    const scaffoldError = super.handle(error, context);
    
    // 统计错误
    const key = `${scaffoldError.type}-${scaffoldError.context || 'unknown'}`;
    const stat = this.errorStats.get(key) || { count: 0, firstOccurrence: Date.now(), lastOccurrence: 0 };
    stat.count++;
    stat.lastOccurrence = Date.now();
    this.errorStats.set(key, stat);
    
    return scaffoldError;
  }
  
  getErrorStats(): ErrorStatReport {
    const stats: ErrorStatReport = {
      totalErrors: 0,
      errorTypes: {},
      frequentErrors: []
    };
    
    this.errorStats.forEach((stat, key) => {
      stats.totalErrors += stat.count;
      const [type, context] = key.split('-');
      if (!stats.errorTypes[type]) {
        stats.errorTypes[type] = 0;
      }
      stats.errorTypes[type] += stat.count;
    });
    
    // 找出高频错误
    stats.frequentErrors = Array.from(this.errorStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, stat]) => ({ key, ...stat }));
    
    return stats;
  }
}

interface ErrorStat {
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
}

interface ErrorStatReport {
  totalErrors: number;
  errorTypes: Record<string, number>;
  frequentErrors: { key: string; count: number; firstOccurrence: number; lastOccurrence: number }[];
}
```

### 3. 实现自动恢复机制

**问题**：当前缺少自动恢复机制，需要人工干预。

**建议**：
- 引入自动恢复策略
- 支持配置恢复行为

```typescript
// 建议的改进方案
class ErrorHandlerWithRecovery {
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy> = new Map();
  
  registerRecoveryStrategy(type: ErrorType, strategy: RecoveryStrategy) {
    this.recoveryStrategies.set(type, strategy);
  }
  
  async handleWithRecovery<T>(
    fn: () => Promise<T>,
    context?: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; data?: T; error?: ScaffoldError; recovered: boolean }> {
    let lastError: ScaffoldError | undefined;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const data = await fn();
        return { success: true, data, recovered: i > 0 };
      } catch (error) {
        lastError = this.handle(error as Error, context);
        
        // 检查是否有恢复策略
        const strategy = this.recoveryStrategies.get(lastError.type);
        if (strategy && i < maxRetries) {
          const shouldRetry = await strategy.recover(lastError, i);
          if (!shouldRetry) {
            break;
          }
          
          // 等待一段时间后重试
          await this.delay(strategy.retryDelay || 1000);
          continue;
        }
        
        break;
      }
    }
    
    return { success: false, error: lastError, recovered: false };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface RecoveryStrategy {
  recover(error: ScaffoldError, retryCount: number): Promise<boolean>;
  retryDelay?: number;
}
```