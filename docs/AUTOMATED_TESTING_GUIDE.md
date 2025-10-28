# 自动化场景测试指南

## 测试脚本说明

我们提供了两个自动化测试脚本来验证所有场景：

### 1. 完整测试脚本 (推荐用于 CI/CD)

**文件**: `test-all-scenarios-complete.js`

**功能**:
- ✅ 项目生成
- ✅ 文件完整性检查
- ✅ 依赖安装
- ✅ 项目构建
- ✅ 开发服务器启动测试

**使用方法**:
```bash
node test-all-scenarios-complete.js
```

**特点**:
- 全面测试所有环节
- 自动清理旧项目
- 详细的日志输出
- 彩色终端显示
- 生成完整测试报告

**预计耗时**: 15-25 分钟（取决于网络速度）

---

### 2. 快速测试脚本 (推荐用于日常开发)

**文件**: `test-scenarios-quick.js`

**功能**:
- ✅ 项目生成
- ✅ 依赖安装
- ✅ 项目构建

**使用方法**:
```bash
node test-scenarios-quick.js
```

**特点**:
- 跳过 dev server 测试（避免端口冲突和超时）
- 快速验证核心功能
- 简洁的输出
- 适合频繁测试

**预计耗时**: 8-15 分钟（取决于网络速度）

---

## 测试场景列表

### 场景 1: Vue3 + Vite + JavaScript + Element Plus
```
技术栈: vue3 + vite + javascript + element-plus
项目名: test-s1-vue3-vite-js
```

**测试点**:
- NpmrcInjector 注入
- Vue3Injector 生成
- ViteInjector 配置
- ElementPlusInjector UI库
- JavaScript (非 TypeScript)

---

### 场景 2: Vue3 + Webpack + Element Plus
```
技术栈: vue3 + webpack + element-plus
项目名: test-s2-vue3-webpack
```

**测试点**:
- NpmrcInjector 注入
- Vue3Injector 生成
- WebpackInjector 配置
- ElementPlusInjector UI库
- TypeScript 默认配置

---

### 场景 3: Vue3 + Webpack + TypeScript + 全家桶
```
技术栈: vue3 + webpack + typescript + element-plus + eslint + prettier + pinia + vue-router
项目名: test-s3-vue3-full
```

**测试点**:
- NpmrcInjector 注入
- TypeScriptInjector 配置
- Vue3Injector 生成
- WebpackInjector 配置
- ElementPlusInjector UI库
- **PiniaInjector 状态管理** ⭐ 新增
- **VueRouterInjector 路由** ⭐ 新增
- ESLintInjector 代码检查
- PrettierInjector 代码格式化

**关键文件**:
- `src/stores/counter.ts` - Pinia store
- `src/router/index.ts` - Vue Router 配置
- `.eslintrc.cjs` - ESLint 配置
- `.prettierrc` - Prettier 配置

---

### 场景 4: React + Vite + TypeScript + Redux + Router
```
技术栈: react + vite + typescript + redux + react-router
项目名: test-s4-react-full
```

**测试点**:
- NpmrcInjector 注入
- TypeScriptInjector 配置
- ReactInjector 生成
- ViteInjector 配置
- **ReduxInjector 状态管理** ⭐ 新增
- **ReactRouterInjector 路由** ⭐ 新增

**关键文件**:
- `src/store/index.ts` - Redux store 配置
- `src/store/counterSlice.ts` - Redux slice
- `src/store/hooks.ts` - 类型化 hooks
- `src/routes.tsx` - React Router 配置
- `src/pages/Home.tsx` - 首页组件

---

## 测试流程详解

### 阶段 1: 项目生成 ✅

调用 `generateScaffold()` API 生成项目：

```javascript
await generateScaffold({
  tech_stack: 'vue3 + vite + javascript + element-plus',
  project_name: 'test-project',
  project_path: '/path/to/workspace',
});
```

**验证点**:
- 项目目录已创建
- package.json 存在
- 核心文件齐全

---

### 阶段 2: 依赖安装 ✅

执行 npm install：

```bash
cd test-project
npm install --legacy-peer-deps
```

**验证点**:
- node_modules 目录已创建
- package-lock.json 生成
- 无安装错误

**使用阿里云镜像源**:
- 配置文件: `.npmrc`
- 镜像地址: `registry.npmmirror.com`
- 预计速度提升: 3-6 倍

---

### 阶段 3: 项目构建 ✅

执行构建命令：

```bash
npm run build
```

**验证点**:
- 构建成功，无错误
- dist 目录已创建
- 包含 index.html 和打包文件

**常见构建产物**:
- Vite: `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`
- Webpack: `dist/bundle.js`, `dist/index.html`

---

### 阶段 4: 开发服务器 (可选) ⚠️

启动开发服务器：

```bash
npm run dev
```

**验证点**:
- 服务器成功启动
- 监听正确端口
- 热更新工作正常

**注意**:
- 快速测试脚本跳过此步骤
- 完整测试脚本会自动检测端口冲突
- 超时时间: 30 秒

---

## 测试报告示例

### 成功示例

```
📊 测试报告
============================================================

✅ 场景 1: Vue3 + Vite + JS + Element Plus
   生成: ✅  安装: ✅  构建: ✅

✅ 场景 2: Vue3 + Webpack + Element Plus
   生成: ✅  安装: ✅  构建: ✅

✅ 场景 3: Vue3 + Webpack + TS + 全家桶
   生成: ✅  安装: ✅  构建: ✅

✅ 场景 4: React + Vite + TS + Redux + Router
   生成: ✅  安装: ✅  构建: ✅

────────────────────────────────────────────────────────────
总计: 4/4 通过 (100.0%)
耗时: 324.5 秒
────────────────────────────────────────────────────────────

🎉 所有场景测试通过！
```

### 失败示例

```
📊 测试报告
============================================================

✅ 场景 1: Vue3 + Vite + JS + Element Plus
   生成: ✅  安装: ✅  构建: ✅

❌ 场景 2: Vue3 + Webpack + Element Plus
   生成: ✅  安装: ✅  构建: ❌
   错误: Webpack compilation failed

────────────────────────────────────────────────────────────
总计: 1/4 通过 (25.0%)
耗时: 156.2 秒
────────────────────────────────────────────────────────────

⚠️  部分场景失败
```

---

## 常见问题

### Q1: 测试太慢怎么办？

**A**: 使用快速测试脚本：
```bash
node test-scenarios-quick.js
```

### Q2: 端口被占用怎么办？

**A**: 
- 完整测试脚本会自动跳过端口冲突的 dev 测试
- 或手动关闭占用端口的进程：
```bash
lsof -i :5173  # 查看占用进程
kill -9 <PID>  # 关闭进程
```

### Q3: 如何只测试某个场景？

**A**: 修改脚本中的 `scenarios` 数组，注释掉不需要的场景：
```javascript
const scenarios = [
  // 只测试场景 1
  scenarios[0],
];
```

### Q4: 依赖安装失败怎么办？

**A**: 检查：
1. 网络连接是否正常
2. `.npmrc` 是否正确配置
3. Node.js 版本是否符合要求 (>= 16.0.0)
4. 手动删除项目重新测试

### Q5: 如何调试失败的场景？

**A**: 
1. 保留失败的测试项目（不要清理）
2. 进入项目目录：
```bash
cd test-s2-vue3-webpack
```
3. 手动执行命令查看详细错误：
```bash
npm install --legacy-peer-deps
npm run build
```

---

## 性能优化建议

### 1. 使用 pnpm

如果安装了 pnpm，可以编辑脚本替换 npm：
```javascript
execSync('pnpm install', { ... })
```

### 2. 并行测试

可以修改脚本支持并行测试（需要注意资源消耗）：
```javascript
const results = await Promise.all(
  scenarios.map(s => testScenario(s))
);
```

### 3. 缓存依赖

多次测试时可以使用 npm cache：
```bash
npm cache verify
```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Test Scenarios
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm install
      
      - name: Build Project
        run: npm run build
      
      - name: Run Scenario Tests
        run: node test-scenarios-quick.js
```

### GitLab CI 示例

```yaml
test-scenarios:
  stage: test
  image: node:18
  script:
    - npm install
    - npm run build
    - node test-scenarios-quick.js
  artifacts:
    paths:
      - test-s*-*/dist
    expire_in: 1 week
```

---

## 测试清单

在发布新版本前，请确保：

- [ ] 所有 4 个场景测试通过
- [ ] 生成的项目结构正确
- [ ] 依赖安装无错误
- [ ] 构建成功，无警告
- [ ] 开发服务器正常启动
- [ ] 热更新工作正常
- [ ] TypeScript 编译通过
- [ ] ESLint 检查通过
- [ ] 生成的代码符合规范

---

## 总结

自动化测试脚本帮助我们：

✅ **快速验证** - 几分钟内测试所有场景  
✅ **全面覆盖** - 从生成到构建的完整流程  
✅ **及早发现问题** - 在发布前捕获错误  
✅ **提升信心** - 确保代码质量  
✅ **节省时间** - 自动化替代手动测试  

**推荐工作流**:
1. 开发时使用 `test-scenarios-quick.js` 快速验证
2. 发布前使用 `test-all-scenarios-complete.js` 全面测试
3. CI/CD 中集成自动化测试

---

**最后更新**: 2025-10-28  
**测试脚本版本**: 1.0.0  
**支持的场景数**: 4
