import { UnifiedInjector } from "../../../types/index.js";
import { UnifiedInjectorManager } from "./UnifiedInjectorManager.js";

// 包管理器层注入器 (Priority: 5)
import { NpmrcInjector } from "./package-manager/NpmrcInjector.js";

// 语言层注入器 (Priority: 10)
import { TypeScriptInjector } from "./language/TypeScriptInjector.js";

// 框架层注入器 (Priority: 20)
import { Vue2Injector } from "./framework/Vue2Injector.js";
import { Vue3Injector } from "./framework/Vue3Injector.js";
import { ReactInjector } from "./framework/ReactInjector.js";

// 构建层注入器 (Priority: 30)
import { ViteInjector } from "./builder/ViteInjector.js";
import { WebpackInjector } from "./builder/WebpackInjector.js";

// 样式层注入器 (Priority: 40)
import { TailwindInjector } from "./styling/TailwindInjector.js";
import { SassInjector } from "./styling/SassInjector.js";
import { LessInjector } from "./styling/LessInjector.js";

// UI库层注入器 (Priority: 50)
import { ElementPlusInjector } from "./ui-library/ElementPlusInjector.js";
import { AntdInjector } from "./ui-library/AntdInjector.js";
import { AntdVueInjector } from "./ui-library/AntdVueInjector.js";
import { VuetifyInjector } from "./ui-library/VuetifyInjector.js";

// 状态管理和路由层注入器 (Priority: 55)
import { PiniaInjector } from "./state-management/PiniaInjector.js";
import { ReduxInjector } from "./state-management/ReduxInjector.js";
import { VueRouterInjector } from "./routing/VueRouterInjector.js";
import { ReactRouterInjector } from "./routing/ReactRouterInjector.js";

// 代码质量层注入器 (Priority: 60)
import { ESLintInjector } from "./code-quality/ESLintInjector.js";
import { PrettierInjector } from "./code-quality/PrettierInjector.js";

// 测试层注入器 (Priority: 70)
import { JestInjector } from "./testing/JestInjector.js";
import { VitestInjector } from "./testing/VitestInjector.js";

// Git工具层注入器 (Priority: 80)
import { HuskyInjector } from "./git-tools/HuskyInjector.js";
import { CommitlintInjector } from "./git-tools/CommitlintInjector.js";
import { LintStagedInjector } from "./git-tools/LintStagedInjector.js";

/**
 * 注入器注册中心
 * 负责创建和注册所有注入器实例
 */
export class InjectorRegistry {
  private static instance: InjectorRegistry;
  private manager: UnifiedInjectorManager;

  private constructor() {
    this.manager = new UnifiedInjectorManager();
    this.registerAllInjectors();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): InjectorRegistry {
    if (!InjectorRegistry.instance) {
      InjectorRegistry.instance = new InjectorRegistry();
    }
    return InjectorRegistry.instance;
  }

  /**
   * 获取注入器管理器
   */
  getManager(): UnifiedInjectorManager {
    return this.manager;
  }

  /**
   * 注册所有注入器
   */
  private registerAllInjectors(): void {
    const injectors: UnifiedInjector[] = [
      // 包管理器层注入器 (Priority: 5) - 最高优先级，所有项目都需要
      new NpmrcInjector(),

      // 语言层注入器 (Priority: 10)
      new TypeScriptInjector(),

      // 框架层注入器 (Priority: 20)
      new Vue2Injector(),
      new Vue3Injector(),
      new ReactInjector(),

      // 构建层注入器 (Priority: 30)
      new ViteInjector(),
      new WebpackInjector(),

      // 样式层注入器 (Priority: 40)
      new TailwindInjector(),
      new SassInjector(),
      new LessInjector(),

      // UI库层注入器 (Priority: 50)
      new ElementPlusInjector(),
      new AntdInjector(),
      new AntdVueInjector(),
      new VuetifyInjector(),

      // 状态管理和路由层注入器 (Priority: 55)
      new PiniaInjector(),
      new ReduxInjector(),
      new VueRouterInjector(),
      new ReactRouterInjector(),

      // 代码质量层注入器 (Priority: 60)
      new ESLintInjector(),
      new PrettierInjector(),

      // 测试层注入器 (Priority: 70)
      new JestInjector(),
      new VitestInjector(),

      // Git工具层注入器 (Priority: 80)
      new HuskyInjector(),
      new CommitlintInjector(),
      new LintStagedInjector(),
    ];

    this.manager.registerAll(injectors);

    console.log(
      `\n✓ 注入器注册中心初始化完成，共注册 ${injectors.length} 个注入器`
    );
  }

  /**
   * 重新注册所有注入器（用于热重载等场景）
   */
  reload(): void {
    this.manager = new UnifiedInjectorManager();
    this.registerAllInjectors();
  }
}

/**
 * 获取全局注入器管理器实例
 */
export function getUnifiedInjectorManager(): UnifiedInjectorManager {
  return InjectorRegistry.getInstance().getManager();
}
