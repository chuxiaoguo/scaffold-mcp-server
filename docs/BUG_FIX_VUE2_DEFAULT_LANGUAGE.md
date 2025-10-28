# Vue 2 默认语言问题修复

## 问题描述

用户指定技术栈为 `vue2 + webpack + less + ant-design-vue`（不包含 typescript），但生成的项目却使用了 TypeScript + 装饰器语法，导致编译复杂度增加且容易出错。

## 根本原因

在 `src/core/matcher.ts` 的 `parseTechStack` 函数中，当用户没有明确指定语言时，**系统默认使用 TypeScript**：

```typescript
// ❌ 旧的实现（有问题）
if (!techStack.language) {
  techStack.language = "typescript";  // 所有项目都默认 TypeScript
}
```

这个策略对所有框架都一视同仁，但实际上：

- **Vue 2** 的主流用法是 **JavaScript**（简单、稳定、无需装饰器）
- **Vue 3** 和 **React** 更适合使用 **TypeScript**（现代化开发标准）

## 问题影响

使用 TypeScript + Vue 2 会导致：

1. **装饰器依赖**：需要 `vue-property-decorator`、`vue-class-component`
2. **配置复杂**：需要 `experimentalDecorators`、`emitDecoratorMetadata`
3. **webpack 配置**：ts-loader 需要 `appendTsSuffixTo` 选项
4. **学习成本高**：装饰器语法对新手不友好
5. **潜在错误**：类型定义和装饰器容易出错

## 修复方案

### 修改 matcher.ts

在 `src/core/matcher.ts` 中，根据框架智能选择默认语言：

```typescript
// ✅ 新的实现（正确）
if (!techStack.language) {
  // Vue 2 默认使用 JavaScript（更简单，避免装饰器复杂性）
  // Vue 3 和 React 默认使用 TypeScript（现代化开发）
  if (techStack.framework === "vue2") {
    techStack.language = "javascript";
  } else {
    techStack.language = "typescript";
  }
}
```

### 修改位置

**文件**: `/src/core/matcher.ts`  
**函数**: `parseTechStack()`  
**行数**: 约 117-125 行

## 验证步骤

1. **重新编译项目**：
```bash
cd /Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server
npm run build
```

2. **生成 Vue 2 测试项目**：
```bash
node test-generate.js
# 参数: tech_stack: 'vue2 + webpack + less + ant-design-vue'
```

3. **检查生成的文件**：
```bash
ls my-project/src/
# 应该看到: main.js (不是 main.ts)
# 应该看到: App.vue (不包含装饰器)
```

4. **安装依赖并编译**：
```bash
cd my-project
npm install --legacy-peer-deps
npm run build
```

## 验证结果

### 修复前

```typescript
// src/App.vue - 使用装饰器（复杂）
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class App extends Vue {
  title = 'my-project';
}
</script>
```

**问题**：
- 需要 TypeScript
- 需要装饰器
- 需要额外的类型定义
- 配置复杂

### 修复后

```javascript
// src/App.vue - 标准 Vue 2 语法（简单）
<script>
export default {
  name: 'App',
  data() {
    return {
      title: 'my-project'
    }
  }
}
</script>
```

**优势**：
- ✅ 使用 JavaScript（简单）
- ✅ 标准 Options API 语法
- ✅ 无需装饰器
- ✅ 配置简单
- ✅ 编译速度快

### 编译结果

```bash
> webpack --mode production

asset bundle.js 2.38 MiB [emitted] [minimized]
asset index.html 248 bytes [emitted]

webpack 5.102.1 compiled with 3 warnings in 10459 ms
```

✅ **编译成功！** 只有包大小警告（正常），没有任何错误。

## 生成的文件对比

### 修复前（TypeScript）

```
my-project/
├── src/
│   ├── main.ts           ← TypeScript
│   ├── App.vue           ← 装饰器语法
│   └── shims-vue.d.ts    ← 类型声明
├── tsconfig.json         ← TypeScript 配置
└── webpack.config.js     ← ts-loader + appendTsSuffixTo
```

### 修复后（JavaScript）

```
my-project/
├── src/
│   ├── main.js           ← JavaScript
│   └── App.vue           ← 标准语法
└── webpack.config.js     ← babel-loader
```

**文件减少**：不再需要 `tsconfig.json`、`shims-vue.d.ts` 等

## 技术栈默认语言规则

| 框架 | 默认语言 | 原因 |
|-----|---------|------|
| Vue 2 | **JavaScript** | 简单、稳定、社区主流用法 |
| Vue 3 | **TypeScript** | 现代化、类型安全、官方推荐 |
| React | **TypeScript** | 现代化、类型安全、行业标准 |

## 用户可以覆盖

如果用户确实想在 Vue 2 中使用 TypeScript，可以显式指定：

```javascript
tech_stack: 'vue2 + webpack + typescript + less + ant-design-vue'
//                           ^^^^^^^^^^^ 显式指定
```

## package.json 差异

### 修复前（TypeScript + 装饰器）

```json
{
  "devDependencies": {
    "vue": "^2.7.16",
    "typescript": "^5.3.3",
    "@types/vue": "^2.0.0",
    "vue-class-component": "^7.2.6",
    "vue-property-decorator": "^9.1.2",
    "ts-loader": "^9.5.1",
    "vue-loader": "^15.10.1"
  }
}
```

### 修复后（JavaScript）

```json
{
  "devDependencies": {
    "vue": "^2.7.16",
    "babel-loader": "^9.1.3",
    "@babel/core": "^7.23.6",
    "@babel/preset-env": "^7.23.6",
    "vue-loader": "^15.10.1"
  }
}
```

**依赖简化**：减少了 5 个 TypeScript 相关依赖

## webpack.config.js 差异

### 修复前（ts-loader）

```javascript
{
  test: /\.tsx?$/,
  loader: 'ts-loader',
  exclude: /node_modules/,
  options: {
    appendTsSuffixTo: [/\.vue$/]  // Vue 文件特殊处理
  }
}
```

### 修复后（babel-loader）

```javascript
{
  test: /\.jsx?$/,
  use: 'babel-loader',
  exclude: /node_modules/
}
```

**配置简化**：无需特殊选项

## 最佳实践建议

1. **Vue 2 项目默认使用 JavaScript**
   - 更符合社区习惯
   - 配置简单，易于维护
   - 性能更好（无需类型检查）

2. **确需 TypeScript 时显式指定**
   - 大型项目
   - 团队有 TS 经验
   - 需要严格的类型检查

3. **Vue 3 推荐使用 TypeScript**
   - 官方推荐
   - `<script setup>` + TS 体验更好
   - 类型推导更完善

## 相关问题修复

此修复解决了之前的系列问题：

1. ✅ [VueLoaderPlugin 缺失](./BUG_FIX_WEBPACK_VUE_LOADER.md) - 已修复
2. ✅ [vue-loader 版本不兼容](./BUG_FIX_VUE_LOADER_VERSION.md) - 已修复  
3. ✅ [TypeScript 配置问题](./BUG_FIX_TYPESCRIPT_CONFIG.md) - 已修复
4. ✅ **默认语言选择不合理** - 本次修复

## 影响范围

- ✅ Vue 2 项目现在默认使用 JavaScript
- ✅ Vue 3 项目继续使用 TypeScript（不受影响）
- ✅ React 项目继续使用 TypeScript（不受影响）
- ✅ 用户可以显式指定语言覆盖默认值

## 总结

这个修复让系统更加智能和贴近实际使用场景：

- **Vue 2**：简单为主，默认 JavaScript
- **Vue 3/React**：现代化为主，默认 TypeScript

这样可以：
1. 降低 Vue 2 项目的复杂度
2. 减少配置错误
3. 提升开发体验
4. 符合社区最佳实践

**修复时间**: 2025-10-28  
**修复状态**: ✅ 已验证通过
