import type { TechStack, TemplateConfig } from '../types/index.js';

// 固定模板配置
const FIXED_TEMPLATES: TemplateConfig[] = [
  {
    name: 'vue3-vite-typescript',
    techStack: {
      framework: 'vue3',
      builder: 'vite',
      language: 'typescript',
      router: 'vue-router',
      state: 'pinia',
      ui: 'element-plus',
      style: 'tailwindcss',
      packageManager: 'pnpm'
    },
    aliases: [
      'vue3+ts',
      'vue3+typescript',
      'vue3-ts',
      'vue3-typescript',
      'vue3+vite+ts',
      'vue3+vite+typescript'
    ],
    description: 'Vue3 + Vite + TypeScript + Element Plus + Pinia + Vue Router + TailwindCSS'
  },
  {
    name: 'electron-vite-vue3',
    techStack: {
      framework: 'vue3',
      builder: 'electron-vite',
      language: 'typescript',
      router: 'vue-router',
      state: 'pinia',
      ui: 'element-plus',
      style: 'tailwindcss',
      packageManager: 'pnpm'
    },
    aliases: [
      'electron+vue3',
      'electron+vue3+ts',
      'electron-vue3',
      'electron-vue3-ts'
    ],
    description: 'Electron + Vite + Vue3 + TypeScript + Element Plus + Pinia + Vue Router + TailwindCSS'
  },
  {
    name: 'react-webpack-typescript',
    techStack: {
      framework: 'react',
      builder: 'webpack',
      language: 'typescript',
      router: 'react-router',
      state: 'redux',
      ui: 'antd',
      style: 'tailwindcss',
      packageManager: 'npm'
    },
    aliases: [
      'react+webpack+ts',
      'react+webpack+typescript',
      'react-webpack-ts',
      'cra+ts',
      'create-react-app+ts'
    ],
    description: 'React + Webpack + TypeScript + Ant Design + Redux + TailwindCSS'
  },
  {
    name: 'umijs',
    techStack: {
      framework: 'react',
      builder: 'umi',
      language: 'typescript',
      router: 'umi-router',
      state: 'dva',
      ui: 'antd',
      style: 'tailwindcss',
      packageManager: 'pnpm'
    },
    aliases: [
      'umi',
      'umijs+react',
      'umi+antd',
      'umi+ts'
    ],
    description: 'UmiJS + React + TypeScript + Ant Design + DVA + TailwindCSS'
  }
];

// 技术栈别名映射
const TECH_ALIASES: Record<string, string> = {
  // 框架别名
  'vue': 'vue3',
  'vue.js': 'vue3',
  'vuejs': 'vue3',
  'react.js': 'react',
  'reactjs': 'react',
  
  // 构建工具别名
  'vitejs': 'vite',
  'vite.js': 'vite',
  'webpack.js': 'webpack',
  'electron-vite': 'electron-vite',
  
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
  'element-ui': 'element-plus',
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
export function matchFixedTemplate(input: string | string[]): TemplateConfig | null {
  const inputStr = Array.isArray(input) ? input.join(' ') : input;
  const normalized = normalizeInput(inputStr);
  
  // 直接匹配别名
  for (const template of FIXED_TEMPLATES) {
    for (const alias of template.aliases) {
      if (normalized === normalizeInput(alias)) {
        return template;
      }
    }
  }
  
  // 解析技术栈进行匹配
  const parsedStack = parseTechStack(input);
  
  for (const template of FIXED_TEMPLATES) {
    if (isTechStackMatch(parsedStack, template.techStack)) {
      return template;
    }
  }
  
  return null;
}

/**
 * 获取所有固定模板
 */
export function getFixedTemplates(): TemplateConfig[] {
  return FIXED_TEMPLATES;
}

/**
 * 根据名称获取模板
 */
export function getTemplateByName(name: string): TemplateConfig | null {
  return FIXED_TEMPLATES.find(template => template.name === name) || null;
}

// 辅助函数

/**
 * 标准化输入字符串
 */
function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[+\s-_]/g, '')
    .replace(/[^\w]/g, '');
}

/**
 * 从字符串中提取技术栈
 */
function extractTechnologies(input: string): string[] {
  // 分割字符串
  const separators = /[+\s,;|&-]+/;
  return input.split(separators)
    .map(tech => tech.trim())
    .filter(tech => tech.length > 0);
}

/**
 * 将技术分配到技术栈对象
 */
function assignTechToStack(techStack: TechStack, tech: string): void {
  // 框架
  if (['vue3', 'react'].includes(tech)) {
    techStack.framework = tech as 'vue3' | 'react';
  }
  
  // 构建工具
  if (['vite', 'webpack', 'electron-vite'].includes(tech)) {
    techStack.builder = tech as 'vite' | 'webpack' | 'electron-vite';
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
  if (['element-plus', 'antd', 'antd-vue'].includes(tech)) {
    techStack.ui = tech as 'element-plus' | 'antd' | 'antd-vue';
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