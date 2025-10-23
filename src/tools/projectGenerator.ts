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

  // 创建一个新的技术栈对象，避免修改原始对象
  const filledTechStack: TechStack = { ...techStack };

  // 如果没有指定框架，根据其他信息推断
  if (!filledTechStack.framework) {
    if (filledTechStack.builder === "umi") {
      filledTechStack.framework = "react";
      logs.push(`   - 根据构建工具 umi 推断框架为 react`);
    } else if (filledTechStack.ui === "element-plus") {
      filledTechStack.framework = "vue3";
      logs.push(`   - 根据 UI 库 element-plus 推断框架为 vue3`);
    } else if (filledTechStack.ui === "antd") {
      filledTechStack.framework = "react";
      logs.push(`   - 根据 UI 库 antd 推断框架为 react`);
    }
  }

  // 如果没有指定语言，默认使用 TypeScript
  if (!filledTechStack.language) {
    filledTechStack.language = "typescript";
    logs.push(`   - 默认语言设置为 typescript`);
  }

  // 如果没有指定构建工具，根据框架推断
  if (!filledTechStack.builder) {
    if (filledTechStack.framework === "vue3") {
      filledTechStack.builder = "vite";
      logs.push(`   - 根据框架 vue3 推断构建工具为 vite`);
    } else if (filledTechStack.framework === "react") {
      filledTechStack.builder = "vite";
      logs.push(`   - 根据框架 react 推断构建工具为 vite`);
    }
  }

  // 如果没有指定样式方案，根据框架推断
  if (!filledTechStack.style) {
    if (filledTechStack.framework === "vue3") {
      filledTechStack.style = "sass";
      logs.push(`   - 根据框架 vue3 推断样式方案为 sass`);
    } else if (filledTechStack.framework === "react") {
      filledTechStack.style = "sass";
      logs.push(`   - 根据框架 react 推断样式方案为 sass`);
    }
  }

  // 如果没有指定路由，根据框架推断
  if (!filledTechStack.router) {
    if (filledTechStack.framework === "vue3") {
      filledTechStack.router = "vue-router";
      logs.push(`   - 根据框架 vue3 推断路由为 vue-router`);
    } else if (filledTechStack.framework === "react") {
      filledTechStack.router = "react-router";
      logs.push(`   - 根据框架 react 推断路由为 react-router`);
    }
  }

  // 如果没有指定状态管理，根据框架推断
  if (!filledTechStack.state) {
    if (filledTechStack.framework === "vue3") {
      filledTechStack.state = "pinia";
      logs.push(`   - 根据框架 vue3 推断状态管理为 pinia`);
    } else if (filledTechStack.framework === "react") {
      filledTechStack.state = "zustand";
      logs.push(`   - 根据框架 react 推断状态管理为 zustand`);
    }
  }

  logs.push(`   - 填充后技术栈: ${JSON.stringify(filledTechStack)}`);
  console.log(`   - 填充后技术栈: ${JSON.stringify(filledTechStack)}`);

  return filledTechStack;
}

/**
 * 从非固定模板生成项目
 */
export async function generateFromNonFixedTemplate(
  techStack: TechStack,
  projectName: string,
  logs: string[] = []
): Promise<TemplateResult> {
  logs.push(`🔧 使用动态生成模式...`);
  console.log(`🔧 使用动态生成模式...`);

  try {
    // 使用核心注入器管理器生成项目结构
    const coreInjectorManager = new CoreInjectorManager();
    const result = await coreInjectorManager.generateCoreStructure(techStack, projectName);

    logs.push(`✅ 动态生成完成`);
    logs.push(`   - 文件数量: ${Object.keys(result.files).length}`);
    console.log(`✅ 动态生成完成`);
    console.log(`   - 文件数量: ${Object.keys(result.files).length}`);

    return {
      files: result.files,
      packageJson: result.packageJson
    };
  } catch (error) {
    logs.push(`❌ 动态生成失败: ${error}`);
    console.error(`❌ 动态生成失败:`, error);
    throw error;
  }
}

/**
 * 生成模拟目录树
 */
function generateMockDirectoryTree(
  projectName: string,
  files: Record<string, string>,
  packageJson: any
): string {
  const tree: string[] = [];
  const filePaths = Object.keys(files).sort();
  const processedDirs = new Set<string>();

  tree.push(`${projectName}/`);

  // 添加 package.json
  tree.push(`  package.json`);

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    
    // 处理目录结构
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join('/');
      if (!processedDirs.has(dirPath)) {
        const indent = '  '.repeat(i + 1);
        const dirName = parts[i];
        tree.push(`${indent}${dirName}/`);
        processedDirs.add(dirPath);
      }
    }

    // 处理文件
    const indent = '  '.repeat(parts.length);
    const fileName = parts[parts.length - 1];
    tree.push(`${indent}${fileName}`);
  }

  return tree.join('\n');
}

/**
 * 生成模拟文件摘要
 */
function generateMockFileSummary(
  files: Record<string, string>,
  packageJson: any,
  projectName: string
): string[] {
  const summaries: string[] = [];
  let fileCount = 0;

  // 添加 package.json
  summaries.push(`📄 package.json (预计1KB) - 项目配置文件`);
  fileCount++;

  for (const [filePath, content] of Object.entries(files)) {
    const fileName = path.basename(filePath);
    const lines = content.split('\n').length;
    const sizeKB = Math.ceil(content.length / 1024);
    const sizeStr = sizeKB > 0 ? `${sizeKB}KB` : `${content.length}B`;
    
    let contentType = "代码文件";
    const ext = path.extname(fileName);
    
    if (ext === '.md') {
      contentType = "Markdown 文档";
    } else if (ext === '.json') {
      contentType = "JSON 配置";
    } else if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      contentType = `${ext.slice(1).toUpperCase()} 代码文件`;
    } else if (['.vue', '.svelte'].includes(ext)) {
      contentType = `${ext.slice(1).toUpperCase()} 组件`;
    } else if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
      contentType = `${ext.slice(1).toUpperCase()} 样式文件`;
    } else if (['.html', '.htm'].includes(ext)) {
      contentType = "HTML 文件";
    } else {
      contentType = `${ext ? ext.slice(1).toUpperCase() : "文本"} 文件 (${lines} 行)`;
    }

    summaries.push(`📄 ${fileName} (预计${sizeStr}) - ${contentType}`);
    fileCount++;
  }

  return summaries;
}

// 导入并重新导出向后兼容的 generateProject 函数
import { generateProject as legacyGenerateProject } from '../core/BackwardCompatibilityAdapter.js';

/**
 * 兼容的 generateProject 函数
 * 重新导出向后兼容适配器的函数
 */
export const generateProject = legacyGenerateProject;
