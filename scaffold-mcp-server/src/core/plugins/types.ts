/**
 * 插件系统类型定义
 */

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  category: 'linter' | 'formatter' | 'builder' | 'framework' | 'testing' | 'utility' | 'other';
}

export interface ActivationCondition {
  // 基于技术栈的激活条件
  techStack?: {
    framework?: string[];
    builder?: string[];
    language?: string[];
    features?: string[];
  };
  // 基于文件存在的激活条件
  files?: {
    exists?: string[];
    notExists?: string[];
    patterns?: string[];
  };
  // 基于其他插件的激活条件
  plugins?: {
    requires?: string[];
    conflicts?: string[];
    optional?: string[];
  };
  fileExists?: string[];
  dependencies?: string[];
  // 自定义激活函数
  custom?: string; // 函数名或表达式
}

export interface PluginDependency {
  name: string;
  version: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
  condition?: string; // 条件表达式
}

export interface PluginScript {
  name: string;
  command: string;
  description?: string;
  condition?: string;
  priority?: number; // 用于脚本合并时的优先级
}

export interface FileTemplate {
  path: string;
  content?: string;
  encoding?: 'utf8' | 'base64';
  condition?: string;
  mergeStrategy?: 'replace' | 'merge' | 'append' | 'prepend';
  variables?: Record<string, any>;
}

export interface PluginIntegration {
  // 与其他工具的集成配置
  eslint?: {
    extends?: string[];
    plugins?: string[];
    rules?: Record<string, any>;
    overrides?: any[];
  };
  prettier?: {
    extends?: string;
    overrides?: any[];
  };
  typescript?: {
    compilerOptions?: Record<string, any>;
    include?: string[];
    exclude?: string[];
  };
  vite?: {
    plugins?: string[];
    config?: Record<string, any>;
  };
  webpack?: {
    plugins?: string[];
    config?: Record<string, any>;
  };
  // 可扩展的集成配置
  [key: string]: any;
}

export interface PluginConfig {
  metadata: PluginMetadata;
  activation: ActivationCondition;
  dependencies?: PluginDependency[];
  scripts?: PluginScript[];
  files?: FileTemplate[];
  integration?: PluginIntegration;
  defaultConfig?: Record<string, any>;
  hooks?: {
    beforeActivation?: string;
    afterActivation?: string;
    beforeDeactivation?: string;
    afterDeactivation?: string;
  };
}

export interface TechStack {
  language?: string[];
  framework?: string[];
  builder?: string[];
  features?: string[];
}

export interface PluginContext {
  techStack: TechStack;
  projectName: string;
  outputDir: string;
  extraTools: string[];
  userConfig: Record<string, any>;
  activePlugins: string[];
  hasFile: (filePath: string) => boolean;
}

export interface MergedConfig {
  dependencies?: Record<string, PluginDependency>;
  scripts?: Record<string, PluginScript>;
  files?: FileTemplate[];
  integration?: Record<string, any>;
  defaultConfig?: Record<string, any>;
}

export interface ConflictResolution {
  type: 'dependency' | 'script' | 'file' | 'config';
  conflictingPlugins: string[];
  resolution: 'merge' | 'override' | 'skip' | 'error';
  details?: any;
}

export interface PluginValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}