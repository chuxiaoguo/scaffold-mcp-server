// 脚手架生成相关类型定义

export interface TechStack {
  framework?: 'vue3' | 'react';
  builder?: 'vite' | 'webpack' | 'electron-vite' | 'umi';
  language?: 'typescript' | 'javascript';
  router?: 'vue-router' | 'react-router' | 'umi-router';
  state?: 'pinia' | 'vuex' | 'redux' | 'zustand' | 'dva';
  ui?: 'element-plus' | 'antd' | 'antd-vue';
  style?: 'css' | 'less' | 'sass' | 'tailwindcss';
  packageManager?: 'pnpm' | 'npm' | 'yarn';
}

export interface GenerateOptions {
  force?: boolean;
  install?: boolean;
  dryRun?: boolean;
  testRunner?: 'jest' | 'vitest';
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
}

export interface DirectoryTree {
  name: string;
  type: 'file' | 'directory';
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