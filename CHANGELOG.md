# Changelog

所有重要的项目更改都会记录在此文件中。

## [1.1.16] - 2025-10-22

### Fixes
- 修复 ES 模块环境下 __dirname 变量不可用的问题
- 修复打包后配置文件路径不正确的问题
- 改进构建脚本以确保配置文件被正确复制到 dist 目录

## [1.1.15] - 2025-10-21

### Changes
- 6f78bd8 chore: bump version to 1.1.12
- b53d72c fix: resolve TailwindCSS v4 compatibility issues in templates
- d993941 fix: 完全修复 TailwindCSS v4 PostCSS 配置问题
- 3029c9d fix: 修复 vue3-vite-typescript 模板的 PostCSS 配置
- cabbc76 fix: 修复 vite 开发服务器 localhost 解析错误
- 0d17ce5 chore: release v1.1.11
- 46fdf25 feat: 添加项目架构文档和.npmrc配置
- c2ea300 1.1.10
- df13d98 Optimize template copying with dedicated script
- ecaac21 1.1.9

## [1.1.13] - 2025-10-21

### Changes
- 6f78bd8 chore: bump version to 1.1.12
- b53d72c fix: resolve TailwindCSS v4 compatibility issues in templates
- d993941 fix: 完全修复 TailwindCSS v4 PostCSS 配置问题
- 3029c9d fix: 修复 vue3-vite-typescript 模板的 PostCSS 配置
- cabbc76 fix: 修复 vite 开发服务器 localhost 解析错误
- 0d17ce5 chore: release v1.1.11
- 46fdf25 feat: 添加项目架构文档和.npmrc配置
- c2ea300 1.1.10
- df13d98 Optimize template copying with dedicated script
- ecaac21 1.1.9


## [1.1.11] - 2025-10-21

### Changes
- 46fdf25 feat: 添加项目架构文档和.npmrc配置
- c2ea300 1.1.10
- df13d98 Optimize template copying with dedicated script
- ecaac21 1.1.9
- 13eb96f Fix npx environment template path resolution
- ee29a88 1.1.8
- ac22a52 Add detailed debug logging for MCP server startup and connection
- fe6a1c3 chore: release v1.1.7
- 9fb7369 bump version to 1.1.6
- c226419 chore: release v1.1.5


## [1.1.7] - 2025-10-21

### Changes
- 9fb7369 bump version to 1.1.6
- c226419 chore: release v1.1.5
- 4a1f35d fix: add bundledDependencies to resolve MCP connection issues - v1.1.4
- 7181c84 chore: release v1.1.3
- 5d11fb3 fix: add executable permission to dist/index.js in build script
- 71c9d0f chore: release v1.1.2
- ec9afcf fix: add bin configuration for npx support
- 2578159 chore: release v1.1.1
- bc0205c 删除有问题的测试文件以修复发布流程
- 3c86ab2 feat: 添加自动化npm包发布脚本和完善项目配置


## [1.1.5] - 2025-10-21

### Changes
- 4a1f35d fix: add bundledDependencies to resolve MCP connection issues - v1.1.4
- 7181c84 chore: release v1.1.3
- 5d11fb3 fix: add executable permission to dist/index.js in build script
- 71c9d0f chore: release v1.1.2
- ec9afcf fix: add bin configuration for npx support
- 2578159 chore: release v1.1.1
- bc0205c 删除有问题的测试文件以修复发布流程
- 3c86ab2 feat: 添加自动化npm包发布脚本和完善项目配置
- 10b7fb6 Initial commit: Scaffold MCP Server with templates and npm package fixes


## [1.1.3] - 2025-10-20

### Changes
- 5d11fb3 fix: add executable permission to dist/index.js in build script
- 71c9d0f chore: release v1.1.2
- ec9afcf fix: add bin configuration for npx support
- 2578159 chore: release v1.1.1
- bc0205c 删除有问题的测试文件以修复发布流程
- 3c86ab2 feat: 添加自动化npm包发布脚本和完善项目配置
- 10b7fb6 Initial commit: Scaffold MCP Server with templates and npm package fixes


## [1.1.2] - 2025-10-20

### Changes
- ec9afcf fix: add bin configuration for npx support
- 2578159 chore: release v1.1.1
- bc0205c 删除有问题的测试文件以修复发布流程
- 3c86ab2 feat: 添加自动化npm包发布脚本和完善项目配置
- 10b7fb6 Initial commit: Scaffold MCP Server with templates and npm package fixes


## [1.1.1] - 2025-10-20

### Changes
- bc0205c 删除有问题的测试文件以修复发布流程
- 3c86ab2 feat: 添加自动化npm包发布脚本和完善项目配置
- 10b7fb6 Initial commit: Scaffold MCP Server with templates and npm package fixes


## [1.1.0] - 2025-10-20

### 📦 Other Changes

- Initial commit: Scaffold MCP Server with templates and npm package fixes



## [1.0.0] - 2024-12-30

### ✨ Features

- 初始版本发布
- 支持多种前端技术栈的脚手架生成
- 提供Vue3、React、UmiJS、Electron等模板
- 集成MCP (Model Context Protocol) 服务器
- 自动化发布脚本和版本管理

### 📚 Documentation

- 添加完整的README文档
- 提供模板使用指南
- 包含MCP集成说明

### 🔧 Chore

- 配置TypeScript构建环境
- 设置Jest测试框架
- 添加ESLint代码规范
- 配置npm发布流程