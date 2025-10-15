# Scaffold MCP Server

一个强大的 MCP (Model Context Protocol) 服务器，用于生成前端项目脚手架。支持 React、Vue、UmiJS、Electron 等多种模板。

## ✨ 特性

- 🚀 支持多种前端框架模板
- 📦 完整的项目结构生成
- 🔧 TypeScript 支持
- 🎨 现代化的构建工具配置
- 🔌 MCP 协议兼容
- 🛠️ 自动化配置脚本

## 📋 支持的模板

- **react-webpack-typescript** - React + Webpack + TypeScript
- **vue3-vite-typescript** - Vue 3 + Vite + TypeScript  
- **umijs** - UmiJS 框架
- **electron-vite-vue3** - Electron + Vite + Vue 3

## 🚀 快速开始

### 自动化配置（推荐）

使用我们提供的自动化脚本快速配置：

**macOS/Linux:**
```bash
git clone <repository-url>
cd scaffold-mcp-server
./scripts/setup-mcp.sh
```

**Windows:**
```cmd
git clone <repository-url>
cd scaffold-mcp-server
scripts\setup-mcp.bat
```

### 手动安装

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd scaffold-mcp-server
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **测试服务器**
   ```bash
   npm test
   ```

## 🔧 工具集成

本项目支持以下 AI 开发工具：

- **Cursor** - AI 代码编辑器
- **Trae AI** - 智能开发环境
- **Cline** - VS Code AI 助手
- **Claude Desktop** - Anthropic 桌面应用
- **Continue.dev** - VS Code AI 扩展
- **Aider** - AI 编程助手

详细配置说明请查看 [MCP 集成指南](./MCP_INTEGRATION_GUIDE.md)。

## 📖 使用方法

配置完成后，你可以在支持的工具中使用自然语言命令：

```
创建一个 React TypeScript 项目
生成 Vue 3 项目脚手架
使用 umijs 模板创建项目
```

## 🛠️ 开发

### 项目结构

```
scaffold-mcp-server/
├── src/                    # 源代码
│   ├── index.ts           # 主入口文件
│   ├── tools/             # MCP 工具实现
│   └── templates/         # 模板管理
├── scaffold-template/      # 项目模板
│   ├── react-webpack-typescript/
│   ├── vue3-vite-typescript/
│   ├── umijs/
│   └── electron-vite-vue3/
├── scripts/               # 配置脚本
│   ├── setup-mcp.sh      # Unix 配置脚本
│   └── setup-mcp.bat     # Windows 配置脚本
├── examples/              # 配置示例
└── test-templates/        # 测试文件
```

### 开发命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

## 🔍 故障排除

### 常见问题

1. **Node.js 版本要求**
   - 需要 Node.js >= 16.0.0

2. **构建失败**
   ```bash
   # 清理并重新安装
   rm -rf node_modules dist
   npm install
   npm run build
   ```

3. **MCP 服务器无响应**
   ```bash
   # 测试服务器
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
   ```

4. **模板生成失败**
   - 检查目标目录是否已存在
   - 确保有足够的磁盘空间
   - 验证文件权限

### 日志调试

设置环境变量启用详细日志：

```bash
export DEBUG=scaffold-mcp:*
node dist/index.js
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果你遇到问题或有建议，请：

1. 查看 [MCP 集成指南](./MCP_INTEGRATION_GUIDE.md)
2. 搜索现有的 Issues
3. 创建新的 Issue 描述问题

---

**享受使用 Scaffold MCP Server 创建项目的乐趣！** 🎉