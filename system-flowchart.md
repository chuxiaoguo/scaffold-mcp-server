# Scaffold MCP Server 系统功能流程图

## 系统架构概览

```
Scaffold MCP Server 系统功能流程图
├── 入口点 (index.ts)
│   ├── ScaffoldMCPServer 类初始化
│   │   ├── 服务器配置 (name: scaffold-mcp-server, version: 1.0.0)
│   │   ├── 工具处理器设置 (setupToolHandlers)
│   │   └── 错误处理设置 (setupErrorHandling)
│   └── 主函数启动 (main)
│       └── 服务器运行 (server.run)
│
├── 工具处理层 (Tool Handlers)
│   ├── 工具列表处理器 (ListToolsRequestSchema)
│   │   └── 返回所有可用工具 Schema (getAllToolSchemas)
│   └── 工具调用处理器 (CallToolRequestSchema)
│       ├── 参数验证 (MCPErrorHandler.validateRequiredParam)
│       ├── 工具路由
│       │   └── generateScaffold → handleGenerateScaffold
│       └── 错误处理 (MCPErrorHandler.handleUnknownTool)
│
├── 核心业务流程 (generateScaffold)
│   ├── 1. 参数解析与验证
│   │   ├── 路径解析 (pathResolver.ts)
│   │   │   ├── 获取工作空间根路径 (getWorkspaceRoot)
│   │   │   ├── 查找有效工作空间 (findValidWorkspace)
│   │   │   └── 解析项目路径和名称 (resolveProjectPathAndName)
│   │   └── 参数标准化
│   │
│   ├── 2. 模板管理 (Template Management)
│   │   ├── 模板更新检查 (templateManager.updateTemplatesIfNeeded)
│   │   ├── 模板配置管理 (templateConfigManager)
│   │   └── 模板缓存管理
│   │
│   ├── 3. 技术栈解析 (Tech Stack Parsing)
│   │   ├── 技术栈解析 (parseTechStack)
│   │   ├── 技术栈标准化 (normalizeTechStack)
│   │   └── 默认值填充 (fillDefaultValues)
│   │
│   ├── 4. 模板匹配 (Template Matching)
│   │   ├── 智能匹配器 (SmartMatcher)
│   │   │   ├── 关键词匹配
│   │   │   ├── 积分计算匹配 (ScoreCalculator)
│   │   │   └── 冲突检测
│   │   ├── 固定模板匹配 (smartMatchFixedTemplate)
│   │   └── 动态构建器 (NonFixedBuilder)
│   │
│   ├── 5. 项目生成 (Project Generation)
│   │   ├── 项目文件生成 (generateProject)
│   │   │   ├── 模板文件处理
│   │   │   ├── 依赖管理 (package.json)
│   │   │   └── 配置文件生成
│   │   ├── 额外工具注入 (injectExtraTools)
│   │   │   ├── ESLint 配置
│   │   │   ├── Prettier 配置
│   │   │   ├── Jest/Vitest 配置
│   │   │   └── Husky 配置
│   │   └── 文件系统操作 (fileOperations.ts)
│   │       ├── 目录创建 (createProjectFiles)
│   │       ├── 文件写入
│   │       └── 权限处理
│   │
│   └── 6. 结果处理与响应
│       ├── 目录树生成 (formatDirectoryTree)
│       ├── 文件摘要统计
│       ├── 过程日志记录
│       └── 响应格式化 (ResponseFormatter)
│
├── 工具注入系统 (Tool Injectors)
│   ├── 工具注入器管理 (ToolInjectorManager)
│   ├── ESLint 注入器
│   ├── Prettier 注入器
│   ├── 测试框架注入器 (Jest/Vitest)
│   └── Git Hooks 注入器 (Husky)
│
├── 配置管理系统 (Configuration)
│   ├── 工具 Schema 配置 (toolSchemas.ts)
│   │   ├── GENERATE_SCAFFOLD_SCHEMA
│   │   ├── 工具验证 (isValidToolName)
│   │   └── Schema 获取 (getToolSchema)
│   └── 模板配置管理 (templateConfigManager)
│
├── 错误处理系统 (Error Handling)
│   ├── MCP 错误处理器 (MCPErrorHandler)
│   │   ├── 工具执行错误 (handleToolError)
│   │   ├── 参数验证错误 (handleValidationError)
│   │   ├── 未知工具错误 (handleUnknownTool)
│   │   └── 异步包装器 (wrapAsyncHandler)
│   └── 通用错误处理器 (ErrorHandler)
│       ├── 错误分类 (ErrorType, ErrorSeverity)
│       ├── 自定义错误 (ScaffoldError)
│       └── 安全执行 (safeExecute)
│
├── 消息处理系统 (Message Processing)
│   ├── 响应格式化器 (ResponseFormatter)
│   │   ├── 成功响应格式化 (formatSuccess)
│   │   ├── 错误响应格式化 (formatError)
│   │   ├── 项目信息格式化 (formatProjectInfo)
│   │   └── 目录树格式化 (formatDirectoryTree)
│   └── 消息模板系统 (MessageTemplates)
│       ├── 成功消息模板 (renderSuccess)
│       ├── 错误消息模板 (renderError)
│       ├── 项目信息模板 (renderProjectInfo)
│       └── 快速开始指南 (renderQuickStart)
│
└── 核心匹配引擎 (Core Matching Engine)
    ├── 智能匹配器 (SmartMatcher)
    │   ├── 直接关键词匹配
    │   ├── 积分计算匹配
    │   └── 模板优先级排序
    ├── 积分计算器 (ScoreCalculator)
    │   ├── 必需项匹配计算
    │   ├── 核心项匹配计算
    │   ├── 可选项匹配计算
    │   └── 冲突项检测
    └── 非固定构建器 (NonFixedBuilder)
        ├── 动态模板生成
        ├── 自定义配置构建
        └── 灵活组合支持
```

## 主要数据流

### 1. 请求处理流程
```
用户请求 → MCP Server → 工具路由 → generateScaffold → 参数验证 → 业务处理 → 响应返回
```

### 2. 模板匹配流程
```
技术栈输入 → 解析标准化 → 智能匹配器 → 积分计算 → 模板选择 → 项目生成
```

### 3. 文件生成流程
```
模板选择 → 文件内容生成 → 工具注入 → 文件系统写入 → 结果统计 → 响应格式化
```

## 关键组件说明

### 入口组件 (index.ts)
- **ScaffoldMCPServer**: 主服务器类，负责 MCP 协议处理
- **工具处理器**: 处理工具列表和工具调用请求
- **错误处理**: 统一的错误处理和日志记录

### 核心业务组件
- **generateScaffold**: 主要业务逻辑入口
- **SmartMatcher**: 智能模板匹配引擎
- **NonFixedBuilder**: 动态项目构建器
- **ToolInjectorManager**: 工具注入管理器

### 工具组件
- **pathResolver**: 路径解析和工作空间检测
- **projectGenerator**: 项目文件生成和依赖管理
- **fileOperations**: 文件系统操作和错误处理

### 配置和管理组件
- **toolSchemas**: 工具 Schema 定义和验证
- **templateManager**: 模板缓存和更新管理
- **templateConfigManager**: 模板配置管理

### 辅助组件
- **ResponseFormatter**: 响应格式化
- **MessageTemplates**: 消息模板系统
- **MCPErrorHandler**: MCP 特定错误处理
- **ErrorHandler**: 通用错误处理

## 扩展点

系统设计了多个扩展点，便于功能扩展：

1. **新工具添加**: 在 `toolSchemas.ts` 中定义新的工具 Schema
2. **新模板支持**: 通过模板配置系统添加新的项目模板
3. **新工具注入器**: 实现 `InjectorResult` 接口添加新的工具支持
4. **自定义匹配逻辑**: 扩展 `SmartMatcher` 或 `ScoreCalculator`
5. **新的响应格式**: 扩展 `ResponseFormatter` 和 `MessageTemplates`