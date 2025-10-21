# 项目架构文档

本文档包含了 Scaffold MCP Server 项目的完整架构分析，从 `src/index.ts` 开始递归分析了所有关联节点，并生成了相应的流程图和架构图。

## 文档结构

### 1. [项目流程图](./project-flow-diagram.md)
详细描述了脚手架生成的完整流程，包括：
- 脚手架生成主流程
- 核心组件交互流程
- 模板匹配详细流程
- 项目生成详细流程

### 2. [项目架构图](./project-architecture-diagram.md)
从多个维度展示项目架构，包括：
- 整体架构概览
- 核心模块依赖关系
- 数据流架构
- 模块职责分层
- 插件系统架构

### 3. [依赖关系图](./dependency-graph.md)
展示从 `index.ts` 开始的完整依赖树，包括：
- 完整依赖树结构
- 核心模块详细依赖
- 模板系统依赖
- 匹配系统依赖
- 构建器系统依赖
- 工具注入系统依赖
- 插件系统依赖
- 外部依赖
- 配置文件依赖

### 4. [模块交互图](./module-interaction-diagram.md)
详细展示各模块间的交互关系，包括：
- 整体模块交互概览
- 模板匹配交互流程
- 项目生成交互流程
- 工具注入交互流程
- 构建器系统交互
- 模板管理系统交互
- 配置管理交互
- 错误处理交互
- 文件系统操作交互
- 插件系统交互

## 项目核心模块说明

### 入口模块 (`src/index.ts`)
- **ScaffoldMCPServer**: MCP 服务器主类
- 负责工具处理器设置和错误处理
- 集成所有核心功能模块

### 核心功能模块

#### 1. 脚手架生成器 (`tools/generateScaffold.ts`)
- 主要的脚手架生成逻辑
- 协调模板匹配、路径解析、项目生成等功能

#### 2. 智能匹配系统 (`core/matcher/`)
- **SmartMatcher**: 智能模板匹配
- **KeywordMatcher**: 关键词匹配
- **ScoreCalculator**: 评分计算
- **intentRecognizer**: 意图识别

#### 3. 模板管理系统 (`core/templateManager/`)
- **LocalManager**: 本地模板管理
- **VersionChecker**: 版本检查
- **RemoteFetcher**: 远程模板获取

#### 4. 构建器系统 (`core/nonFixedBuilder/`)
- **vue3Builder**: Vue3 项目构建器
- **reactBuilder**: React 项目构建器
- **umiBuilder**: UmiJS 项目构建器
- **electronBuilder**: Electron 项目构建器

#### 5. 工具注入系统 (`core/injectors/`)
- **eslintInjector**: ESLint 配置注入
- **prettierInjector**: Prettier 配置注入
- **jestInjector**: Jest 测试配置注入
- **huskyInjector**: Husky Git hooks 注入
- **stylelintInjector**: Stylelint 样式检查注入

#### 6. 插件系统 (`core/plugins/`)
- **PluginManager**: 插件管理
- **PluginIntegrator**: 插件集成
- **ConfigMerger**: 配置合并

### 工具模块

#### 1. 项目生成器 (`tools/projectGenerator.ts`)
- 固定模板和非固定模板的项目生成逻辑
- 文件复制和创建功能

#### 2. 路径解析器 (`tools/pathResolver.ts`)
- 项目路径解析和验证
- 路径信息获取

#### 3. 模板下载器 (`tools/templateDownloader.ts`)
- 模板下载和更新功能

### 配置和类型

#### 1. 配置管理 (`core/config/`)
- **templateConfigManager**: 模板配置管理

#### 2. 类型定义 (`types/index.ts`)
- 项目中使用的所有 TypeScript 类型定义

#### 3. 工具模式 (`config/toolSchemas.ts`)
- MCP 工具的 JSON Schema 定义

### 工具类

#### 1. 响应格式化器 (`utils/ResponseFormatter.ts`)
- 统一的响应格式化

#### 2. 错误处理器 (`utils/MCPErrorHandler.ts`)
- MCP 错误处理

#### 3. 消息模板 (`utils/MessageTemplates.ts`)
- 消息模板管理

## 技术栈

- **TypeScript**: 主要开发语言
- **Node.js**: 运行环境
- **@modelcontextprotocol/sdk**: MCP 协议实现
- **各种构建工具**: Vite, Webpack, UmiJS 等

## 架构特点

1. **模块化设计**: 各功能模块职责清晰，低耦合高内聚
2. **插件化架构**: 支持通过插件扩展功能
3. **智能匹配**: 基于关键词和评分的智能模板匹配
4. **多构建器支持**: 支持多种前端框架的项目构建
5. **工具注入**: 灵活的开发工具配置注入
6. **配置驱动**: 通过配置文件驱动模板和插件行为

## 使用说明

所有图表使用 Mermaid 语法编写，可以在支持 Mermaid 的 Markdown 查看器中查看，如：
- GitHub
- GitLab
- VS Code (with Mermaid extension)
- Typora
- 各种在线 Mermaid 编辑器

## 更新说明

本文档基于项目当前状态生成，如果项目结构发生变化，建议重新生成相应的架构图和流程图。