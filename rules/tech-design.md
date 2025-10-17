# Scaffold MCP Server 技术架构设计文档

## 1. 项目概述

Scaffold MCP Server 是一个基于 MCP (Model Context Protocol) 的前端项目脚手架生成服务器。它提供了智能化的项目模板生成能力，支持多种技术栈组合，包括 Vue3、React、Electron 等主流前端框架。

## 2. 核心架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ScaffoldMCPServer (index.ts)                              │
│  ├── Tool Handler: generateScaffold                        │
│  └── Schema Validation & Error Handling                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  generateScaffold (tools/generateScaffold.ts)              │
│  └── 项目生成协调器                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Business Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Intent Layer   │  │  Template Layer │  │  Build Layer │ │
│  │                 │  │                 │  │              │ │
│  │ IntentRecognizer│  │ TemplateDownload│  │ NonFixed     │ │
│  │ TechStackParser │  │ TemplateConfig  │  │ Builder      │ │
│  │ Matcher         │  │ Manager         │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  File System    │  │  Git Operations │  │  Injectors   │ │
│  │                 │  │                 │  │              │ │
│  │ FileOperations  │  │ Git Clone       │  │ ESLint       │ │
│  │ Directory Tree  │  │ Sparse Checkout │  │ Prettier     │ │
│  │ Template Files  │  │ Degit           │  │ Jest         │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 分层架构说明

#### MCP Server Layer (服务器层)
- **职责**: 处理 MCP 协议通信，工具注册和调用
- **核心组件**: `ScaffoldMCPServer`
- **功能**: 
  - 工具注册 (`generateScaffold`)
  - 请求验证和错误处理
  - 响应格式化

#### Service Layer (服务层)
- **职责**: 业务流程协调和结果聚合
- **核心组件**: `generateScaffold` 函数
- **功能**:
  - 参数解析和验证
  - 调用核心业务逻辑
  - 结果统计和日志记录

#### Core Business Layer (核心业务层)
- **Intent Layer (意图识别层)**:
  - `IntentRecognizer`: 智能识别用户技术栈意图
  - `TechStackParser`: 解析技术栈字符串/数组
  - `Matcher`: 模板匹配逻辑

- **Template Layer (模板层)**:
  - `TemplateDownloader`: 模板下载和缓存
  - `TemplateConfigManager`: 模板配置管理
  - `ProjectGenerator`: 项目生成器

- **Build Layer (构建层)**:
  - `NonFixedBuilder`: 动态项目构建器
  - 支持 Vite、Webpack、Electron-Vite、UmiJS

#### Infrastructure Layer (基础设施层)
- **File System**: 文件系统操作
- **Git Operations**: Git 相关操作（克隆、稀疏检出）
- **Injectors**: 开发工具注入器

## 3. 核心设计模式

### 3.1 策略模式 (Strategy Pattern)
用于模板选择和构建器选择：

```typescript
// 模板选择策略
interface TemplateStrategy {
  match(techStack: TechStack): TemplateConfig | null;
}

// 构建器选择策略
interface BuilderStrategy {
  build(techStack: TechStack, projectName: string): Promise<BuilderResult>;
}
```

### 3.2 工厂模式 (Factory Pattern)
用于创建不同类型的构建器：

```typescript
class NonFixedBuilder {
  private builders: Map<string, IBuilder> = new Map();
  
  build(techStack: TechStack): Promise<BuilderResult> {
    const builder = this.builders.get(techStack.builder);
    return builder.build(techStack);
  }
}
```

### 3.3 注入器模式 (Injector Pattern)
用于开发工具的模块化注入：

```typescript
interface IToolInjector {
  inject(techStack: TechStack, projectName: string): Promise<InjectorResult>;
  isRequired(techStack: TechStack): boolean;
}
```

### 3.4 模板方法模式 (Template Method Pattern)
用于项目生成流程：

```typescript
abstract class ProjectGenerator {
  async generate(): Promise<GenerateResult> {
    const techStack = this.parseTechStack();
    const template = this.selectTemplate(techStack);
    const files = await this.generateFiles(template);
    const result = this.postProcess(files);
    return result;
  }
}
```

## 4. 技术栈识别与匹配

### 4.1 智能意图识别
`IntentRecognizer` 使用规则引擎识别用户意图：

```typescript
class IntentRecognizer {
  // 固定模板兼容性规则
  private static readonly TEMPLATE_COMPATIBILITY = {
    'vue3-vite-typescript': {
      framework: ['vue3', 'vue'],
      builder: ['vite'],
      language: ['typescript', 'ts', 'javascript', 'js']
    }
  };
  
  // 不兼容组合检测
  private static readonly INCOMPATIBLE_COMBINATIONS = [
    { framework: ['vue3'], ui: ['antd'] },
    { framework: ['react'], ui: ['element-plus'] }
  ];
}
```

### 4.2 技术栈解析
支持多种输入格式：
- 字符串: `"vue3+ts+vite"`
- 数组: `["vue3", "typescript", "vite"]`
- 对象: `{ framework: "vue3", language: "typescript" }`

### 4.3 模板匹配策略
1. **固定模板优先**: 优先匹配预定义的固定模板
2. **智能回退**: 固定模板不匹配时使用动态构建器
3. **兼容性检查**: 检查技术栈组合的兼容性

## 5. 模板管理系统

### 5.1 三级配置加载策略
```
1. 本地配置文件 (scaffold-template/templates.config.json)
   ↓ (不存在)
2. 缓存配置文件 (.template-cache/config/templates.config.json)
   ↓ (不存在)
3. 远程配置拉取 (GitHub/CDN)
```

### 5.2 模板下载机制
支持多种下载方式：
1. **Git Sparse-Checkout** (推荐): 只下载指定目录
2. **Degit** (回退): 轻量级 Git 克隆
3. **本地模板生成** (最终回退): 使用内置模板

### 5.3 超时和错误处理
- Git 操作 30 秒超时
- 进程自动终止和资源清理
- 优雅降级机制

## 6. 文件系统架构

### 6.1 项目结构
```
scaffold-mcp-server/
├── src/
│   ├── index.ts                 # MCP 服务器入口
│   ├── types/                   # 类型定义
│   ├── tools/                   # 工具层
│   │   ├── generateScaffold.ts  # 主要工具
│   │   ├── projectGenerator.ts  # 项目生成器
│   │   ├── techStackParser.ts   # 技术栈解析
│   │   ├── templateDownloader.ts # 模板下载
│   │   └── fileOperations.ts    # 文件操作
│   └── core/                    # 核心业务层
│       ├── intentRecognizer.ts  # 意图识别
│       ├── matcher.ts           # 模板匹配
│       ├── templateGenerator.ts # 模板生成
│       ├── config/              # 配置管理
│       ├── injectors/           # 工具注入器
│       └── nonFixedBuilder/     # 动态构建器
```

### 6.2 缓存策略
- **模板缓存**: `.temp-template/` 目录
- **配置缓存**: `.template-cache/config/` 目录
- **内存缓存**: 30 分钟有效期

## 7. 错误处理和日志

### 7.1 分层错误处理
- **MCP 层**: 协议错误和工具调用错误
- **业务层**: 模板匹配和生成错误
- **基础设施层**: 文件系统和网络错误

### 7.2 日志系统
- **过程日志**: 详细的操作步骤记录
- **性能日志**: 操作耗时统计
- **错误日志**: 异常信息和堆栈跟踪

## 8. 扩展性设计

### 8.1 插件化架构
- **注入器插件**: 支持新的开发工具
- **构建器插件**: 支持新的构建系统
- **模板插件**: 支持自定义模板

### 8.2 配置驱动
- **模板配置**: JSON 配置文件驱动
- **规则配置**: 可配置的匹配规则
- **缓存配置**: 可调整的缓存策略

## 9. 性能优化

### 9.1 缓存机制
- **多级缓存**: 内存 → 本地 → 远程
- **智能失效**: 基于时间和版本的缓存失效
- **并发控制**: 避免重复下载

### 9.2 资源管理
- **进程管理**: 超时控制和资源清理
- **内存管理**: 大文件流式处理
- **网络优化**: 连接复用和重试机制

## 10. 安全考虑

### 10.1 输入验证
- **参数校验**: 严格的输入参数验证
- **路径安全**: 防止路径遍历攻击
- **命令注入**: 防止命令注入攻击

### 10.2 资源限制
- **文件大小**: 限制模板文件大小
- **操作超时**: 防止长时间阻塞
- **并发限制**: 控制并发操作数量

## 11. 未来规划

### 11.1 功能增强
- **可视化配置**: Web UI 配置界面
- **模板市场**: 社区模板分享平台
- **智能推荐**: 基于使用历史的模板推荐

### 11.2 技术升级
- **微服务架构**: 拆分为独立的微服务
- **容器化部署**: Docker 容器化支持
- **云原生**: Kubernetes 部署支持