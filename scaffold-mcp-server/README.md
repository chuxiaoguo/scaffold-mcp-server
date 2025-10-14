# Scaffold MCP Server

一个基于 Model Context Protocol (MCP) 的项目脚手架生成服务器，支持快速创建现代化的前端项目。

## 功能特性

- 🚀 支持多种前端框架 (React, Vue, Angular)
- ⚡ 支持多种构建工具 (Webpack, Vite, Rollup)
- 🎨 支持多种 UI 库 (Ant Design, Element Plus, Material-UI)
- 📦 支持多种状态管理 (Redux, Pinia, Vuex, MobX)
- 🛠️ 自动生成项目结构和配置文件
- 🔧 集成常用开发工具配置
- 📝 完整的 TypeScript 支持
- 🎯 预配置的测试环境

## 可用模板

### React + TypeScript + Webpack
- React 19.2.0 + TypeScript
- Ant Design UI 组件库
- Redux Toolkit 状态管理
- React Router 路由管理
- Tailwind CSS 样式框架
- Jest + Testing Library 测试配置

### Vue 3 + TypeScript + Vite
- Vue 3.5.22 + TypeScript
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Tailwind CSS 样式框架
- Vite 快速构建工具

## 安装

```bash
npm install
```

## 构建

```bash
npm run build
```

## 使用

启动 MCP 服务器后，可以通过 MCP 客户端调用 `generateScaffold` 工具来生成项目脚手架。

### 参数

- `project_name`: 项目名称
- `tech_stack`: 技术栈配置对象

### 示例

**React 项目：**
```json
{
  "project_name": "my-react-app",
  "tech_stack": {
    "framework": "react",
    "language": "typescript",
    "builder": "webpack",
    "ui": "antd",
    "state": "redux",
    "router": "react-router"
  }
}
```

**Vue 项目：**
```json
{
  "project_name": "my-vue-app",
  "tech_stack": {
    "framework": "vue",
    "language": "typescript",
    "builder": "umi",
    "ui": "element-plus",
    "state": "dva",
    "router": "umi-router"
  }
}
```

## 测试

项目包含了完整的测试脚本，可以验证模板生成功能：

```bash
cd test-templates
node test-scaffold.js
```

## 文档

详细的使用指南请参考 [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md)。