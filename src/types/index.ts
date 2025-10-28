// 脚手架生成相关类型定义

export interface TechStack {
  framework?: "vue3" | "vue2" | "react";
  builder?: "vite" | "webpack" | "electron-vite" | "umi";
  language?: "typescript" | "javascript";
  router?: "vue-router" | "react-router" | "umi-router";
  state?: "pinia" | "vuex" | "redux" | "zustand" | "dva";
  ui?: "element-plus" | "element-ui" | "antd" | "antd-vue";
  style?: "css" | "less" | "sass" | "tailwindcss";
  packageManager?: "pnpm" | "npm" | "yarn";
}

export interface GenerateOptions {
  force?: boolean;
  dryRun?: boolean;
  testRunner?: "jest" | "vitest";
  autoCreateDir?: boolean; // 添加自动创建目录选项，默认为true
}

export interface GenerateScaffoldParams {
  tech_stack: string | string[];
  project_name?: string;
  output_dir?: string;
  extra_tools?: string[];
  options?: GenerateOptions;
}

export interface GenerateResult {
  projectName: string;
  targetPath: string;
  tree: DirectoryTree;
  files: FileSummary[];
  templateSource?: string; // 模板来源信息
  processLogs?: string[]; // 过程日志，用于排查问题（后续会移除）
  directoryTree?: string; // 目录树字符串表示，用于dry run模式
}

export interface DirectoryTree {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: DirectoryTree[];
}

export interface FileSummary {
  path: string;
  size: number;
  type: string;
  summary?: string;
}

export interface TemplateConfig {
  name: string;
  techStack: TechStack;
  aliases: string[];
  description: string;
}

// 配置驱动模板匹配相关类型
export interface TemplateMatchingRules {
  required?: (keyof TechStack)[];
  core: Partial<Record<keyof TechStack, string[]>>;
  optional?: Partial<Record<keyof TechStack, string[]>>;
  conflicts?: string[];
}

export interface UnifiedTemplateInfo {
  name: string;
  version?: string;
  description?: string;
  matching: TemplateMatchingRules;
  priority?: number;
  tags?: string[];
}

export interface TemplatesConfigIndex {
  version: string;
  lastUpdated: string;
  templates: Record<string, UnifiedTemplateInfo>;
}

// ============ 统一注入系统类型定义 ============

/**
 * 注入器分类
 */
export enum InjectorCategory {
  LANGUAGE = "language", // 语言层：TypeScript, JavaScript
  FRAMEWORK = "framework", // 框架层：Vue3, React, UmiJS
  BUILDER = "builder", // 构建层：Vite, Webpack
  STYLING = "styling", // 样式层：Tailwind, Sass, Less
  UI_LIBRARY = "ui-library", // UI库层：Element Plus, Antd, Vuetify
  CODE_QUALITY = "code-quality", // 代码质量层：ESLint, Prettier, Stylelint
  TESTING = "testing", // 测试层：Jest, Vitest
  GIT_TOOLS = "git-tools", // Git工具层：Husky, Commitlint, LintStaged
}

/**
 * 注入器优先级常量
 */
export const InjectorPriority = {
  LANGUAGE: 10, // 语言层
  FRAMEWORK: 20, // 框架层
  BUILDER: 30, // 构建层
  STYLING: 40, // 样式层
  UI_LIBRARY: 50, // UI库层
  CODE_QUALITY: 60, // 代码质量层
  TESTING: 70, // 测试层
  GIT_TOOLS: 80, // Git工具层
} as const;

/**
 * 统一注入上下文
 */
export interface UnifiedInjectionContext {
  projectName: string;
  projectPath: string;
  files: Record<string, string>; // 文件映射
  packageJson: any; // package.json对象
  tools: string[]; // 完整工具集
  framework?: string; // 框架类型
  buildTool?: string; // 构建工具
  language?: string; // 开发语言
  techStack?: TechStack; // 完整技术栈信息
  logs: string[]; // 日志记录
}

/**
 * 统一注入结果
 */
export interface UnifiedInjectionResult {
  files: Record<string, string>;
  packageJson: any;
  logs: string[];
  success: boolean;
  errors?: string[];
}

/**
 * 统一注入器接口
 */
export interface UnifiedInjector {
  // 基础信息
  name: string; // 工具名称
  priority: number; // 执行优先级 (数字越小越先执行)
  category: InjectorCategory; // 工具分类

  // 依赖管理
  dependencies?: string[]; // 依赖的其他工具
  conflicts?: string[]; // 冲突的工具

  // 执行方法
  canHandle(tools: string[]): boolean; // 判断是否需要执行
  inject(context: UnifiedInjectionContext): Promise<UnifiedInjectionResult>;
}
