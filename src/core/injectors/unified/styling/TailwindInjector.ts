import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Tailwind CSS 注入器
 * 优先级: 40 (样式层)
 */
export class TailwindInjector extends AbstractUnifiedInjector {
  name = "tailwind";
  priority = InjectorPriority.STYLING;
  category = InjectorCategory.STYLING;

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "tailwind" ||
        tool.toLowerCase() === "tailwindcss"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始注入 Tailwind CSS");

      // 1. 添加依赖
      this.mergeDependencies(packageJson, {
        tailwindcss: "^3.4.1",
        postcss: "^8.4.33",
        autoprefixer: "^10.4.16",
      });

      // 2. 生成 tailwind.config.js
      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
      this.addFile(files, "tailwind.config.js", tailwindConfig);
      this.addLog(logs, "生成 tailwind.config.js");

      // 3. 生成 postcss.config.js
      const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
      this.addFile(files, "postcss.config.js", postcssConfig);
      this.addLog(logs, "生成 postcss.config.js");

      // 4. 生成 Tailwind CSS 入口文件
      const tailwindCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
      this.addFile(files, "src/styles/tailwind.css", tailwindCss);
      this.addLog(logs, "生成 src/styles/tailwind.css");

      this.addLog(logs, "Tailwind CSS 注入完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `注入失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
