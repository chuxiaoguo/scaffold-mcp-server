import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Pinia 状态管理注入器
 * 优先级: 55 (在 UI 库之后，代码质量之前)
 */
export class PiniaInjector extends AbstractUnifiedInjector {
  name = "pinia";
  priority = 55;
  category = InjectorCategory.FRAMEWORK; // 归类为框架相关

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "pinia");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始注入 Pinia 状态管理");

      // 只支持 Vue 3
      if (framework?.toLowerCase() !== "vue3") {
        this.addLog(logs, "⚠️  Pinia 仅支持 Vue 3，跳过注入");
        return {
          files,
          packageJson,
          logs,
          success: true,
        };
      }

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 Pinia 依赖
      this.mergeDependencies(packageJson, {
        pinia: "^2.1.7",
      });

      // 2. 创建 store 目录和文件
      const ext = isTypeScript ? "ts" : "js";

      // 创建示例 counter store
      files[`src/stores/counter.${ext}`] =
        this.generateCounterStore(isTypeScript);

      // 创建 index.ts 导出所有 stores
      files[`src/stores/index.${ext}`] = this.generateStoresIndex(isTypeScript);

      // 3. 修改 main.ts/js，注册 Pinia
      const mainFile = `src/main.${ext}`;
      if (files[mainFile]) {
        files[mainFile] = this.injectPiniaToMain(files[mainFile], isTypeScript);
        this.addLog(logs, `更新 ${mainFile}，注册 Pinia`);
      }

      this.addLog(logs, "✅ Pinia 状态管理注入完成");
      this.addLog(logs, "  - 已添加 pinia 依赖");
      this.addLog(logs, "  - 已创建示例 store");
      this.addLog(logs, "  - 已在 main 中注册");

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `❌ Pinia 注入失败: ${errorMsg}`);
      return {
        files,
        packageJson,
        logs,
        success: false,
        errors: [errorMsg],
      };
    }
  }

  /**
   * 生成 counter store
   */
  private generateCounterStore(isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)

  // Getters
  const doubleCount = computed(() => count.value * 2)

  // Actions
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = 0
  }

  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset,
  }
})
`;
    } else {
      return `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)

  // Getters
  const doubleCount = computed(() => count.value * 2)

  // Actions
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = 0
  }

  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset,
  }
})
`;
    }
  }

  /**
   * 生成 stores/index.ts
   */
  private generateStoresIndex(isTypeScript: boolean): string {
    return `export { useCounterStore } from './counter'

// 在这里导出其他 stores
// export { useUserStore } from './user'
// export { useCartStore } from './cart'
`;
  }

  /**
   * 在 main.ts 中注入 Pinia
   */
  private injectPiniaToMain(content: string, isTypeScript: boolean): string {
    // 添加 import
    if (!content.includes("import { createPinia }")) {
      const importLine = "import { createPinia } from 'pinia'\n";
      const createAppMatch = content.match(/import.*createApp.*from.*vue.*/);
      if (createAppMatch) {
        content = content.replace(
          createAppMatch[0],
          `${createAppMatch[0]}\n${importLine}`
        );
      } else {
        content = importLine + content;
      }
    }

    // 添加 pinia 实例
    if (!content.includes("const pinia = createPinia()")) {
      const appMatch = content.match(/const app = createApp\(.*\)/);
      if (appMatch) {
        content = content.replace(
          appMatch[0],
          `${appMatch[0]}\nconst pinia = createPinia()`
        );
      }
    }

    // 添加 use(pinia)
    if (!content.includes(".use(pinia)")) {
      const mountMatch = content.match(/\.mount\(['"]#app['"]\)/);
      if (mountMatch) {
        content = content.replace(
          mountMatch[0],
          `.use(pinia)\n${mountMatch[0]}`
        );
      }
    }

    return content;
  }
}
