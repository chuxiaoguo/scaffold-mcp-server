import * as path from "path";
import { fileURLToPath } from "url";
import type { TechStack } from "../types/index.js";
import {
  parseTechStack,
  techStackToArray,
  normalizeTechStack,
} from "./techStackParser.js";
import {
  generateFromFixedTemplate,
  generateFromLocalTemplate,
  type TemplateResult,
} from "./templateDownloader.js";
import { ToolInjectorManager } from "../core/injectors/ToolInjectorManager.js";
import { CoreInjectorManager } from "../core/injectors/core/CoreInjectorManager.js";
import {
  createProjectFiles,
  generateDirectoryTree,
  generateFileSummary,
} from "./fileOperations.js";

// 固定模板配置
const FIXED_TEMPLATES = [
  {
    name: "vue3-vite-typescript",
    framework: "vue3",
    builder: "vite",
    language: "typescript",
    description: "Vue 3 + Vite + TypeScript 项目模板",
  },
  {
    name: "electron-vite-vue3",
    framework: "vue3",
    builder: "electron-vite",
    language: "typescript",
    description: "electron + vite + + vue3 + TypeScript 项目模板",
  },
  {
    name: "react-webpack-typescript",
    framework: "react",
    builder: "webpack",
    language: "typescript",
    description: "React + Webpack + TypeScript 项目模板",
  },
  {
    name: "umijs",
    framework: "react",
    builder: "umi",
    language: "typescript",
    description: "React + umi + TypeScript 项目模板",
  },
];

/**
 * 匹配固定模板
 */
export function matchFixedTemplate(
  techStack: TechStack,
  logs: string[] = []
): any | null {
  logs.push(`🔍 匹配固定模板...`);
  logs.push(`   - 框架: ${techStack.framework}`);
  logs.push(`   - 构建工具: ${techStack.builder}`);
  logs.push(`   - 语言: ${techStack.language}`);

  console.log(`🔍 匹配固定模板...`);
  console.log(`   - 框架: ${techStack.framework}`);
  console.log(`   - 构建工具: ${techStack.builder}`);
  console.log(`   - 语言: ${techStack.language}`);

  const template = FIXED_TEMPLATES.find(
    (t) =>
      t.framework === techStack.framework &&
      t.builder === techStack.builder &&
      t.language === techStack.language
  );

  if (template) {
    logs.push(`✅ 找到匹配的固定模板: ${template.name}`);
    logs.push(`   - 描述: ${template.description}`);
    console.log(`✅ 找到匹配的固定模板: ${template.name}`);
    console.log(`   - 描述: ${template.description}`);
    return template;
  }

  logs.push(`❌ 未找到匹配的固定模板`);
  console.log(`❌ 未找到匹配的固定模板`);
  return null;
}

/**
 * 根据固定模板填充默认值
 */
function fillDefaultValues(
  techStack: TechStack,
  logs: string[] = []
): TechStack {
  logs.push(`   - 原始技术栈: ${JSON.stringify(techStack)}`);
  console.log(`   - 原始技术栈: ${JSON.stringify(techStack)}`);

  // 如果已经有完整的配置，直接返回
  if (techStack.framework && techStack.builder && techStack.language) {
    logs.push(`✅ 技术栈配置完整，无需填充默认值`);
    return techStack;
  }

  // 根据部分信息匹配默认模板
  let defaultTemplate = null;

  // 1. 如果只指定了语言（如 typescript），默认使用 vue3-vite-typescript
  if (techStack.language && !techStack.framework && !techStack.builder) {
    logs.push(`🔍 仅指定语言 ${techStack.language}，查找默认模板...`);
    if (
      techStack.language === "typescript" ||
      techStack.language === "javascript"
    ) {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "vue3-vite-typescript"
      );
      logs.push(`📦 选择默认模板: vue3-vite-typescript`);
    }
  }

  // 2. 如果只指定了构建工具
  if (techStack.builder && !techStack.framework && !techStack.language) {
    logs.push(`🔍 仅指定构建工具 ${techStack.builder}，查找默认模板...`);
    if (techStack.builder === "vite") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "vue3-vite-typescript"
      );
      logs.push(`📦 选择默认模板: vue3-vite-typescript`);
    } else if (techStack.builder === "webpack") {
      // 修复：webpack 不应该默认选择 react 模板，应该让用户明确指定框架
      // 或者使用动态模板生成
      logs.push(`⚠️ 仅指定 webpack 构建工具，无法确定框架，建议使用动态模板`);
      // 不设置 defaultTemplate，让系统使用动态模板
    } else if (techStack.builder === "umi") {
      defaultTemplate = FIXED_TEMPLATES.find((t) => t.name === "umijs");
      logs.push(`📦 选择默认模板: umijs`);
    } else if (techStack.builder === "electron-vite") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "electron-vite-vue3"
      );
      logs.push(`📦 选择默认模板: electron-vite-vue3`);
    }
  }

  // 3. 如果只指定了框架
  if (techStack.framework && !techStack.builder && !techStack.language) {
    logs.push(`🔍 仅指定框架 ${techStack.framework}，查找默认模板...`);
    if (techStack.framework === "vue3") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "vue3-vite-typescript"
      );
      logs.push(`📦 选择默认模板: vue3-vite-typescript`);
    } else if (techStack.framework === "react") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "react-webpack-typescript"
      );
      logs.push(`📦 选择默认模板: react-webpack-typescript`);
    } else if (techStack.framework === "vue2") {
      // Vue2 不在固定模板中，使用动态模板
      logs.push(`⚠️ Vue2 不在固定模板中，建议使用动态模板`);
      // 不设置 defaultTemplate，让系统使用动态模板
    }
  }

  // 4. 如果指定了框架和构建工具，补充语言
  if (techStack.framework && techStack.builder && !techStack.language) {
    logs.push(`🔍 指定了框架和构建工具，补充语言...`);
    const matchingTemplate = FIXED_TEMPLATES.find(
      (t) =>
        t.framework === techStack.framework && t.builder === techStack.builder
    );
    if (matchingTemplate) {
      defaultTemplate = matchingTemplate;
      logs.push(`📦 找到匹配模板: ${matchingTemplate.name}`);
    }
  }

  // 5. 如果指定了框架和语言，补充构建工具
  if (techStack.framework && !techStack.builder && techStack.language) {
    logs.push(`🔍 指定了框架和语言，补充构建工具...`);
    const matchingTemplate = FIXED_TEMPLATES.find(
      (t) =>
        t.framework === techStack.framework && t.language === techStack.language
    );
    if (matchingTemplate) {
      defaultTemplate = matchingTemplate;
      logs.push(`📦 找到匹配模板: ${matchingTemplate.name}`);
    }
  }

  // 6. 如果指定了构建工具和语言，补充框架
  if (!techStack.framework && techStack.builder && techStack.language) {
    logs.push(`🔍 指定了构建工具和语言，补充框架...`);
    const matchingTemplate = FIXED_TEMPLATES.find(
      (t) =>
        t.builder === techStack.builder && t.language === techStack.language
    );
    if (matchingTemplate) {
      // 注意：不要自动设置框架，因为用户可能想要使用不同的框架
      // 例如：vue2 + webpack + typescript 不应该被映射为 react + webpack + typescript
      logs.push(
        `⚠️ 找到匹配模板 ${matchingTemplate.name}，但不自动设置框架，避免覆盖用户意图`
      );
      // defaultTemplate = matchingTemplate;
      // logs.push(`📦 找到匹配模板: ${matchingTemplate.name}`);
    }
  }

  // 应用默认模板
  if (defaultTemplate) {
    const filledTechStack: TechStack = {
      framework: (techStack.framework || defaultTemplate.framework) as
        | "vue3"
        | "vue2"
        | "react",
      builder: (techStack.builder || defaultTemplate.builder) as
        | "vite"
        | "webpack"
        | "electron-vite"
        | "umi",
      language: (techStack.language || defaultTemplate.language) as
        | "typescript"
        | "javascript",
    };

    logs.push(`   - 使用默认模板: ${defaultTemplate.name}`);
    logs.push(`   - 填充后的技术栈: ${JSON.stringify(filledTechStack)}`);
    console.log(`   - 使用默认模板: ${defaultTemplate.name}`);
    console.log(`   - 填充后的技术栈: ${JSON.stringify(filledTechStack)}`);

    return filledTechStack;
  }

  // 如果没有匹配的默认模板，返回原始技术栈
  logs.push(`   - 未找到匹配的默认模板，保持原始配置`);
  console.log(`   - 未找到匹配的默认模板，保持原始配置`);
  return techStack;
}

/**
 * 注入额外工具到项目
 */



/**
 * 从非固定模板生成项目
 * 使用 CoreInjectorManager 生成核心项目结构
 */
export async function generateFromNonFixedTemplate(
  techStack: TechStack,
  projectName: string,
  logs: string[] = []
): Promise<TemplateResult> {
  logs.push(`🔧 使用 CoreInjectorManager 生成项目`);
  logs.push(`   - 项目名称: ${projectName}`);
  logs.push(`   - 技术栈: ${JSON.stringify(techStack)}`);
  console.log(`🔧 使用 CoreInjectorManager 生成项目`);
  console.log(`   - 项目名称: ${projectName}`);
  console.log(`   - 技术栈: ${JSON.stringify(techStack)}`);

  try {
    // 使用 CoreInjectorManager 生成项目
    const coreInjectorManager = new CoreInjectorManager();
    const result = await coreInjectorManager.generateCoreStructure(techStack, projectName);

    logs.push(`✅ CoreInjectorManager 生成完成`);
    logs.push(`   - 生成文件数: ${Object.keys(result.files).length}`);
    logs.push(`   - 依赖数量: ${Object.keys(result.packageJson.dependencies || {}).length}`);
    logs.push(`   - 开发依赖数量: ${Object.keys(result.packageJson.devDependencies || {}).length}`);
    
    console.log(`✅ CoreInjectorManager 生成完成`);
    console.log(`   - 生成文件数: ${Object.keys(result.files).length}`);
    console.log(`   - 依赖数量: ${Object.keys(result.packageJson.dependencies || {}).length}`);
    console.log(`   - 开发依赖数量: ${Object.keys(result.packageJson.devDependencies || {}).length}`);

    // 合并处理日志
    const allLogs = [...logs, ...result.logs];

    return {
      files: result.files,
      packageJson: result.packageJson,
      processLogs: allLogs
    };
  } catch (error) {
    const errorMessage = `❌ CoreInjectorManager 生成失败: ${error instanceof Error ? error.message : String(error)}`;
    logs.push(errorMessage);
    console.error(errorMessage);
    console.error(error);
    
    // 如果 CoreInjectorManager 失败，抛出错误
    throw new Error(`项目生成失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 生成模拟的目录树结构（用于 dry run 模式）
 */
function generateMockDirectoryTree(
  projectName: string,
  files: Record<string, string>,
  packageJson: any
): string {
  const tree: string[] = [];
  tree.push(`${projectName}/`);

  // 添加 package.json
  tree.push(`├── package.json`);

  // 按目录分组文件
  const filesByDir: Record<string, string[]> = {};
  for (const filePath of Object.keys(files)) {
    const dir = path.dirname(filePath);
    const dirKey = dir || ".";
    if (!filesByDir[dirKey]) {
      filesByDir[dirKey] = [];
    }
    filesByDir[dirKey].push(path.basename(filePath));
  }

  // 生成目录结构
  const dirs = Object.keys(filesByDir).sort();
  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    if (!dir) continue;

    const isLastDir = i === dirs.length - 1;

    if (dir !== ".") {
      tree.push(`${isLastDir ? "└──" : "├──"} ${dir}/`);

      const filesInDir = filesByDir[dir];
      if (filesInDir) {
        filesInDir.sort();
        for (let j = 0; j < filesInDir.length; j++) {
          const file = filesInDir[j];
          const isLastFile = j === filesInDir.length - 1;
          const prefix = isLastDir ? "    " : "│   ";
          tree.push(`${prefix}${isLastFile ? "└──" : "├──"} ${file}`);
        }
      }
    } else {
      // 根目录文件
      const filesInRoot = filesByDir[dir];
      if (filesInRoot) {
        filesInRoot.sort();
        for (let j = 0; j < filesInRoot.length; j++) {
          const file = filesInRoot[j];
          const isLastFile = j === filesInRoot.length - 1 && dirs.length === 1;
          tree.push(`${isLastFile ? "└──" : "├──"} ${file}`);
        }
      }
    }
  }

  return tree.join("\n");
}

/**
 * 生成模拟的文件摘要（用于 dry run 模式）
 */
function generateMockFileSummary(
  files: Record<string, string>,
  packageJson: any,
  projectName: string
): string[] {
  const summaries: string[] = [];

  // 添加 package.json 摘要
  const deps = Object.keys(packageJson.dependencies || {}).length;
  const devDeps = Object.keys(packageJson.devDependencies || {}).length;
  summaries.push(
    `📄 package.json (预计大小) - 项目配置 (${deps} 个依赖, ${devDeps} 个开发依赖)`
  );

  // 统计目录数量
  const dirs = new Set<string>();
  for (const filePath of Object.keys(files)) {
    const dir = path.dirname(filePath);
    if (dir !== ".") {
      dirs.add(dir);
    }
  }

  if (dirs.size > 0) {
    summaries.unshift(`📁 包含 ${dirs.size} 个子目录`);
  }

  // 添加文件摘要
  let fileCount = 0;
  for (const [filePath, content] of Object.entries(files)) {
    if (fileCount >= 20) break; // 限制显示数量

    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const lines = content.split("\n").length;
    const estimatedSize = content.length;
    const sizeStr =
      estimatedSize > 1024
        ? `${Math.round(estimatedSize / 1024)}KB`
        : `${estimatedSize}B`;

    let contentType = "";
    if ([".ts", ".js", ".tsx", ".jsx"].includes(ext)) {
      if (content.includes("export default") || content.includes("export {")) {
        contentType = `${ext.slice(1).toUpperCase()} 模块 (${lines} 行)`;
      } else if (
        content.includes("import React") ||
        content.includes("from 'react'")
      ) {
        contentType = `React 组件 (${lines} 行)`;
      } else if (
        content.includes("import Vue") ||
        content.includes("from 'vue'")
      ) {
        contentType = `Vue 组件 (${lines} 行)`;
      } else {
        contentType = `${ext.slice(1).toUpperCase()} 文件 (${lines} 行)`;
      }
    } else if (ext === ".json") {
      contentType = `JSON 配置文件`;
    } else if ([".css", ".scss", ".less"].includes(ext)) {
      contentType = `样式文件 (${lines} 行)`;
    } else if ([".html"].includes(ext)) {
      contentType = `HTML 文件 (${lines} 行)`;
    } else {
      contentType = `${ext ? ext.slice(1).toUpperCase() : "文本"} 文件 (${lines} 行)`;
    }

    summaries.push(`📄 ${fileName} (预计${sizeStr}) - ${contentType}`);
    fileCount++;
  }

  return summaries;
}

/**
 * 生成项目的主要函数
 */
export async function generateProject(
  techStackInput: string | string[],
  projectName: string = "my-project",
  outputDir: string = ".",
  extraTools: string[] = [],
  options: {
    dryRun?: boolean;
    force?: boolean;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  projectPath?: string;
  directoryTree?: string;
  fileSummary?: string[];
  processLogs?: string[];
}> {
  const logs: string[] = [];
  let directoryTree: string;
  let fileSummary: string[];
  let finalFileCount: number;

  try {
    logs.push(`🚀 开始生成项目...`);
    logs.push(`   - 项目名称: ${projectName}`);
    logs.push(`   - 输出目录: ${outputDir}`);
    logs.push(`   - 技术栈: ${JSON.stringify(techStackInput)}`);
    logs.push(`   - 额外工具: ${extraTools.join(", ") || "无"}`);
    logs.push(`   - 选项: ${JSON.stringify(options)}`);

    // 1. 解析技术栈
    logs.push(`📋 解析技术栈...`);
    const techStack = parseTechStack(techStackInput);
    logs.push(`   - 解析结果: ${JSON.stringify(techStack)}`);

    const normalizedTechStack = normalizeTechStack(techStack);
    logs.push(`   - 标准化结果: ${JSON.stringify(normalizedTechStack)}`);

    // 2. 填充默认值
    logs.push(`🔧 填充默认值...`);
    const filledTechStack = fillDefaultValues(normalizedTechStack, logs);
    logs.push(`📋 最终技术栈: ${JSON.stringify(filledTechStack)}`);
    console.log(`📋 最终技术栈:`, filledTechStack);

    // 3. 确定项目路径（outputDir已经是绝对路径）
    logs.push(`📁 确定项目路径...`);
    const resolvedOutputDir = outputDir; // 已经通过pathResolver.ts解析为绝对路径
    const projectPath = path.resolve(resolvedOutputDir, projectName);
    logs.push(`   - 输出目录: ${resolvedOutputDir}`);
    logs.push(`   - 项目路径: ${projectPath}`);
    console.log(`📁 项目路径: ${projectPath}`);

    // 4. 确保输出目录存在
    logs.push(`📁 确保输出目录存在...`);
    try {
      const fs = await import("fs/promises");
      await fs.mkdir(resolvedOutputDir, { recursive: true });
      logs.push(`✅ 输出目录已确保存在: ${resolvedOutputDir}`);
    } catch (error: any) {
      logs.push(`❌ 创建输出目录失败: ${error.message || error}`);
      return {
        success: false,
        message: `无法创建输出目录 ${resolvedOutputDir}: ${error.message || error}。请检查路径权限。`,
        processLogs: logs,
      };
    }

    // 5. 检查项目目录是否存在
    logs.push(`🔍 检查项目目录是否存在...`);
    if (!options.force) {
      try {
        await import("fs/promises").then((fs) => fs.access(projectPath));
        logs.push(`❌ 项目目录已存在，需要使用 --force 选项`);
        return {
          success: false,
          message: `项目目录 ${projectPath} 已存在。使用 --force 选项强制覆盖。`,
          processLogs: logs,
        };
      } catch {
        logs.push(`✅ 项目目录不存在，可以继续创建`);
      }
    } else {
      logs.push(`⚠️ 使用强制模式，将覆盖现有项目目录`);
    }

    // 6. 匹配模板并生成项目
    logs.push(`🔍 匹配模板...`);
    let templateResult: TemplateResult;
    const fixedTemplate = matchFixedTemplate(filledTechStack, logs);

    if (fixedTemplate) {
      logs.push(`📦 使用固定模板: ${fixedTemplate.name}`);
      console.log(`📦 使用固定模板: ${fixedTemplate.name}`);
      templateResult = await generateFromFixedTemplate(
        fixedTemplate,
        projectName,
        normalizedTechStack,
        logs
      );

      // 注意：不需要合并 processLogs，因为 generateFromFixedTemplate 已经直接向 logs 添加了日志
    } else {
      logs.push(`🔧 使用动态生成模板`);
      console.log(`🔧 使用动态生成模板`);
      templateResult = await generateFromNonFixedTemplate(
        normalizedTechStack,
        projectName,
        logs
      );

      // 注意：不需要合并 processLogs，因为 generateFromNonFixedTemplate 已经直接向 logs 添加了日志
    }

    // 7. 注入额外工具
    logs.push(`🔧 注入额外工具...`);
    if (extraTools.length > 0) {
      logs.push(`   - 额外工具: ${extraTools.join(", ")}`);
    } else {
      logs.push(`   - 无额外工具需要注入`);
    }

    // 使用 ToolInjectorManager 注入额外工具
    const toolInjectorManager = new ToolInjectorManager();
    const { files, packageJson } = toolInjectorManager.injectTools(
      templateResult.files,
      templateResult.packageJson,
      extraTools
    );
    logs.push(`   - 文件数量: ${Object.keys(files).length}`);
    logs.push(
      `   - 依赖数量: ${Object.keys(packageJson.dependencies || {}).length + Object.keys(packageJson.devDependencies || {}).length}`
    );

    // 8. 如果是预览模式，生成目录树和文件摘要
    if (options.dryRun) {
      logs.push(`👀 预览模式，不创建实际文件`);
      console.log(`👀 预览模式，不创建实际文件`);

      // 生成预期的目录树结构
      logs.push(`📊 生成预期目录结构...`);
      directoryTree = generateMockDirectoryTree(
        projectName,
        files,
        packageJson
      );
      logs.push(`   - 预期目录树生成完成`);

      // 生成预期的文件摘要
      logs.push(`📊 生成预期文件摘要...`);
      fileSummary = generateMockFileSummary(files, packageJson, projectName);
      logs.push(`   - 预期文件摘要生成完成`);

      // 统计预期的文件数量
      finalFileCount = Object.keys(files).length + 1; // +1 for package.json
      logs.push(`   - 预期文件数量: ${finalFileCount}`);

      const fileList = Object.keys(files)
        .map((f) => `  📄 ${f}`)
        .join("\n");
      const dependencyList = Object.keys(packageJson.dependencies || {})
        .concat(Object.keys(packageJson.devDependencies || {}))
        .map((d) => `  📦 ${d}`)
        .join("\n");

      return {
        success: true,
        message: `预览模式 - 将要创建的项目结构：

📁 项目: ${projectName}
📍 路径: ${projectPath}
🛠️  技术栈: ${techStackToArray(normalizedTechStack).join(" + ")}

📄 文件列表:
${fileList}

📦 依赖列表:
${dependencyList}`,
        projectPath,
        directoryTree,
        fileSummary,
        processLogs: logs,
      };
    }

    if (options.dryRun) {
      logs.push(`👀 预览模式，不创建实际文件`);
      console.log(`👀 预览模式，不创建实际文件`);

      // 生成预期的目录树结构
      logs.push(`📊 生成预期目录结构...`);
      directoryTree = generateMockDirectoryTree(
        projectName,
        files,
        packageJson
      );
      logs.push(`   - 预期目录树生成完成`);

      // 生成预期的文件摘要
      logs.push(`📊 生成预期文件摘要...`);
      fileSummary = generateMockFileSummary(files, packageJson, projectName);
      logs.push(`   - 预期文件摘要生成完成`);

      // 统计预期的文件数量
      finalFileCount = Object.keys(files).length + 1; // +1 for package.json
      logs.push(`   - 预期文件数量: ${finalFileCount}`);

      const fileList = Object.keys(files)
        .map((f) => `  📄 ${f}`)
        .join("\n");
      const dependencyList = Object.keys(packageJson.dependencies || {})
        .concat(Object.keys(packageJson.devDependencies || {}))
        .map((d) => `  📦 ${d}`)
        .join("\n");

      return {
        success: true,
        message: `预览模式 - 将要创建的项目结构：

📁 项目: ${projectName}
📍 路径: ${projectPath}
🛠️  技术栈: ${techStackToArray(normalizedTechStack).join(" + ")}

📄 文件列表:
${fileList}

📦 依赖列表:
${dependencyList}`,
        projectPath,
        directoryTree,
        fileSummary,
        processLogs: logs,
      };
    } else {
      // 正常模式：实际创建文件
      // 9. 创建项目文件
      logs.push(`📁 创建项目文件...`);
      await createProjectFiles(projectPath, files, projectName, logs);

      // 10. 创建 package.json
      logs.push(`📦 创建 package.json...`);
      const packageJsonPath = path.join(projectPath, "package.json");
      await import("fs/promises").then((fs) =>
        fs.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2),
          "utf-8"
        )
      );
      logs.push(`✅ package.json 创建成功`);
      console.log(`✅ 创建 package.json`);

      // 11. 生成项目摘要
      logs.push(`📊 生成项目摘要...`);
      directoryTree = await generateDirectoryTree(projectPath);
      fileSummary = await generateFileSummary(projectPath);
      logs.push(`   - 目录树生成完成`);
      logs.push(`   - 文件摘要生成完成`);

      // 12. 统计最终的实际文件数量
      logs.push(`📊 统计最终文件数量...`);
      const fs = await import("fs/promises");

      const countFinalFiles = async (dirPath: string): Promise<number> => {
        let count = 0;
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.isFile()) {
              count++;
            } else if (entry.isDirectory() && entry.name !== "node_modules") {
              const subDirPath = path.join(dirPath, entry.name);
              count += await countFinalFiles(subDirPath);
            }
          }
        } catch (error) {
          // 忽略无法访问的目录
        }
        return count;
      };

      finalFileCount = await countFinalFiles(projectPath);
      logs.push(`   - 最终文件数量: ${finalFileCount}`);
    }

    logs.push(`🎉 项目生成完成！`);
    console.log(`🎉 项目生成完成！`);

    return {
      success: true,
      message: `项目 ${projectName} 创建成功！

📁 项目路径: ${projectPath}
🛠️  技术栈: ${techStackToArray(normalizedTechStack).join(" + ")}
📦 文件数量: ${finalFileCount}

下一步:
  cd ${projectName}
  npm run dev`,
      projectPath,
      directoryTree,
      fileSummary,
      processLogs: logs,
    };
  } catch (error: any) {
    logs.push(`❌ 项目生成失败: ${error.message || error}`);
    console.error(`❌ 项目生成失败:`, error);
    return {
      success: false,
      message: `项目生成失败: ${error.message || error}`,
      processLogs: logs,
    };
  }
}
