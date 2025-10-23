import { UnifiedProjectGenerator, UnifiedToolInput, UnifiedGenerateOptions, UnifiedGenerateResult } from './UnifiedProjectGenerator.js';
import { TechStack, GenerateOptions } from '../types/index.js';
import { parseTechStack } from '../tools/techStackParser.js';

/**
 * 向后兼容适配器
 * 保持现有API可用，内部转换为统一格式
 */
export class BackwardCompatibilityAdapter {
  private unifiedGenerator: UnifiedProjectGenerator;

  constructor() {
    this.unifiedGenerator = new UnifiedProjectGenerator();
  }

  /**
   * 兼容原有的 generateProject 函数签名
   * 将旧格式转换为新的统一格式
   */
  async generateProject(
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
    try {
      // 1. 转换技术栈输入为统一格式
      const techStack = parseTechStack(techStackInput);
      const unifiedInput = this.convertToUnifiedInput(techStack, extraTools);

      // 2. 转换选项为统一格式
      const unifiedOptions: UnifiedGenerateOptions = {
        projectName,
        outputDir,
        preview: options.dryRun || false,
        force: options.force || false
      };

      // 3. 调用统一生成器
      const result = await this.unifiedGenerator.generateProject(unifiedInput, unifiedOptions);

      // 4. 转换结果为旧格式
      return this.convertToLegacyResult(result, techStack);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `项目生成失败: ${errorMessage}`,
        processLogs: [`❌ 项目生成失败: ${errorMessage}`]
      };
    }
  }

  /**
   * 将 TechStack 和额外工具转换为统一输入格式
   */
  private convertToUnifiedInput(techStack: TechStack, extraTools: string[]): UnifiedToolInput {
    const tools: string[] = [];

    // 添加核心技术栈工具
    if (techStack.framework) tools.push(techStack.framework);
    if (techStack.builder) tools.push(techStack.builder);
    if (techStack.language) tools.push(techStack.language);
    if (techStack.ui) tools.push(techStack.ui);
    if (techStack.style) tools.push(techStack.style);
    if (techStack.router) tools.push(techStack.router);
    if (techStack.state) tools.push(techStack.state);

    // 添加额外工具
    tools.push(...extraTools);

    // 返回工具数组，符合 UnifiedToolInput 类型
    return tools.filter(Boolean); // 过滤掉空值
  }

  /**
   * 将统一结果转换为旧格式
   */
  private convertToLegacyResult(
    result: UnifiedGenerateResult, 
    techStack: TechStack
  ): {
    success: boolean;
    message: string;
    projectPath?: string;
    directoryTree?: string;
    fileSummary?: string[];
    processLogs?: string[];
  } {
    if (!result.success) {
      return {
        success: false,
        message: result.error || '项目生成失败',
        processLogs: result.logs
      };
    }

    // 生成技术栈描述
    const techStackArray = this.getTechStackArray(techStack);
    const successMessage = `项目 ${result.projectName} 创建成功！

📁 项目路径: ${result.targetPath}
🛠️  技术栈: ${techStackArray.join(" + ")}
📦 文件数量: ${Object.keys(result.files).length}

下一步:
  cd ${result.projectName}
  npm run dev`;

    return {
      success: true,
      message: successMessage,
      projectPath: result.targetPath,
      directoryTree: this.generateDirectoryTree(result.files),
      fileSummary: Object.keys(result.files),
      processLogs: result.logs
    };
  }

  /**
   * 获取技术栈数组表示
   */
  private getTechStackArray(techStack: TechStack): string[] {
    const stack: string[] = [];
    
    if (techStack.framework) stack.push(techStack.framework);
    if (techStack.builder) stack.push(techStack.builder);
    if (techStack.language) stack.push(techStack.language);
    if (techStack.ui) stack.push(techStack.ui);
    if (techStack.style) stack.push(techStack.style);
    if (techStack.router) stack.push(techStack.router);
    if (techStack.state) stack.push(techStack.state);

    return stack;
  }

  /**
   * 生成目录树字符串表示
   */
  private generateDirectoryTree(files: Record<string, string>): string {
    const filePaths = Object.keys(files).sort();
    const tree: string[] = [];
    const processedDirs = new Set<string>();

    for (const filePath of filePaths) {
      const parts = filePath.split('/');
      
      // 处理目录结构
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/');
        if (!processedDirs.has(dirPath)) {
          const indent = '  '.repeat(i);
          const dirName = parts[i];
          tree.push(`${indent}${dirName}/`);
          processedDirs.add(dirPath);
        }
      }

      // 处理文件
      const indent = '  '.repeat(parts.length - 1);
      const fileName = parts[parts.length - 1];
      tree.push(`${indent}${fileName}`);
    }

    return tree.join('\n');
  }

  /**
   * 获取统一生成器实例（用于高级用法）
   */
  public getUnifiedGenerator(): UnifiedProjectGenerator {
    return this.unifiedGenerator;
  }

  /**
   * 验证输入参数
   */
  public validateInput(
    techStackInput: string | string[],
    extraTools: string[] = []
  ): { valid: boolean; errors: string[] } {
    try {
      const techStack = parseTechStack(techStackInput);
      const unifiedInput = this.convertToUnifiedInput(techStack, extraTools);
      
      return this.unifiedGenerator.validateInput(unifiedInput);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 预览项目生成结果（兼容 dryRun 选项）
   */
  async previewProject(
    techStackInput: string | string[],
    projectName: string = "my-project",
    outputDir: string = ".",
    extraTools: string[] = []
  ): Promise<{
    success: boolean;
    message: string;
    projectPath?: string;
    directoryTree?: string;
    fileSummary?: string[];
    processLogs?: string[];
  }> {
    return this.generateProject(
      techStackInput,
      projectName,
      outputDir,
      extraTools,
      { dryRun: true }
    );
  }
}

// 创建全局实例
const backwardCompatibilityAdapter = new BackwardCompatibilityAdapter();

/**
 * 兼容的 generateProject 函数
 * 保持与原有API完全一致
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
  return backwardCompatibilityAdapter.generateProject(
    techStackInput,
    projectName,
    outputDir,
    extraTools,
    options
  );
}

export { backwardCompatibilityAdapter };