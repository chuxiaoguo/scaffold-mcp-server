import type { TechStack, TemplateConfig, TemplatesConfigIndex, UnifiedTemplateInfo } from '../types/index.js';
import { IntentRecognizer } from './intentRecognizer.js';
import { getTemplateConfigManager } from './config/templateConfigManager.js';

// 固定模板配置（通过模板配置索引驱动）
let TEMPLATES_INDEX_CACHE: TemplatesConfigIndex | null = null;

async function loadTemplatesIndex(): Promise<TemplatesConfigIndex | null> {
  if (TEMPLATES_INDEX_CACHE) return TEMPLATES_INDEX_CACHE;
  const manager = getTemplateConfigManager();
  const idx = await manager.getTemplatesIndex();
  TEMPLATES_INDEX_CACHE = idx;
  return idx;
}

// 技术栈别名映射
const TECH_ALIASES: Record<string, string> = {
  // 框架别名
  'vue': 'vue3',
  'vue.js': 'vue3',
  'vuejs': 'vue3',
  // 保持 vue2 原样，不映射为 vue3
  'vue2': 'vue2',
  'react.js': 'react',
  'reactjs': 'react',
  
  // 构建工具别名
  'vitejs': 'vite',
  'vite.js': 'vite',
  'webpack.js': 'webpack',
  'electron-vite': 'electron-vite',
  'electron': 'electron',
  
  // 语言别名
  'ts': 'typescript',
  'js': 'javascript',
  
  // 路由别名
  'router': 'vue-router',
  'vue-router': 'vue-router',
  'react-router-dom': 'react-router',
  
  // 状态管理别名
  'store': 'pinia',
  'vuex': 'vuex',
  'redux': 'redux',
  'zustand': 'zustand',
  
  // UI库别名
  'element': 'element-plus',
  // 修正：element-ui 应该保持原样，不映射为 element-plus
  'element-ui': 'element-ui',
  'el': 'element-plus',
  'antd': 'antd',
  'ant-design': 'antd',
  'ant-design-vue': 'antd-vue',
  'antdv': 'antd-vue',
  
  // 样式别名
  'scss': 'sass',
  'stylus': 'stylus',
  'tailwind': 'tailwindcss',
  'tw': 'tailwindcss',
  
  // 包管理器别名
  'yarn': 'yarn',
  'npm': 'npm'
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
    
    for (const tech of techs) {
      const normalizedTech = TECH_ALIASES[tech.toLowerCase()] || tech.toLowerCase();
      assignTechToStack(techStack, normalizedTech);
    }
  }
  
  return techStack;
}

/**
 * 匹配固定模板
 */
export async function matchFixedTemplate(input: string | string[]): Promise<TemplateConfig | null> {
  // 使用配置驱动的智能匹配（配置索引）
  const result = await smartMatchFixedTemplate(input);
  return result.template;
}

/**
 * 智能匹配固定模板（新增函数）
 * 使用IntentRecognizer进行更智能的匹配
 */
export async function smartMatchFixedTemplate(input: string | string[]): Promise<{
  template: TemplateConfig | null;
  analysis: {
    canUseFixedTemplate: boolean;
    recommendedTemplate?: string;
    reason: string;
    suggestions?: string[];
  };
}> {
  const parsedStack = parseTechStack(input);
  const techTokens = extractTechnologies(Array.isArray(input) ? input.join(' ') : String(input));
  const best = await computeBestMatch(parsedStack, techTokens);

  if (!best) {
    const old = IntentRecognizer.analyzeTechStack(parsedStack);
    return {
      template: old.recommendedTemplate ? { name: old.recommendedTemplate, description: old.recommendedTemplate, techStack: {}, aliases: [] } as unknown as TemplateConfig : null,
      analysis: old
    };
  }

  const tmpl: TemplateConfig = {
    name: best.entry.name,
    description: best.entry.description || best.entry.name,
    techStack: {
      framework: (best.entry.matching.core.framework || [])[0] as any,
      builder: (best.entry.matching.core.builder || [])[0] as any,
      language: (best.entry.matching.core.language || [])[0] as any
    },
    aliases: []
  };

  return {
    template: tmpl,
    analysis: {
      canUseFixedTemplate: true,
      recommendedTemplate: best.entry.name,
      reason: `匹配到配置模板 ${best.entry.name}，得分 ${best.score}`,
      suggestions: [`优先使用固定模板以获得更稳定的脚手架`]
    }
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
  return { name, description: name, techStack: {}, aliases: [] } as unknown as TemplateConfig;
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
  const parts = input.split(separators)
    .map(tech => tech.trim())
    .filter(tech => tech.length > 0);
  
  // 处理element-plus的特殊情况
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    if (!current) continue; // 跳过空值
    
    const next = i + 1 < parts.length ? parts[i + 1] : undefined;
    
    // 如果当前是element，下一个是plus，合并为element-plus
    if (current === 'element' && next === 'plus') {
      result.push('element-plus');
      i++; // 跳过下一个
    } else {
      result.push(current);
    }
  }
  
  return result;
}

/**
 * 将技术分配到技术栈对象
 */
function assignTechToStack(techStack: TechStack, tech: string): void {
  // 框架
  if (['vue3', 'vue2', 'react'].includes(tech)) {
    techStack.framework = tech as 'vue3' | 'vue2' | 'react';
  }
  
  // 构建工具
  if (['vite', 'webpack', 'electron-vite', 'umi'].includes(tech)) {
    techStack.builder = tech as 'vite' | 'webpack' | 'electron-vite' | 'umi';
  }
  
  // 特殊处理：electron 作为构建工具时映射到 electron-vite
  if (tech === 'electron') {
    techStack.builder = 'electron-vite';
  }
  
  // 语言
  if (['typescript', 'javascript'].includes(tech)) {
    techStack.language = tech as 'typescript' | 'javascript';
  }
  
  // 路由
  if (['vue-router', 'react-router'].includes(tech)) {
    techStack.router = tech as 'vue-router' | 'react-router';
  }
  
  // 状态管理
  if (['pinia', 'vuex', 'redux', 'zustand'].includes(tech)) {
    techStack.state = tech as 'pinia' | 'vuex' | 'redux' | 'zustand';
  }
  
  // UI库
  if (['element-plus', 'element-ui', 'antd', 'antd-vue'].includes(tech)) {
    techStack.ui = tech as 'element-plus' | 'element-ui' | 'antd' | 'antd-vue';
  }
  
  // 样式
  if (['css', 'less', 'sass', 'tailwindcss'].includes(tech)) {
    techStack.style = tech as 'css' | 'less' | 'sass' | 'tailwindcss';
  }
  
  // 包管理器
  if (['pnpm', 'npm', 'yarn'].includes(tech)) {
    techStack.packageManager = tech as 'pnpm' | 'npm' | 'yarn';
  }
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
async function computeBestMatch(parsedStack: TechStack, techTokens: string[]): Promise<{ entry: UnifiedTemplateInfo; score: number } | null> {
  const index = await loadTemplatesIndex();
  if (!index) return null;

  let best: { entry: UnifiedTemplateInfo; score: number } | null = null;

  for (const entry of Object.values(index.templates)) {
    const conflicts = entry.matching.conflicts || [];
    const hasConflict = conflicts.some(c => techTokens.includes(c.toLowerCase()));
    if (hasConflict) continue;

    let score = 0;
    // 核心字段评分：存在于用户输入且命中配置的，每个+100
    const required = entry.matching.required || ['framework'];
    const core = entry.matching.core || {};

    // 框架必须命中
    const frameworkOk = parsedStack.framework && (core.framework || []).includes(parsedStack.framework);
    if (!frameworkOk) continue;
    if (parsedStack.framework) score += 100;

    // 构建工具（如用户提供则必须命中）
    if (parsedStack.builder) {
      const builderOk = (core.builder || []).includes(parsedStack.builder);
      if (!builderOk) continue;
      score += 100;
    }

    // 语言（如果用户提供则参与评分，不作为硬性过滤）
    if (parsedStack.language) {
      const langOk = (core.language || []).includes(parsedStack.language);
      if (langOk) score += 100;
    }

    // 可选项评分：每命中一项+10
    const optional = entry.matching.optional || {};
    for (const [key, values] of Object.entries(optional)) {
      const field = key as keyof TechStack;
      const val = parsedStack[field];
      if (val && (values || []).includes(val)) {
        score += 10;
      }
    }

    if (!best || score > best.score || (score === best.score && (entry.priority || 0) > (best.entry.priority || 0))) {
      best = { entry, score };
    }
  }

  return best;
}

// 覆盖 smartMatchFixedTemplate 的实现，利用 computeBestMatch
// 删除同步包装，统一使用异步 API