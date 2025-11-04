import { PromptBuilder, type PromptConfig } from "../core/PromptBuilder.js";
import { type TemplateResult } from "./templateDownloader.js";
import type { TechStack } from "../types/index.js";

/**
 * 生成项目构建提示词（替代原有的动态生成逻辑）
 * 将技术栈配置转换为结构化的提示词，交由 LLM 自主构建项目
 */
export async function generatePromptForDynamicTemplate(
  techStack: TechStack,
  projectName: string,
  extraTools: string[] = [],
  logs: string[] = []
): Promise<string> {
  logs.push(`🎯 生成动态项目构建提示词...`);
  console.log(`🎯 生成动态项目构建提示词...`);

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

    // 3. 构建提示词配置
    const promptConfig: PromptConfig = {
      projectName,
      tools: allTools,
      ...(techStack.framework && { framework: techStack.framework }),
      ...(techStack.builder && { builder: techStack.builder }),
      ...(techStack.language && { language: techStack.language }),
      ...(techStack.ui && { ui: techStack.ui }),
      ...(techStack.style && { style: techStack.style }),
      ...(techStack.router && { router: techStack.router }),
      ...(techStack.state && { state: techStack.state }),
    };

    // 4. 生成结构化提示词
    logs.push(`   - 正在构建结构化提示词...`);
    const prompt = await PromptBuilder.build(promptConfig);
    logs.push(`✅ 提示词生成完成`);
    logs.push(`   - 提示词长度: ${prompt.length} 字符`);
    console.log(`✅ 提示词生成完成`);
    console.log(`   - 提示词长度: ${prompt.length} 字符`);

    return prompt;
  } catch (error) {
    logs.push(`❌ 提示词生成失败: ${error}`);
    console.error(`❌ 提示词生成失败:`, error);
    throw error;
  }
}

/**
 * 保留旧函数名作为兼容性导出（标记为废弃）
 * @deprecated 使用 generatePromptForDynamicTemplate 替代
 */
export async function generateFromNonFixedTemplate(
  techStack: TechStack,
  projectName: string,
  extraTools: string[] = [],
  logs: string[] = []
): Promise<TemplateResult> {
  // 生成提示词
  const prompt = await generatePromptForDynamicTemplate(
    techStack,
    projectName,
    extraTools,
    logs
  );

  // 返回空的模板结果，提示词将在上层处理
  return {
    files: {},
    packageJson: {
      name: projectName,
      version: "1.0.0",
      description: `动态生成项目 - 请使用提示词构建`,
    },
    prompt, // 附加提示词字段
  } as TemplateResult & { prompt: string };
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
