# MCP 脚手架服务技术方案

## 问题分析

### 当前问题
1. **模板匹配不准确**：Vue2 + webpack 请求被匹配到 electron-vite-vue3 模板
2. **技术栈强制转换**：element-ui 被自动转换为 element-plus
3. **动态模板功能不完整**：缺少 webpack 配置、UI 库集成、样式框架集成

### 根本原因
1. 智能匹配算法权重设计不合理
2. 技术栈解析器存在强制转换逻辑
3. 动态模板生成器功能不完整，缺少工具注入机制

## 技术方案

### 方案一：完善动态模板生成系统（推荐）

#### 1. 增强动态模板生成器
- **目标**：让动态模板生成器支持完整的技术栈配置
- **实现**：
  - 添加 webpack 配置文件生成
  - 集成 UI 库（element-ui/element-plus）
  - 集成样式框架（tailwindcss）
  - 支持构建工具配置注入

#### 2. 改进工具注入系统
- **目标**：统一工具注入机制，支持构建工具和UI库
- **实现**：
  - 扩展 ToolInjectorManager 支持更多工具类型
  - 添加 WebpackInjector
  - 添加 ElementUIInjector
  - 改进 TailwindCSSInjector

#### 3. 优化技术栈解析器
- **目标**：移除不合理的强制转换，保持用户原始意图
- **实现**：
  - 移除 element-ui -> element-plus 的强制转换
  - 添加版本兼容性检查
  - 支持用户显式指定技术栈版本

### 方案二：改进智能匹配算法

#### 1. 优化匹配权重
- **目标**：提高匹配准确性
- **实现**：
  - 调整核心技术栈权重
  - 降低可选字段权重
  - 添加冲突检测机制

#### 2. 添加 Vue2 固定模板
- **目标**：为常用技术栈组合提供专门模板
- **实现**：
  - 创建 vue2-webpack-typescript 模板
  - 创建 vue2-vite-typescript 模板

## 实施计划

### 阶段一：核心问题修复（高优先级）
1. 修复技术栈解析器的强制转换问题
2. 完善动态模板生成器的 webpack 支持
3. 添加 element-ui 集成逻辑

### 阶段二：工具注入系统增强（中优先级）
1. 扩展 ToolInjectorManager
2. 实现 WebpackInjector
3. 实现 ElementUIInjector
4. 改进 TailwindCSSInjector

### 阶段三：智能匹配优化（低优先级）
1. 调整匹配算法权重
2. 添加更多固定模板
3. 改进冲突检测

## 技术细节

### WebpackInjector 设计
```typescript
class WebpackInjector implements ToolInjector {
  inject(project: ProjectStructure, techStack: TechStack): void {
    // 添加 webpack 相关依赖
    // 生成 webpack.config.js
    // 配置构建脚本
  }
}
```

### ElementUIInjector 设计
```typescript
class ElementUIInjector implements ToolInjector {
  inject(project: ProjectStructure, techStack: TechStack): void {
    // 根据 Vue 版本选择 element-ui 或 element-plus
    // 添加相关依赖和配置
    // 生成样式导入
  }
}
```

### 技术栈解析器改进
```typescript
// 移除强制转换，保持用户原始意图
function parseTechStack(input: string[]): TechStack {
  // 不再强制转换 element-ui -> element-plus
  // 支持版本兼容性检查
  // 保持用户显式指定的技术栈
}
```

## 预期效果

1. **准确的技术栈支持**：用户指定什么技术栈就生成什么
2. **完整的项目配置**：包含所有必要的配置文件和依赖
3. **灵活的扩展性**：易于添加新的技术栈组合支持
4. **向后兼容性**：不影响现有模板的正常使用

## 风险评估

### 低风险
- 技术栈解析器修改：影响范围明确，易于测试
- 动态模板生成器增强：独立模块，不影响固定模板

### 中风险
- 工具注入系统重构：需要充分测试各种技术栈组合

### 缓解措施
- 分阶段实施，每个阶段充分测试
- 保持向后兼容性
- 添加详细的单元测试和集成测试