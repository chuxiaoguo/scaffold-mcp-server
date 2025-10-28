# 统一注入器系统 (Unified Injector System)

## 概述

统一注入器系统是一个用于管理和执行项目工具注入的统一框架。它消除了"核心工具"与"额外工具"的人为区分，所有组件（语言、框架、构建工具、代码质量工具等）都采用统一的注入接口。

## 核心设计原则

### 1. 所有组件都是工具
- TypeScript、Vue3、ESLint、Prettier 等都是工具
- 不需要人为区分"核心"和"额外"
- 统一的注入接口和管理机制

### 2. 基于优先级的分层架构

```
优先级层次：
1. 语言层 (priority: 10)    → TypeScriptInjector, JavaScriptInjector
2. 框架层 (priority: 20)    → Vue3Injector, ReactInjector, UmiJSInjector
3. 构建层 (priority: 30)    → ViteInjector, WebpackInjector
4. 样式层 (priority: 40)    → TailwindInjector, SassInjector, LessInjector
5. UI库层 (priority: 50)    → ElementPlusInjector, AntdInjector, VuetifyInjector
6. 代码质量层 (priority: 60) → ESLintInjector, PrettierInjector, StylelintInjector
7. 测试层 (priority: 70)    → JestInjector, VitestInjector
8. Git工具层 (priority: 80)  → HuskyInjector, CommitlintInjector, LintStagedInjector
```

### 3. 依赖管理
- 自动处理工具之间的依赖关系
- 通过拓扑排序确保正确的执行顺序
- 检测并警告工具冲突

## 核心组件

### UnifiedInjector 接口

```typescript
interface UnifiedInjector {
  // 基础信息
  name: string;                    // 工具名称
  priority: number;                // 执行优先级
  category: InjectorCategory;      // 工具分类
  
  // 依赖管理
  dependencies?: string[];         // 依赖的其他工具
  conflicts?: string[];            // 冲突的工具
  
  // 执行方法
  canHandle(tools: string[]): boolean;
  inject(context: UnifiedInjectionContext): Promise<UnifiedInjectionResult>;
}
```

### AbstractUnifiedInjector 抽象基类

提供通用的工具方法：
- `mergeDependencies()` - 合并 package.json 依赖
- `mergeScripts()` - 合并 package.json 脚本
- `addFile()` - 添加文件
- `addLog()` - 添加日志
- `checkDependencies()` - 检查依赖是否满足
- `checkConflicts()` - 检查是否存在冲突

### UnifiedInjectorManager 管理器

负责：
- 注入器注册与发现
- 依赖关系解析（拓扑排序）
- 执行顺序编排
- 注入结果合并
- 冲突检测与处理

## 使用示例

### 1. 创建自定义注入器

```typescript
import { AbstractUnifiedInjector } from './AbstractUnifiedInjector.js';
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult
} from '../../../types/index.js';

export class MyToolInjector extends AbstractUnifiedInjector {
  name = 'my-tool';
  priority = InjectorPriority.CODE_QUALITY;
  category = InjectorCategory.CODE_QUALITY;
  
  override dependencies = ['typescript']; // 依赖 TypeScript
  override conflicts = ['other-tool'];    // 与 other-tool 冲突

  override canHandle(tools: string[]): boolean {
    return tools.some(tool => tool.toLowerCase() === 'my-tool');
  }

  override async inject(context: UnifiedInjectionContext): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, '开始注入 My Tool');

      // 添加依赖
      this.mergeDependencies(packageJson, {
        'my-tool': '^1.0.0'
      });

      // 添加配置文件
      this.addFile(files, '.mytoolrc.json', JSON.stringify({
        enabled: true
      }, null, 2));

      this.addLog(logs, 'My Tool 注入完成');

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `注入失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
```

### 2. 使用注入器管理器

```typescript
import { getUnifiedInjectorManager } from './InjectorRegistry.js';
import { UnifiedInjectionContext } from '../../../types/index.js';

// 获取全局注入器管理器
const manager = getUnifiedInjectorManager();

// 准备注入上下文
const context: UnifiedInjectionContext = {
  projectName: 'my-project',
  projectPath: '/path/to/project',
  files: {},
  packageJson: { name: 'my-project' },
  tools: ['vue3', 'vite', 'typescript', 'tailwind', 'element-plus', 'eslint'],
  framework: 'vue3',
  buildTool: 'vite',
  language: 'typescript',
  logs: []
};

// 执行统一注入
const result = await manager.injectAll(context);

if (result.success) {
  console.log('注入成功！');
  console.log('生成的文件:', Object.keys(result.files));
  console.log('依赖:', result.packageJson.dependencies);
} else {
  console.error('注入失败:', result.errors);
}
```

## 目录结构

```
src/core/injectors/unified/
├── AbstractUnifiedInjector.ts    # 抽象基类
├── UnifiedInjectorManager.ts     # 注入器管理器
├── InjectorRegistry.ts           # 注入器注册中心
├── index.ts                      # 统一导出
├── README.md                     # 本文档
│
├── styling/                      # 样式层注入器
│   ├── TailwindInjector.ts
│   ├── SassInjector.ts
│   └── LessInjector.ts
│
├── ui-library/                   # UI库层注入器
│   ├── ElementPlusInjector.ts
│   ├── AntdInjector.ts
│   └── VuetifyInjector.ts
│
└── ... (其他层级待实现)
```

## 优势

### 1. 架构层面
- ✅ 单一职责：所有注入逻辑集中管理
- ✅ 消除重复：动态生成器不再手动创建文件
- ✅ 依赖清晰：通过拓扑排序自动处理依赖

### 2. 维护层面
- ✅ 新增工具：只需实现 `UnifiedInjector` 接口并注册
- ✅ 调整顺序：修改 `priority` 值即可
- ✅ 冲突处理：在 `conflicts` 字段声明即可

### 3. 扩展层面
- ✅ 支持条件注入：通过 `canHandle` 方法控制
- ✅ 支持依赖注入：通过 `dependencies` 字段声明
- ✅ 支持插件化：注入器可动态加载

## 下一步计划

### Phase 1: 接口统一 ✅
- [x] 创建 `UnifiedInjector` 接口
- [x] 创建 `AbstractUnifiedInjector` 抽象基类
- [x] 实现样式层和UI库层注入器

### Phase 2: 完善注入器生态
- [ ] 实现语言层注入器 (TypeScript, JavaScript)
- [ ] 实现框架层注入器 (Vue3, React, UmiJS)
- [ ] 实现构建层注入器 (Vite, Webpack)
- [ ] 实现代码质量层注入器 (ESLint, Prettier)
- [ ] 实现测试层注入器 (Jest, Vitest)
- [ ] 实现 Git 工具层注入器 (Husky, Commitlint)

### Phase 3: 动态生成器重构
- [ ] 修改 `dynamicGenerator.ts` 使用统一注入
- [ ] 移除手动文件生成逻辑
- [ ] 集成测试验证

### Phase 4: 清理遗留代码
- [ ] 移除 `CoreInjectorManager`
- [ ] 简化 `UnifiedProjectGenerator.ts` 工具注入逻辑
- [ ] 更新相关测试用例

## 测试

运行测试：

```bash
npm test -- unified-injector.test.ts
```

## 贡献指南

### 添加新的注入器

1. 在对应的分类目录下创建注入器文件
2. 继承 `AbstractUnifiedInjector` 并实现必要方法
3. 在 `InjectorRegistry.ts` 中注册
4. 添加对应的测试用例

### 注入器命名规范

- 文件名：`ToolNameInjector.ts` (PascalCase)
- 类名：`ToolNameInjector`
- name 属性：使用小写，与工具名一致
