import type { ToolInjector } from "./ToolInjector.js";
import { ESLintInjector } from "./eslintInjector.js";
import { PrettierInjector } from "./prettierInjector.js";
import { JestInjector } from "./jestInjector.js";
import { HuskyInjector } from "./huskyInjector.js";
import { CommitlintInjector } from "./commitlintInjector.js";
import { TailwindCSSInjector } from "./tailwindCSSInjector.js";

/**
 * 工具注入管理器
 */
export class ToolInjectorManager {
  private injectors: Map<string, ToolInjector> = new Map();

  constructor() {
    // 注册默认的工具注入器
    this.register(new ESLintInjector());
    this.register(new PrettierInjector());
    this.register(new JestInjector());
    this.register(new HuskyInjector());
    this.register(new CommitlintInjector());
    this.register(new TailwindCSSInjector());
  }

  /**
   * 注册工具注入器
   */
  register(injector: ToolInjector): void {
    this.injectors.set(injector.name.toLowerCase(), injector);
  }

  /**
   * 注入工具
   */
  injectTools(
    files: Record<string, string>,
    packageJson: any,
    toolNames: string[]
  ): { files: Record<string, string>; packageJson: any } {
    if (!toolNames || toolNames.length === 0) {
      console.log(`⏭️  没有额外工具需要注入`);
      return { files, packageJson };
    }

    console.log(`🔧 注入额外工具: ${toolNames.join(", ")}`);

    let result = { files, packageJson };

    for (const toolName of toolNames) {
      const injector = this.injectors.get(toolName.toLowerCase());
      if (injector) {
        result = injector.inject(result.files, result.packageJson);
      } else {
        console.log(`   - ⚠️  未知工具: ${toolName}，跳过`);
      }
    }

    console.log(`✅ 额外工具注入完成`);
    return result;
  }

  /**
   * 获取所有已注册的工具名称
   */
  getAvailableTools(): string[] {
    return Array.from(this.injectors.keys());
  }
}
