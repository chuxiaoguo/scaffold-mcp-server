/**
 * 统一注入器系统导出
 */

// 基础类和管理器
export { AbstractUnifiedInjector } from "./AbstractUnifiedInjector.js";
export { UnifiedInjectorManager } from "./UnifiedInjectorManager.js";
export {
  InjectorRegistry,
  getUnifiedInjectorManager,
} from "./InjectorRegistry.js";

// 包管理器层注入器 (Priority: 5)
export { NpmrcInjector } from "./package-manager/NpmrcInjector.js";

// 语言层注入器 (Priority: 10)
export { TypeScriptInjector } from "./language/TypeScriptInjector.js";

// 框架层注入器 (Priority: 20)
export { Vue2Injector } from "./framework/Vue2Injector.js";
export { Vue3Injector } from "./framework/Vue3Injector.js";
export { ReactInjector } from "./framework/ReactInjector.js";

// 构建层注入器 (Priority: 30)
export { ViteInjector } from "./builder/ViteInjector.js";
export { WebpackInjector } from "./builder/WebpackInjector.js";

// 样式层注入器 (Priority: 40)
export { TailwindInjector } from "./styling/TailwindInjector.js";
export { SassInjector } from "./styling/SassInjector.js";
export { LessInjector } from "./styling/LessInjector.js";

// UI库层注入器 (Priority: 50)
export { ElementPlusInjector } from "./ui-library/ElementPlusInjector.js";
export { AntdInjector } from "./ui-library/AntdInjector.js";
export { AntdVueInjector } from "./ui-library/AntdVueInjector.js";
export { VuetifyInjector } from "./ui-library/VuetifyInjector.js";

// 状态管理和路由层注入器 (Priority: 55)
export { PiniaInjector } from "./state-management/PiniaInjector.js";
export { ReduxInjector } from "./state-management/ReduxInjector.js";
export { VueRouterInjector } from "./routing/VueRouterInjector.js";
export { ReactRouterInjector } from "./routing/ReactRouterInjector.js";

// 代码质量层注入器 (Priority: 60)
export { ESLintInjector } from "./code-quality/ESLintInjector.js";
export { PrettierInjector } from "./code-quality/PrettierInjector.js";

// 测试层注入器 (Priority: 70)
export { JestInjector } from "./testing/JestInjector.js";
export { VitestInjector } from "./testing/VitestInjector.js";

// Git工具层注入器 (Priority: 80)
export { HuskyInjector } from "./git-tools/HuskyInjector.js";
export { CommitlintInjector } from "./git-tools/CommitlintInjector.js";
export { LintStagedInjector } from "./git-tools/LintStagedInjector.js";

/**
 * 注入器优先级层次说明:
 *
 * 0. 包管理器层 (priority: 5)  → NpmrcInjector
 * 1. 语言层 (priority: 10)    → TypeScriptInjector
 * 2. 框架层 (priority: 20)    → Vue2Injector, Vue3Injector, ReactInjector
 * 3. 构建层 (priority: 30)    → ViteInjector, WebpackInjector
 * 4. 样式层 (priority: 40)    → TailwindInjector, SassInjector, LessInjector
 * 5. UI库层 (priority: 50)    → ElementPlusInjector, AntdInjector, AntdVueInjector, VuetifyInjector
 * 6. 状态管理和路由层 (priority: 55) → PiniaInjector, ReduxInjector, VueRouterInjector, ReactRouterInjector
 * 7. 代码质量层 (priority: 60) → ESLintInjector, PrettierInjector
 * 8. 测试层 (priority: 70)    → JestInjector, VitestInjector
 * 9. Git工具层 (priority: 80)  → HuskyInjector, CommitlintInjector, LintStagedInjector
 */
