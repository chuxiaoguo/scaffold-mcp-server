import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import type { GenerateScaffoldParams } from '../types/index.js';

/**
 * 获取当前编辑器打开的工程根路径
 * 按优先级检查环境变量
 */
export function getWorkspaceRoot(): string {
  // 优先使用环境变量中的工作目录（编辑器打开的工程路径）
  const workspaceRoot = 
    process.env.WORKSPACE_ROOT || 
    process.env.VSCODE_CWD || 
    process.env.PWD || 
    process.cwd();

  return workspaceRoot;
}

/**
 * 查找有效的工作空间目录
 * 判断标准：包含package.json、.git目录、或其他项目标识文件
 */
export function findValidWorkspace(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      // 检查是否包含常见的项目标识文件
      const indicators = [
        path.join(candidate, "package.json"),
        path.join(candidate, ".git"),
        path.join(candidate, "yarn.lock"),
        path.join(candidate, "pnpm-lock.yaml"),
        path.join(candidate, "tsconfig.json"),
        path.join(candidate, "vite.config.ts"),
        path.join(candidate, "vite.config.js"),
        path.join(candidate, "webpack.config.js"),
      ];

      // 如果存在任何一个指示文件/目录，认为这是一个有效的工作空间
      if (indicators.some((indicator) => fs.existsSync(indicator))) {
        return candidate;
      }
    } catch (error) {
      // 忽略访问错误，继续检查下一个候选路径
      continue;
    }
  }

  return null;
}

/**
 * 根据技术栈生成默认的项目名称
 */
export function getTemplateDefaultName(techStack: string | string[]): string {
  if (Array.isArray(techStack)) {
    // 从技术栈数组生成默认名称
    const frameworks = techStack.filter(tech => 
      ['vue3', 'vue', 'react', 'angular', 'svelte'].includes(tech.toLowerCase())
    );
    const builders = techStack.filter(tech => 
      ['vite', 'webpack', 'rollup', 'parcel'].includes(tech.toLowerCase())
    );
    
    const framework = frameworks[0] || 'app';
    const builder = builders[0] || 'vite';
    
    return `${framework}-${builder}`;
  } else if (typeof techStack === 'string') {
    // 从技术栈字符串生成默认名称
    const normalized = techStack.toLowerCase().replace(/[+\s,;|&]+/g, '-');
    return normalized || 'my-project';
  }
  
  return 'my-project';
}

/**
 * 根据优先级确定项目路径和项目名称
 * 路径优先级：
 * 1. 用户指定的相对路径（相对当前编辑器打开工程路径）或指定的绝对路径（最高优先级）
 * 2. 用户当前编辑器打开工程的路径
 * 3. scaffold-mcp-server的安装路径（最低优先级）
 * 
 * 项目名称：
 * 1. 用户指定的项目名称
 * 2. 模板默认名称（如vue3-vite）
 */
export function resolveProjectPathAndName(
  params: GenerateScaffoldParams
): { projectPath: string; projectName: string; basePath: string } {
  // 1. 确定基础路径
  let basePath: string;

  if (params.output_dir) {
    // 用户指定了路径（最高优先级）
    if (path.isAbsolute(params.output_dir)) {
      // 用户指定的绝对路径
      basePath = params.output_dir;
    } else {
      // 用户指定的相对路径，需要相对于当前编辑器打开的工程路径
      // 首先获取当前编辑器打开的工程路径
      const workspaceRoot = getWorkspaceRoot();
      basePath = path.resolve(workspaceRoot, params.output_dir);
    }
  } else {
    // 用户未指定路径，使用编辑器打开的工程路径（优先级2）
    const workspaceRoot = getWorkspaceRoot();

    // 检查是否在有效的工作空间中（包含package.json等）
    const potentialWorkspaces = [
      workspaceRoot,
      process.cwd(), // scaffold-mcp-server的安装路径（最低优先级）
    ];

    basePath = findValidWorkspace(potentialWorkspaces) || process.cwd();
  }

  // 2. 确定项目名称
  let projectName: string;

  if (params.project_name && params.project_name.trim()) {
    // 用户指定了项目名称
    projectName = params.project_name.trim();
  } else {
    // 使用模板默认名称
    projectName = getTemplateDefaultName(params.tech_stack);
  }

  // 3. 构建最终项目路径
  const finalProjectPath = path.join(basePath, projectName);

  return {
    projectPath: finalProjectPath,
    projectName,
    basePath,
  };
}

/**
 * 验证路径是否可用
 */
export function validateProjectPath(projectPath: string, force: boolean = false): {
  valid: boolean;
  message?: string;
  suggestions?: string[];
} {
  try {
    // 检查路径是否已存在
    if (fs.existsSync(projectPath)) {
      if (!force) {
        const stats = fs.statSync(projectPath);
        if (stats.isDirectory()) {
          // 检查目录是否为空
          const files = fs.readdirSync(projectPath);
          if (files.length > 0) {
            return {
              valid: false,
              message: `目录 ${projectPath} 已存在且不为空`,
              suggestions: [
                '使用 --force 选项强制覆盖',
                '选择不同的项目名称',
                '选择不同的输出目录'
              ]
            };
          }
        } else {
          return {
            valid: false,
            message: `路径 ${projectPath} 已存在且不是目录`,
            suggestions: [
              '选择不同的项目名称',
              '选择不同的输出目录'
            ]
          };
        }
      }
    }

    // 检查父目录是否存在且可写
    const parentDir = path.dirname(projectPath);
    if (!fs.existsSync(parentDir)) {
      return {
        valid: false,
        message: `父目录 ${parentDir} 不存在`,
        suggestions: [
          '确保父目录存在',
          '使用绝对路径',
          '检查路径拼写是否正确'
        ]
      };
    }

    // 检查父目录权限
    try {
      fs.accessSync(parentDir, fs.constants.W_OK);
    } catch (error) {
      return {
        valid: false,
        message: `没有权限在 ${parentDir} 中创建目录`,
        suggestions: [
          '检查目录权限',
          '使用管理员权限运行',
          '选择有写权限的目录'
        ]
      };
    }

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      message: `路径验证失败: ${error.message}`,
      suggestions: [
        '检查路径是否正确',
        '确保有足够的权限',
        '尝试使用不同的路径'
      ]
    };
  }
}

/**
 * 获取路径解析的详细信息（用于调试和日志）
 */
export function getPathResolutionInfo(params: GenerateScaffoldParams): {
  workspaceRoot: string;
  userOutputDir: string | undefined;
  userProjectName: string | undefined;
  resolvedBasePath: string;
  resolvedProjectPath: string;
  resolvedProjectName: string;
  isAbsolutePath: boolean;
  isValidWorkspace: boolean;
} {
  const workspaceRoot = getWorkspaceRoot();
  const { projectPath, projectName, basePath } = resolveProjectPathAndName(params);
  
  return {
    workspaceRoot,
    userOutputDir: params.output_dir,
    userProjectName: params.project_name,
    resolvedBasePath: basePath,
    resolvedProjectPath: projectPath,
    resolvedProjectName: projectName,
    isAbsolutePath: params.output_dir ? path.isAbsolute(params.output_dir) : false,
    isValidWorkspace: findValidWorkspace([workspaceRoot]) !== null,
  };
}