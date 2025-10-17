# Scaffold MCP Server 项目结构设计

## 项目概览

Scaffold MCP Server 是一个基于 Model Context Protocol (MCP) 的前端项目脚手架生成器，采用模块化架构设计，支持多种技术栈的项目模板生成。

## 目录结构

```
scaffold-mcp-server/
├── src/                           # 源代码目录
│   ├── index.ts                   # MCP服务器入口文件
│   ├── types/                     # 类型定义
│   │   └── index.ts              # 统一类型导出
│   ├── core/                      # 核心业务逻辑
│   │   ├── config/               # 配置管理
│   │   │   └── templateConfigManager.ts
│   │   ├── injectors/            # 工具注入器（已清理）
│   │   │   └── index.ts         # 注入器管理器
│   │   ├── nonFixedBuilder/      # 动态构建器
│   │   │   ├── index.ts         # 构建器工厂
│   │   │   ├── viteBuilder.ts   # Vite构建器
│   │   │   ├── webpackBuilder.ts # Webpack构建器
│   │   │   ├── electronViteBuilder.ts # Electron+Vite构建器
│   │   │   └── umiBuilder.ts    # UmiJS构建器
│   │   ├── intentRecognizer.ts   # 意图识别器
│   │   ├── matcher.ts           # 模板匹配器
│   │   └── templateGenerator.ts  # 模板生成器
│   └── tools/                    # 工具函数
│       ├── generateScaffold.ts  # 脚手架生成主函数
│       ├── projectGenerator.ts  # 项目生成器
│       ├── techStackParser.ts   # 技术栈解析器
│       ├── templateDownloader.ts # 模板下载器
│       └── fileOperations.ts    # 文件操作工具
├── scaffold-template/            # 本地模板库
│   ├── templates.config.json    # 模板配置索引
│   ├── vue3-vite-typescript/    # Vue3+Vite+TS模板
│   ├── react-webpack-typescript/ # React+Webpack+TS模板
│   ├── electron-vite-vue3/      # Electron+Vite+Vue3模板
│   └── umijs/                   # UmiJS模板
├── examples/                     # 配置示例
│   ├── claude-desktop-config.json
│   ├── cursor-config.json
│   ├── trae-ai-config.json
│   └── vscode-settings.json
├── scripts/                      # 脚本文件
│   ├── setup-mcp.sh
│   └── setup-mcp.bat
├── package.json                  # 项目依赖配置
├── tsconfig.json                # TypeScript配置
└── README.md                    # 项目说明文档
```

## 核心模块详解

### 1. 入口模块 (`src/index.ts`)

**职责**: MCP服务器的启动入口
- 初始化MCP服务器
- 注册工具函数 (`generateScaffold`)
- 配置服务器传输协议
- 错误处理和日志记录

**关键组件**:
- `ScaffoldMCPServer` 类
- MCP工具注册
- 服务器生命周期管理

### 2. 类型定义 (`src/types/`)

**职责**: 统一的类型定义和接口规范

**核心类型**:
- `TechStack`: 技术栈配置接口
- `GenerateOptions`: 生成选项配置
- `GenerateScaffoldParams`: 脚手架生成参数
- `GenerateResult`: 生成结果接口
- `TemplateConfig`: 模板配置接口
- `UnifiedTemplateInfo`: 统一模板信息接口
- `TemplatesConfigIndex`: 模板配置索引

### 3. 核心业务逻辑 (`src/core/`)

#### 3.1 配置管理 (`config/`)

**templateConfigManager.ts**:
- 三级配置加载策略（本地 → 缓存 → 远程）
- 内存缓存机制（30分钟刷新）
- 异步配置更新
- 错误处理和降级策略

#### 3.2 注入器系统 (`injectors/`)

**设计状态**: 已简化，移除所有具体注入器
- `ToolInjectorManager`: 注入器管理器（保留框架）
- 支持未来扩展各种开发工具注入

#### 3.3 动态构建器 (`nonFixedBuilder/`)

**NonFixedBuilder**: 构建器工厂模式
- `ViteBuilder`: Vite项目构建
- `WebpackBuilder`: Webpack项目构建  
- `ElectronViteBuilder`: Electron应用构建
- `UmiBuilder`: UmiJS项目构建

**特性**:
- 支持Vue3/React框架
- 自动配置构建工具
- 生成项目文件结构
- 依赖管理

#### 3.4 智能识别 (`intentRecognizer.ts`)

**IntentRecognizer**: 技术栈意图识别
- 模板兼容性规则匹配
- 冲突检测机制
- 置信度评分
- 推荐算法

#### 3.5 模板匹配 (`matcher.ts`)

**核心功能**:
- 技术栈解析和标准化
- 智能模板匹配
- 别名映射处理
- 配置驱动的匹配逻辑

#### 3.6 模板生成 (`templateGenerator.ts`)

**TemplateGenerator**: 模板生成引擎
- 固定模板配置
- 缓存机制
- 后处理流程
- 依赖安装

### 4. 工具函数 (`src/tools/`)

#### 4.1 脚手架生成 (`generateScaffold.ts`)

**主要功能**:
- 统一的脚手架生成入口
- 文件计数和统计
- 结果格式化
- 错误处理

#### 4.2 项目生成 (`projectGenerator.ts`)

**核心功能**:
- 固定模板匹配
- 额外工具注入
- 非固定模板生成
- 项目文件创建

#### 4.3 技术栈解析 (`techStackParser.ts`)

**解析功能**:
- 字符串/数组输入解析
- 技术栈标准化
- 构建工具映射
- 默认值填充

#### 4.4 模板下载 (`templateDownloader.ts`)

**下载策略**:
- Git Sparse-Checkout（优先）
- Degit降级方案
- 超时控制（30秒）
- 临时目录管理

#### 4.5 文件操作 (`fileOperations.ts`)

**文件管理**:
- 项目文件创建
- 依赖安装（npm/yarn）
- 目录遍历
- 跳过规则过滤

## 模板库结构 (`scaffold-template/`)

### 模板配置 (`templates.config.json`)

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-01T00:00:00Z",
  "templates": {
    "vue3-vite-typescript": {
      "name": "vue3-vite-typescript",
      "description": "Vue 3 + Vite + TypeScript",
      "matching": {
        "core": {
          "framework": ["vue3", "vue"],
          "builder": ["vite"]
        }
      }
    }
  }
}
```

### 模板目录结构

每个模板目录包含：
- 完整的项目文件结构
- `package.json` 依赖配置
- 构建配置文件
- 源代码示例
- 配置文件模板

## 数据流设计

### 1. 脚手架生成流程

```
用户输入 → 技术栈解析 → 意图识别 → 模板匹配 → 项目生成 → 文件输出
```

### 2. 模板匹配流程

```
输入解析 → 别名映射 → 兼容性检查 → 冲突检测 → 置信度评分 → 模板选择
```

### 3. 配置加载流程

```
内存缓存 → 本地配置 → 缓存文件 → 远程配置 → 降级处理
```

## 扩展性设计

### 1. 新增模板

1. 在 `scaffold-template/` 添加模板目录
2. 更新 `templates.config.json` 配置
3. 配置匹配规则和优先级

### 2. 新增构建器

1. 在 `nonFixedBuilder/` 实现 `IBuilder` 接口
2. 在 `NonFixedBuilder` 工厂中注册
3. 添加对应的技术栈支持

### 3. 新增工具注入器

1. 实现 `IToolInjector` 接口
2. 在 `ToolInjectorManager` 中注册
3. 配置注入规则和依赖

## 性能优化

### 1. 缓存策略

- **内存缓存**: 模板配置30分钟缓存
- **文件缓存**: 远程配置本地缓存
- **模板缓存**: 生成的模板临时缓存

### 2. 异步处理

- 配置加载异步化
- 模板下载并发处理
- 文件操作流式处理

### 3. 资源管理

- 临时目录自动清理
- 下载超时控制
- 内存使用优化

## 安全考虑

### 1. 输入验证

- 技术栈参数验证
- 项目名称安全检查
- 路径遍历防护

### 2. 文件安全

- 模板文件白名单
- 危险文件类型过滤
- 权限控制

### 3. 网络安全

- HTTPS强制使用
- 下载源验证
- 超时和重试机制

## 维护性设计

### 1. 日志系统

- 详细的操作日志
- 错误追踪机制
- 性能监控

### 2. 错误处理

- 分层错误处理
- 优雅降级
- 用户友好的错误信息

### 3. 测试覆盖

- 单元测试
- 集成测试
- 端到端测试

## 总结

Scaffold MCP Server 采用模块化、可扩展的架构设计，通过清晰的职责分离和标准化的接口设计，实现了高效、可靠的前端项目脚手架生成服务。项目结构清晰，易于维护和扩展，为不同技术栈的项目生成提供了统一的解决方案。