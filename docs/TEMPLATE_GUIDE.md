# 模板使用指南

## 概述

本 MCP 服务器提供了多种现代化的前端项目模板，支持快速创建不同技术栈的项目。

## 可用模板

### 1. React + TypeScript + Webpack 模板 (`react-webpack-typescript`)

**技术栈：**
- React 19.2.0
- TypeScript 4.9.5
- Webpack (通过 react-scripts)
- Ant Design 5.27.5
- Redux Toolkit 2.9.0
- React Router DOM 7.9.4
- Tailwind CSS 4.1.14

**特性：**
- 完整的 React 项目结构
- TypeScript 类型支持
- Ant Design UI 组件库
- Redux 状态管理
- React Router 路由管理
- Tailwind CSS 样式框架
- 单元测试配置 (Jest + Testing Library)

**项目结构：**
```
project-name/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── store/
│   │   ├── index.ts
│   │   └── counterSlice.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

### 2. Vue 3 + TypeScript + Vite 模板 (`umijs`)

**技术栈：**
- Vue 3.5.22
- TypeScript 5.9.3
- Vite 7.1.7
- Element Plus 2.11.4
- Pinia 3.0.3
- Vue Router 4.6.0
- Tailwind CSS 4.1.14

**特性：**
- 现代化的 Vue 3 Composition API
- TypeScript 完整支持
- Vite 快速构建工具
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理
- 自动导入配置
- Tailwind CSS 样式框架

**项目结构：**
```
project-name/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── vue.svg
│   ├── components/
│   │   └── HelloWorld.vue
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   └── counter.ts
│   ├── views/
│   │   ├── Home.vue
│   │   └── About.vue
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 使用方法

### 通过 MCP 客户端使用

1. 确保 MCP 服务器正在运行
2. 调用 `generateScaffold` 工具
3. 提供以下参数：
   - `project_name`: 项目名称
   - `tech_stack`: 技术栈配置对象

**示例配置：**

React 项目：
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

Vue 项目：
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

### 直接运行测试

项目包含了测试脚本，可以直接验证模板生成功能：

```bash
cd test-templates
node test-scaffold.js
```

## 模板特点

### 开发体验优化
- 所有模板都配置了 TypeScript，提供完整的类型支持
- 使用现代化的构建工具（Webpack/Vite）
- 集成了热重载开发服务器
- 预配置了代码格式化和 linting

### UI 组件库
- React 模板使用 Ant Design，提供丰富的企业级组件
- Vue 模板使用 Element Plus，提供完整的 Vue 3 组件生态

### 状态管理
- React 模板集成 Redux Toolkit，简化状态管理
- Vue 模板使用 Pinia，提供现代化的 Vue 状态管理

### 样式解决方案
- 所有模板都集成了 Tailwind CSS
- 支持响应式设计
- 提供实用的 CSS 类库

### 路由管理
- React 模板使用 React Router DOM v7
- Vue 模板使用 Vue Router v4
- 预配置了基本的路由结构

## 项目启动

生成项目后，进入项目目录并安装依赖：

```bash
cd your-project-name
npm install
```

启动开发服务器：

```bash
# React 项目
npm start

# Vue 项目
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 自定义模板

如需添加新的模板，请在 `scaffold-template` 目录下创建新的模板文件夹，并确保包含完整的项目结构和 `package.json` 文件。

## 故障排除

### 常见问题

1. **模板生成失败**
   - 检查模板目录是否存在
   - 确保有足够的磁盘空间
   - 验证项目名称是否符合 npm 包命名规范

2. **依赖安装失败**
   - 检查网络连接
   - 尝试使用不同的包管理器 (npm/yarn/pnpm)
   - 清理缓存后重试

3. **TypeScript 编译错误**
   - 确保使用了正确的 TypeScript 版本
   - 检查 tsconfig.json 配置
   - 验证所有依赖的类型定义

## 贡献

欢迎提交 Issue 和 Pull Request 来改进模板质量和添加新的模板类型。