# 完整场景测试计划

## 测试目标

确保以下4个场景能够完整通过 **生成 → 安装 → 开发 → 构建** 的完整流程：

1. ✅ Vue3 + Vite + JS + Element Plus
2. ⏳ Vue3 + Webpack + Element Plus  
3. ⏳ Vue3 + Webpack + TypeScript + Element Plus + ESLint + Prettier + Pinia + Vue Router
4. ⏳ React + Vite + TypeScript + Redux + Router

## 当前进度

### 1. Vue3 + Vite + JS + Element Plus ✅

**技术栈**: `vue3 + vite + javascript + element-plus`

**生成状态**: ✅ 成功
- 使用固定模板: `vue3-vite-typescript`
- 注入了 NpmrcInjector
- 生成文件数量: 24个

**安装状态**: ⏳ 进行中
```bash
cd test-vue3-vite-js
npm install --legacy-peer-deps
```

**待测试**:
- [ ] npm run dev
- [ ] npm run build

---

### 2. Vue3 + Webpack + Element Plus

**技术栈**: `vue3 + webpack + element-plus`

**预期问题**:
- 没有 Vue3 + Webpack 的固定模板
- 需要动态生成
- 需要确保 WebpackInjector 正确配置 Vue 3

**需要的注入器**:
- NpmrcInjector (✅ 已有)
- TypeScriptInjector (✅ 已有)
- Vue3Injector (✅ 已有)
- WebpackInjector (✅ 已有)
- ElementPlusInjector (✅ 已有)

**待验证**:
- [ ] 生成
- [ ] 安装
- [ ] 开发
- [ ] 构建

---

### 3. Vue3 + Webpack + TypeScript + 全家桶

**技术栈**: `vue3 + webpack + typescript + element-plus + eslint + prettier + pinia + vue-router`

**预期问题**:
- 需要同时支持多个工具
- ESLint 和 Prettier 配置可能冲突
- Pinia 和 Vue Router 需要正确集成

**需要的注入器**:
- NpmrcInjector (✅ 已有)
- TypeScriptInjector (✅ 已有)
- Vue3Injector (✅ 已有)
- WebpackInjector (✅ 已有)
- ElementPlusInjector (✅ 已有)
- ESLintInjector (✅ 已有)
- PrettierInjector (✅ 已有)
- PiniaInjector (❌ 缺失)
- VueRouterInjector (❌ 缺失)

**缺失的注入器**:
- **PiniaInjector** - Vue 3 状态管理
- **VueRouterInjector** - Vue 路由

---

### 4. React + Vite + TypeScript + Redux + Router

**技术栈**: `react + vite + typescript + redux + react-router`

**预期问题**:
- Redux 和 React Router 需要正确集成
- Redux Toolkit 的配置
- React Router v6 的配置

**需要的注入器**:
- NpmrcInjector (✅ 已有)
- TypeScriptInjector (✅ 已有)
- ReactInjector (✅ 已有)
- ViteInjector (✅ 已有)
- ReduxInjector (❌ 缺失)
- ReactRouterInjector (❌ 缺失)

**缺失的注入器**:
- **ReduxInjector** - Redux + Redux Toolkit
- **ReactRouterInjector** - React Router v6

---

## 需要实现的注入器

### 1. PiniaInjector (Priority: 55)

**功能**:
- 安装 `pinia` 依赖
- 在 main.ts 中注册 Pinia
- 创建示例 store

**代码示例**:
```typescript
// src/stores/index.ts
import { createPinia } from 'pinia'
export const pinia = createPinia()

// src/main.ts
import { pinia } from './stores'
app.use(pinia)
```

---

### 2. VueRouterInjector (Priority: 55)

**功能**:
- 安装 `vue-router` 依赖
- 创建路由配置文件
- 在 main.ts 中注册路由
- 更新 App.vue 使用 `<router-view>`

**代码示例**:
```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home }
  ]
})

export default router

// src/main.ts
import router from './router'
app.use(router)
```

---

### 3. ReduxInjector (Priority: 55)

**功能**:
- 安装 `@reduxjs/toolkit` 和 `react-redux`
- 创建 store 配置
- 创建示例 slice
- 在 main.tsx 中使用 Provider

**代码示例**:
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// src/main.tsx
import { Provider } from 'react-redux'
import { store } from './store'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

---

### 4. ReactRouterInjector (Priority: 55)

**功能**:
- 安装 `react-router-dom`
- 创建路由配置
- 更新 App.tsx 使用 BrowserRouter
- 创建示例页面组件

**代码示例**:
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 实施计划

### 阶段 1: 测试现有功能 ✅

1. ✅ 完成 NpmrcInjector 实现
2. ⏳ 测试 Vue3 + Vite + JS + Element Plus
   - ⏳ 安装依赖
   - ⏳ 运行 dev
   - ⏳ 运行 build

### 阶段 2: 实现缺失的路由和状态管理注入器

1. **PiniaInjector** (Vue 3 状态管理)
   - 优先级: 55 (在 UI 库之后)
   - 分类: State Management

2. **VueRouterInjector** (Vue 路由)
   - 优先级: 55 (在 UI 库之后)
   - 分类: Routing

3. **ReduxInjector** (React 状态管理)
   - 优先级: 55
   - 分类: State Management

4. **ReactRouterInjector** (React 路由)
   - 优先级: 55
   - 分类: Routing

### 阶段 3: 完整测试所有场景

使用自动化测试脚本 `test-all-scenarios.js` 进行完整测试：

```bash
node test-all-scenarios.js
```

测试项：
- [ ] Vue3 + Vite + JS + Element Plus
- [ ] Vue3 + Webpack + Element Plus
- [ ] Vue3 + Webpack + TypeScript + 全家桶
- [ ] React + Vite + TypeScript + Redux + Router

---

## 注入器优先级规划

```
5  - NpmrcInjector (包管理器配置) ✅
10 - TypeScriptInjector (语言) ✅
20 - Vue3Injector, ReactInjector (框架) ✅
30 - ViteInjector, WebpackInjector (构建) ✅
40 - TailwindInjector, SassInjector, LessInjector (样式) ✅
50 - ElementPlusInjector, AntdInjector (UI库) ✅
55 - PiniaInjector, VueRouterInjector, ReduxInjector, ReactRouterInjector (路由/状态) ⏳
60 - ESLintInjector, PrettierInjector (代码质量) ✅
70 - JestInjector, VitestInjector (测试) ✅
80 - HuskyInjector, CommitlintInjector, LintStagedInjector (Git工具) ✅
```

---

## 当前注入器统计

- **已实现**: 21 个
- **待实现**: 4 个 (Pinia, VueRouter, Redux, ReactRouter)
- **总计**: 25 个

---

## 下一步行动

1. ⏳ **等待当前测试完成** - Vue3 + Vite + JS + Element Plus 的安装和构建
2. ⏳ **实现 PiniaInjector** - 支持 Vue 3 状态管理
3. ⏳ **实现 VueRouterInjector** - 支持 Vue 路由
4. ⏳ **实现 ReduxInjector** - 支持 React 状态管理
5. ⏳ **实现 ReactRouterInjector** - 支持 React 路由
6. ⏳ **运行完整测试** - 所有 4 个场景
7. ⏳ **修复发现的问题** - 确保所有场景通过

---

## 测试脚本

### 快速测试单个场景
```bash
node test-quick.js
```

### 完整测试所有场景
```bash
node test-all-scenarios.js
```

### 手动测试流程
```bash
# 1. 生成项目
node test-quick.js

# 2. 安装依赖
cd test-vue3-vite-js
npm install --legacy-peer-deps

# 3. 开发模式
npm run dev

# 4. 构建
npm run build
```

---

## 预期结果

所有 4 个场景都应该能够：

✅ **生成** - 成功创建项目文件  
✅ **安装** - 无错误安装所有依赖  
✅ **开发** - dev 服务器正常启动  
✅ **构建** - 成功生成生产构建产物  

**最终目标**: 4/4 场景全部通过 ✅✅✅✅
