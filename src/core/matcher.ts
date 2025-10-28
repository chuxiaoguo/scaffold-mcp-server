import type {
  TechStack,
  TemplateConfig,
  TemplatesConfigIndex,
  UnifiedTemplateInfo,
} from "../types/index.js";
import { getTemplateConfigManager } from "./config/templateConfigManager.js";
import {
  SmartMatcher,
  type MatchResult,
  type SmartMatchOptions,
} from "./matcher/SmartMatcher.js";
import { type TemplateEntry } from "./matcher/ScoreCalculator.js";

// 固定模板配置（通过模板配置索引驱动）
let TEMPLATES_INDEX_CACHE: TemplatesConfigIndex | null = null;

async function loadTemplatesIndex(): Promise<TemplatesConfigIndex | null> {
  if (TEMPLATES_INDEX_CACHE) return TEMPLATES_INDEX_CACHE;
  const manager = getTemplateConfigManager();
  const result = await manager.getTemplatesIndex();
  TEMPLATES_INDEX_CACHE = result.config;
  return result.config;
}

// 技术栈别名映射
const TECH_ALIASES: Record<string, string> = {
  // 框架别名
  vue: "vue3",
  "vue.js": "vue3",
  vuejs: "vue3",
  // 保持 vue2 原样，不映射为 vue3
  vue2: "vue2",
  "react.js": "react",
  reactjs: "react",

  // 构建工具别名
  vitejs: "vite",
  "vite.js": "vite",
  "webpack.js": "webpack",
  "electron-vite": "electron-vite",
  electron: "electron",
  umi: "umi",
  umijs: "umi",

  // 语言别名
  ts: "typescript",
  js: "javascript",

  // 路由别名
  router: "vue-router",
  "vue-router": "vue-router",
  "react-router-dom": "react-router",

  // 状态管理别名
  store: "pinia",
  vuex: "vuex",
  redux: "redux",
  zustand: "zustand",

  // UI库别名
  element: "element-plus",
  // 修正：element-ui 应该保持原样，不映射为 element-plus
  "element-plus": "element-plus",
  "element-ui": "element-ui",
  el: "element-plus",
  antd: "antd",
  "ant-design": "antd",
  "ant-design-vue": "antd-vue",
  antdv: "antd-vue",

  // 样式别名
  scss: "sass",
  stylus: "stylus",
  tailwind: "tailwindcss",
  tw: "tailwindcss",

  // 包管理器别名
  yarn: "yarn",
  npm: "npm",
  pnpm: "pnpm",
};

/**
 * 解析技术栈字符串或数组
 */
export function parseTechStack(input: string | string[]): TechStack {
  const techStack: TechStack = {};

  // 统一处理为数组
  const items = Array.isArray(input) ? input : [input];

  // 解析每个项目
  for (const item of items) {
    const normalized = normalizeInput(item);
    const techs = extractTechnologies(normalized);

    // 将技术名称标准化
    const normalizedTechs = techs.map(
      (tech) => TECH_ALIASES[tech.toLowerCase()] || tech.toLowerCase()
    );

    // 检查是否包含 electron，用于特殊处理
    const hasElectron =
      normalizedTechs.includes("electron") ||
      normalizedTechs.includes("electron-vite");

    // 第一遍：先解析框架，确保框架信息在解析UI库之前就确定
    for (const tech of normalizedTechs) {
      assignFrameworkToStack(techStack, tech);
    }

    // 第二遍：解析其他技术栈组件，此时框架已确定
    for (const tech of normalizedTechs) {
      assignTechToStack(techStack, tech, hasElectron, techStack.framework);
    }
  }

  // 设置默认值 - 根据框架智能选择默认语言
  if (!techStack.language) {
    // Vue 2 默认使用 JavaScript（更简单，避免装饰器复杂性）
    // Vue 3 和 React 默认使用 TypeScript（现代化开发）
    if (techStack.framework === "vue2") {
      techStack.language = "javascript";
    } else {
      techStack.language = "typescript";
    }
  }
  if (!techStack.packageManager) {
    techStack.packageManager = "npm";
  }

  return techStack;
}

/**
 * 匹配固定模板
 */
export async function matchFixedTemplate(
  input: string | string[]
): Promise<TemplateConfig | null> {
  // 使用配置驱动的智能匹配（配置索引）
  const result = await smartMatchFixedTemplate(input);
  return result.template;
}

/**
 * 智能匹配固定模板（新增函数）
 */
export async function smartMatchFixedTemplate(
  input: string | string[]
): Promise<{
  template: TemplateConfig | null;
  analysis: {
    canUseFixedTemplate: boolean;
    recommendedTemplate?: string;
    reason: string;
    suggestions?: string[];
  };
}> {
  // 使用新的智能匹配器
  const newMatchResult = await smartMatchWithNewMatcher(input);
  if (newMatchResult.template) {
    const analysis: {
      canUseFixedTemplate: boolean;
      recommendedTemplate?: string;
      reason: string;
      suggestions?: string[];
    } = {
      canUseFixedTemplate: newMatchResult.analysis.canUseFixedTemplate,
      reason: newMatchResult.analysis.reason,
    };

    if (newMatchResult.analysis.recommendedTemplate) {
      analysis.recommendedTemplate =
        newMatchResult.analysis.recommendedTemplate;
    }
    if (newMatchResult.analysis.suggestions) {
      analysis.suggestions = newMatchResult.analysis.suggestions;
    }

    return {
      template: newMatchResult.template,
      analysis,
    };
  }

  // 回退到空结果
  return {
    template: null,
    analysis: {
      canUseFixedTemplate: false,
      reason: "未找到匹配的模板",
    },
  };
}

/**
 * 获取所有固定模板
 */
export function getFixedTemplates(): TemplateConfig[] {
  // 兼容旧接口：将配置索引映射为 TemplateConfig（最小字段）
  const fallback: TemplateConfig[] = [];
  // 注意：此函数为同步接口，返回空列表或占位。调用方应使用 smartMatchFixedTemplate。
  return fallback;
}

/**
 * 根据名称获取模板
 */
export function getTemplateByName(name: string): TemplateConfig | null {
  // 通过配置索引查找
  // 由于该函数为同步接口，提供最小兼容：返回仅包含名称的模板占位
  return {
    name,
    description: name,
    techStack: {},
    aliases: [],
  } as unknown as TemplateConfig;
}

// 辅助函数

/**
 * 标准化输入字符串
 */
function normalizeInput(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * 从字符串中提取技术栈
 */
function extractTechnologies(input: string): string[] {
  // 分割字符串，但保持element-plus作为整体
  const separators = /[+\s,;|&]+/;
  const parts = input
    .split(separators)
    .map((tech) => tech.trim())
    .filter((tech) => tech.length > 0);

  // 处理element-plus的特殊情况
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    if (!current) continue; // 跳过空值

    const next = i + 1 < parts.length ? parts[i + 1] : undefined;

    // 如果当前是element，下一个是plus，合并为element-plus
    if (current === "element" && next === "plus") {
      result.push("element-plus");
      i++; // 跳过下一个
    } else {
      result.push(current);
    }
  }

  return result;
}

/**
 * 专门处理框架解析的函数
 */
function assignFrameworkToStack(techStack: TechStack, tech: string): void {
  // 框架解析
  if (["vue3", "vue2", "react"].includes(tech)) {
    techStack.framework = tech as "vue3" | "vue2" | "react";
  }
  // umi 特殊处理
  if (tech === "umi") {
    techStack.framework = "react";
  }
}

/**
 * 将技术分配到技术栈对象（增强版）
 */
function assignTechToStack(
  techStack: TechStack,
  tech: string,
  hasElectron: boolean = false,
  framework?: string
): void {
  // 跳过框架，已在第一遍处理
  if (["vue3", "vue2", "react", "umi"].includes(tech)) {
    return;
  }

  // 特殊处理：electron 作为构建工具时映射到 electron-vite，优先级最高
  if (tech === "electron") {
    techStack.builder = "electron-vite";
    return; // 提前返回，避免被后续的 vite 覆盖
  }

  // 构建工具 - electron-vite 优先级最高，避免被普通 vite 覆盖
  if (["vite", "webpack", "electron-vite", "umi"].includes(tech)) {
    // 如果已经设置了 electron-vite，不要被普通 vite 覆盖
    if (techStack.builder === "electron-vite" && tech === "vite") {
      return;
    }
    // 如果有 electron，vite 应该设置为 electron-vite
    if (tech === "vite" && hasElectron) {
      techStack.builder = "electron-vite";
    } else {
      techStack.builder = tech as "vite" | "webpack" | "electron-vite" | "umi";
    }
  }

  // 语言
  if (["typescript", "javascript"].includes(tech)) {
    techStack.language = tech as "typescript" | "javascript";
  }

  // 路由
  if (["vue-router", "react-router"].includes(tech)) {
    techStack.router = tech as "vue-router" | "react-router";
  }

  // 状态管理
  if (["pinia", "vuex", "redux", "zustand"].includes(tech)) {
    techStack.state = tech as "pinia" | "vuex" | "redux" | "zustand";
  }

  // UI库 - 智能选择基于框架版本
  if (["element-plus", "element-ui", "antd", "antd-vue"].includes(tech)) {
    // 特殊处理 element，根据框架版本智能选择
    if (tech === "element-plus" || tech === "element") {
      if (framework === "vue3" || !framework) {
        techStack.ui = "element-plus";
      } else if (framework === "vue2") {
        techStack.ui = "element-ui";
      }
    } else {
      techStack.ui = tech as
        | "element-plus"
        | "element-ui"
        | "antd"
        | "antd-vue";
    }
  }

  // 样式
  if (["css", "less", "sass", "tailwindcss"].includes(tech)) {
    techStack.style = tech as "css" | "less" | "sass" | "tailwindcss";
  }

  // 包管理器
  if (["pnpm", "npm", "yarn"].includes(tech)) {
    techStack.packageManager = tech as "pnpm" | "npm" | "yarn";
  }
}

/**
 * 将技术栈转换为字符串数组格式
 */
export function techStackToArray(techStack: TechStack): string[] {
  return [
    techStack.framework,
    techStack.builder,
    techStack.language,
    techStack.style,
    techStack.ui,
    techStack.state,
    techStack.router,
    techStack.packageManager,
  ].filter(Boolean) as string[];
}

/**
 * 处理 buildTool 参数映射到 builder
 */
export function normalizeTechStack(tech_stack: any): TechStack {
  const techStack =
    typeof tech_stack === "string" || Array.isArray(tech_stack)
      ? parseTechStack(tech_stack)
      : tech_stack;

  // 处理 buildTool 参数映射到 builder
  if (
    typeof tech_stack === "object" &&
    tech_stack !== null &&
    !Array.isArray(tech_stack)
  ) {
    const objStack = tech_stack as any;
    if (objStack.buildTool) {
      techStack.builder = objStack.buildTool;
    }
    if (objStack.framework) {
      techStack.framework = objStack.framework;
    }
    if (objStack.language) {
      techStack.language = objStack.language;
    }
  }

  // 确保 electron-vite 不会被错误地转换
  // 如果是 electron-vite 构建器，自动推断框架
  if (techStack.builder === "electron-vite" && !techStack.framework) {
    techStack.framework = "vue3"; // electron-vite 默认使用 vue3
  }

  return techStack;
}

/**
 * 检查技术栈是否匹配
 */
function isTechStackMatch(parsed: TechStack, template: TechStack): boolean {
  const keys = Object.keys(parsed) as (keyof TechStack)[];

  // 至少要匹配主要技术栈（框架和构建工具）
  if (parsed.framework && parsed.framework !== template.framework) {
    return false;
  }

  if (parsed.builder && parsed.builder !== template.builder) {
    return false;
  }

  // 检查其他匹配项
  for (const key of keys) {
    if (parsed[key] && template[key] && parsed[key] !== template[key]) {
      return false;
    }
  }

  return true;
}

/**
 * 使用模板配置索引计算最优匹配
 */
/**
 * 使用新的智能匹配器进行模板匹配
 */
export async function smartMatchWithNewMatcher(
  input: string | string[]
): Promise<{
  template: TemplateConfig | null;
  analysis: {
    canUseFixedTemplate: boolean;
    recommendedTemplate?: string;
    reason: string;
    suggestions?: string[];
    matchType?: "direct" | "smart" | "fallback";
    confidence?: number;
  };
}> {
  const parsedStack = parseTechStack(input);
  const userInput = Array.isArray(input) ? input.join(" ") : String(input);

  // 获取模板索引并转换为TemplateEntry格式
  const index = await loadTemplatesIndex();
  if (!index) {
    return {
      template: null,
      analysis: {
        canUseFixedTemplate: false,
        reason: "无法加载模板配置",
        suggestions: ["请检查模板配置文件是否存在"],
      },
    };
  }

  // 转换模板格式
  const templates: TemplateEntry[] = Object.values(index.templates).map(
    (entry) => ({
      name: entry.name,
      description: entry.description || entry.name,
      keywords: (entry as any).keywords || [], // 临时类型断言
      matching: entry.matching,
      priority: entry.priority || 0,
    })
  );

  // 使用新的智能匹配器
  const matchResult = SmartMatcher.matchTemplate(
    parsedStack,
    userInput,
    templates,
    {
      enableKeywordMatch: true,
      minScore: 30,
      fallbackToDefault: true,
      defaultTemplate: "vue3-vite-typescript",
    }
  );

  if (!matchResult) {
    return {
      template: null,
      analysis: {
        canUseFixedTemplate: false,
        reason: "未找到匹配的模板",
        suggestions: ["尝试使用更具体的技术栈描述", "检查输入的技术栈是否支持"],
      },
    };
  }

  // 转换为TemplateConfig格式
  const template: TemplateConfig = {
    name: matchResult.template.name,
    description: matchResult.template.description,
    techStack: {
      framework: (matchResult.template.matching.core?.framework ||
        [])[0] as any,
      builder: (matchResult.template.matching.core?.builder || [])[0] as any,
      language: (matchResult.template.matching.core?.language || [])[0] as any,
    },
    aliases: [],
  };

  return {
    template,
    analysis: {
      canUseFixedTemplate: true,
      recommendedTemplate: matchResult.template.name,
      reason: `使用${matchResult.matchType === "direct" ? "直接关键词" : matchResult.matchType === "smart" ? "智能积分" : "默认回退"}匹配到模板 ${matchResult.template.name}，总分 ${matchResult.score.totalScore}，置信度 ${(matchResult.confidence * 100).toFixed(1)}%`,
      suggestions: [
        matchResult.matchType === "fallback"
          ? "建议提供更具体的技术栈信息以获得更准确的匹配"
          : "匹配度较高，建议使用此模板",
      ],
      matchType: matchResult.matchType,
      confidence: matchResult.confidence,
    },
  };
}

// 覆盖 smartMatchFixedTemplate 的实现，利用 computeBestMatch
// 删除同步包装，统一使用异步 API
