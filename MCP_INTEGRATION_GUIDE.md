# MCP 集成配置指南

本文档详细介绍如何在各种 AI 开发工具中配置和使用 Scaffold MCP Server。

## 📋 目录

- [概述](#概述)
- [前置要求](#前置要求)
- [自动化配置](#自动化配置)
- [Cursor 集成](#cursor-集成)
- [Trae AI 集成](#trae-ai-集成)
- [Cline 集成](#cline-集成)
- [Claude Desktop 集成](#claude-desktop-集成)
- [其他工具集成](#其他工具集成)
- [故障排除](#故障排除)

## 🎯 概述

Scaffold MCP Server 是一个基于 Model Context Protocol (MCP) 的项目脚手架生成服务器，支持多种前端技术栈的快速项目初始化。

### 支持的模板

- **React + TypeScript + Webpack** - 现代化 React 应用
- **Vue 3 + TypeScript + Vite** - 高性能 Vue 3 应用
- **UmiJS** - 企业级前端应用框架
- **Electron + Vite + Vue 3** - 跨平台桌面应用

## ⚙️ 前置要求

1. **Node.js** >= 16.0.0
2. **npm** 或 **yarn** 包管理器
3. 已构建的 Scaffold MCP Server

### 构建服务器

```bash
# 克隆项目
git clone https://github.com/chuxiaoguo/scaffold-mcp-server.git
cd scaffold-mcp-server

# 安装依赖
npm install

# 构建项目
npm run build
```

## 🚀 自动化配置

我们提供了自动化配置脚本，可以快速配置多个工具：

### 使用自动化脚本

**macOS/Linux:**
```bash
# 进入项目目录
cd scaffold-mcp-server

# 运行配置脚本
./scripts/setup-mcp.sh
```

**Windows:**
```cmd
# 进入项目目录
cd scaffold-mcp-server

# 运行配置脚本
scripts\setup-mcp.bat
```

### 配置选项

脚本提供以下选项：
1. **全部配置** - 配置所有支持的工具
2. **仅 Cursor** - 只配置 Cursor
3. **仅 Claude Desktop** - 只配置 Claude Desktop
4. **仅 VS Code Cline** - 只配置 VS Code 的 Cline 扩展
5. **仅构建项目** - 只构建项目，不配置工具
6. **退出** - 退出配置

### 配置示例文件

项目中包含了各种工具的配置示例文件，位于 `examples/` 目录：

- `cursor-config.json` - Cursor 配置示例
- `claude-desktop-config.json` - Claude Desktop 配置示例
- `vscode-settings.json` - VS Code Cline 配置示例
- `trae-ai-config.json` - Trae AI 配置示例

你可以参考这些文件手动配置工具。

## 🎯 Cursor 集成

Cursor 是一款 AI 驱动的代码编辑器，支持 MCP 协议。

### 配置步骤

1. **打开 Cursor 设置**
   - 按 `Cmd/Ctrl + ,` 打开设置
   - 搜索 "MCP" 或导航到 "Extensions" > "MCP"

2. **添加 MCP 服务器配置**

创建或编辑 Cursor 的 MCP 配置文件：

**macOS/Linux:**
```bash
~/.cursor/mcp_servers.json
```

**Windows:**
```bash
%APPDATA%\Cursor\mcp_servers.json
```

3. **配置内容**

```json
{
  "mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["/path/to/scaffold-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 使用方法

在 Cursor 中，你可以通过以下方式使用脚手架功能：

```
@scaffold-generator 创建一个 React TypeScript 项目，项目名称为 my-app
```

或者使用更具体的参数：

```
@scaffold-generator 使用 react-webpack-typescript 模板创建项目 my-react-app 到 ./projects 目录
```

## 🚀 Trae AI 集成

Trae AI 是一个强大的 AI 开发环境，原生支持 MCP 协议。

### 配置步骤

1. **打开 Trae AI 设置**
   - 点击设置图标或按快捷键
   - 导航到 "MCP Servers" 部分

2. **添加服务器配置**

```json
{
  "name": "Scaffold Generator",
  "command": "node",
  "args": ["/path/to/scaffold-mcp-server/dist/index.js"],
  "env": {
    "NODE_ENV": "production"
  },
  "description": "Frontend project scaffold generator"
}
```

3. **启用服务器**
   - 保存配置后，在 MCP 服务器列表中启用 "Scaffold Generator"
   - 重启 Trae AI 以加载配置

### 使用方法

在 Trae AI 的聊天界面中：

```
请帮我创建一个 Vue 3 项目，使用 TypeScript 和 Vite
```

或者直接调用工具：

```
使用 generateScaffold 工具创建：
- 技术栈：vue3-vite-typescript
- 项目名：my-vue-project
- 输出目录：./workspace
```

## 🔧 Cline 集成

Cline 是一个 VS Code 扩展，支持 MCP 服务器集成。

### 配置步骤

1. **安装 Cline 扩展**
   - 在 VS Code 中搜索并安装 "Cline" 扩展

2. **配置 MCP 服务器**

打开 VS Code 设置 (`Cmd/Ctrl + ,`)，搜索 "cline mcp"，或编辑 `settings.json`：

```json
{
  "cline.mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["/path/to/scaffold-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. **重启 VS Code**
   - 重启 VS Code 以加载新的 MCP 配置

### 使用方法

在 Cline 聊天面板中：

```
帮我生成一个 React 项目脚手架，包含 TypeScript 和 Webpack 配置
```

## 🖥️ Claude Desktop 集成

Claude Desktop 应用支持 MCP 服务器配置。

### 配置步骤

1. **找到配置文件**

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

2. **编辑配置文件**

```json
{
  "mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["/absolute/path/to/scaffold-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. **重启 Claude Desktop**

### 使用方法

在 Claude Desktop 中直接对话：

```
我需要创建一个新的前端项目，使用 Vue 3 + TypeScript + Vite 技术栈
```

## 🛠️ 其他工具集成

### Continue.dev

在 `~/.continue/config.json` 中添加：

```json
{
  "mcpServers": [
    {
      "name": "scaffold-generator",
      "command": "node",
      "args": ["/path/to/scaffold-mcp-server/dist/index.js"]
    }
  ]
}
```

### Aider

使用命令行参数启动：

```bash
aider --mcp-server "node /path/to/scaffold-mcp-server/dist/index.js"
```

### 自定义集成

对于支持 MCP 协议的其他工具，通常需要：

1. **指定命令**: `node`
2. **参数**: `["/path/to/scaffold-mcp-server/dist/index.js"]`
3. **工作目录**: 项目根目录
4. **环境变量**: `NODE_ENV=production`

## 🔍 故障排除

### 常见问题

#### 1. 服务器无法启动

**症状**: MCP 服务器连接失败

**解决方案**:
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 16.0.0

# 检查文件路径
ls -la /path/to/scaffold-mcp-server/dist/index.js

# 手动测试服务器
node /path/to/scaffold-mcp-server/dist/index.js
```

#### 2. 权限问题

**症状**: 无法执行脚本

**解决方案**:
```bash
# 给予执行权限
chmod +x /path/to/scaffold-mcp-server/dist/index.js

# 检查目录权限
ls -la /path/to/scaffold-mcp-server/
```

#### 3. 模板生成失败

**症状**: 项目创建失败或不完整

**解决方案**:
```bash
# 检查模板目录
ls -la /path/to/scaffold-mcp-server/../scaffold-template/

# 检查输出目录权限
mkdir -p /output/directory
chmod 755 /output/directory
```

#### 4. 依赖问题

**症状**: 模块找不到错误

**解决方案**:
```bash
# 重新安装依赖
cd /path/to/scaffold-mcp-server
npm install

# 重新构建
npm run build
```

### 调试模式

启用详细日志输出：

```json
{
  "command": "node",
  "args": ["/path/to/scaffold-mcp-server/dist/index.js"],
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "mcp:*"
  }
}
```

### 测试配置

使用测试脚本验证配置：

```bash
# 进入测试目录
cd /path/to/scaffold-mcp-server/../test-templates

# 运行测试
node test-scaffold.js
```

## 📞 获取帮助

如果遇到问题，可以：

1. **查看日志**: 检查工具的 MCP 服务器日志
2. **手动测试**: 直接运行服务器进行测试
3. **检查版本**: 确保所有依赖版本兼容
4. **提交 Issue**: 在 GitHub 仓库中报告问题

## 🔗 相关链接

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [项目 GitHub 仓库](https://github.com/chuxiaoguo/scaffold-mcp-server)
- [模板使用指南](./TEMPLATE_GUIDE.md)
- [API 文档](./README.md)

---

**注意**: 请将配置中的 `/path/to/scaffold-mcp-server` 替换为实际的绝对路径。