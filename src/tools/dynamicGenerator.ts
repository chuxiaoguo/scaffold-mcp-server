import { getUnifiedInjectorManager } from "../core/injectors/unified/index.js";
import { type TemplateResult } from "./templateDownloader.js";
import type { TechStack, UnifiedInjectionContext } from "../types/index.js";

/**
 * 从非固定模板生成项目（动态生成路径）
 * 使用统一注入系统，支持所有层级的工具注入
 */
export async function generateFromNonFixedTemplate(
  techStack: TechStack,
  projectName: string,
  extraTools: string[] = [],
  logs: string[] = []
): Promise<TemplateResult> {
  logs.push(`🔧 使用动态生成模式（统一注入系统）...`);
  console.log(`🔧 使用动态生成模式（统一注入系统）...`);

  try {
    // 1. 解析技术栈为工具集
    const tools = parseTechStackToTools(techStack);
    logs.push(`   - 技术栈工具: ${tools.join(", ")}`);
    console.log(`   - 技术栈工具: ${tools.join(", ")}`);

    // 2. 合并额外工具
    const allTools = [...tools, ...extraTools];
    if (extraTools.length > 0) {
      logs.push(`   - 额外工具: ${extraTools.join(", ")}`);
      console.log(`   - 额外工具: ${extraTools.join(", ")}`);
    }
    logs.push(`   - 完整工具集: ${allTools.join(", ")}`);
    console.log(`   - 完整工具集: ${allTools.join(", ")}`);

    // 3. 准备注入上下文
    const context: UnifiedInjectionContext = {
      projectName,
      projectPath: ".", // 将在外部处理路径
      files: {},
      packageJson: {
        name: projectName,
        version: "1.0.0",
        private: true,
      },
      tools: allTools,
      logs: [],
    };

    // 添加可选字段
    if (techStack.framework) {
      context.framework = techStack.framework;
    }
    if (techStack.builder) {
      context.buildTool = techStack.builder;
    }
    if (techStack.language) {
      context.language = techStack.language;
    }
    if (techStack) {
      context.techStack = techStack;
    }

    // 4. 执行统一注入
    const manager = getUnifiedInjectorManager();
    const result = await manager.injectAll(context);

    if (!result.success) {
      throw new Error(`注入失败: ${result.errors?.join(", ")}`);
    }

    logs.push(`✅ 动态生成完成`);
    logs.push(`   - 文件数量: ${Object.keys(result.files).length}`);
    logs.push(...result.logs);
    console.log(`✅ 动态生成完成`);
    console.log(`   - 文件数量: ${Object.keys(result.files).length}`);

    return {
      files: result.files,
      packageJson: result.packageJson,
    };
  } catch (error) {
    logs.push(`❌ 动态生成失败: ${error}`);
    console.error(`❌ 动态生成失败:`, error);
    throw error;
  }
}

/**
 * 将技术栈解析为工具列表
 */
function parseTechStackToTools(techStack: TechStack): string[] {
  const tools: string[] = [];

  // 语言
  if (techStack.language) {
    tools.push(techStack.language);
  }

  // 框架
  if (techStack.framework) {
    tools.push(techStack.framework);
  }

  // 构建工具
  if (techStack.builder) {
    // 映射特殊构建工具
    if (techStack.builder === "electron-vite") {
      tools.push("vite");
    } else if (techStack.builder !== "umi") {
      tools.push(techStack.builder);
    }
  }

  // 样式方案
  if (techStack.style) {
    if (techStack.style === "tailwindcss") {
      tools.push("tailwind");
    } else {
      tools.push(techStack.style);
    }
  }

  // UI 库
  if (techStack.ui) {
    tools.push(techStack.ui);
  }

  // 路由（可选，某些框架已包含）
  if (techStack.router) {
    // Vue Router 和 React Router 通常不需要单独注入
    // 可以在框架注入器中处理
  }

  // 状态管理（可选，某些框架已包含）
  if (techStack.state) {
    // Pinia, Zustand 等可以作为独立注入器
  }

  return tools;
}
