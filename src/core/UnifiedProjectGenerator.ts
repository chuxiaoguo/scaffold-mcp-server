import * as path from "path";
import { UnifiedToolParser, ToolInput, ParsedToolSet } from './UnifiedToolParser.js';
import { StrategySelector, StrategyMatch, GenerationStrategy } from './StrategySelector.js';
import { ToolInjectorManager } from './injectors/ToolInjectorManager.js';
import { CoreInjectorManager } from './injectors/core/CoreInjectorManager.js';
import { 
  generateFromFixedTemplate,
  type TemplateResult
} from '../tools/templateDownloader.js';
import { generateFromNonFixedTemplate } from '../tools/projectGenerator.js';
import { TechStack, GenerateOptions } from '../types/index.js';
import { createProjectFiles } from '../tools/fileOperations.js';
import * as fs from 'fs';

// 统一工具输入类型
export type UnifiedToolInput = ToolInput;

// 统一生成选项
export interface UnifiedGenerateOptions extends GenerateOptions {
  projectName?: string;
  outputDir?: string;
  preview?: boolean;
}

// 统一生成结果
export interface UnifiedGenerateResult {
  success: boolean;
  projectName: string;
  targetPath: string;
  files: Record<string, string>;
  packageJson: any;
  logs: string[];
  strategy?: StrategyMatch;
  error?: string;
}

/**
 * 统一项目生成器
 * 集成 UnifiedToolParser、StrategySelector、ToolInjectorManager 和 CoreInjectorManager
 * 提供统一的项目生成入口
 */
export class UnifiedProjectGenerator {
  private toolParser: UnifiedToolParser;
  private strategySelector: StrategySelector;
  private toolInjectorManager: ToolInjectorManager;
  private coreInjectorManager: CoreInjectorManager;

  constructor() {
    this.toolParser = new UnifiedToolParser();
    this.strategySelector = new StrategySelector();
    this.toolInjectorManager = new ToolInjectorManager();
    this.coreInjectorManager = new CoreInjectorManager();
  }

  /**
   * 统一项目生成入口
   */
  async generateProject(
    toolInput: UnifiedToolInput,
    options: UnifiedGenerateOptions = {}
  ): Promise<UnifiedGenerateResult> {
    const logs: string[] = [];
    
    try {
      logs.push('🚀 开始统一项目生成流程');
      
      // 1. 解析工具输入
      logs.push('📋 解析工具配置...');
      const toolSet = this.toolParser.parse(toolInput);
      logs.push(`   - 解析完成，共识别 ${toolSet.all.length} 个工具`);
      logs.push(`   - 核心工具: ${toolSet.frameworks.concat(toolSet.builders, toolSet.languages).join(', ')}`);
      logs.push(`   - 额外工具: ${toolSet.tools.join(', ')}`);

      // 2. 选择生成策略
      logs.push('🎯 选择生成策略...');
      const strategy = this.strategySelector.select(toolSet);
      logs.push(`   - 选择策略: ${strategy.strategy.id}`);
      logs.push(`   - 匹配分数: ${strategy.score}`);
      logs.push(`   - 策略类型: ${strategy.strategy.type}`);

      // 3. 应用默认值
      logs.push('⚙️ 应用策略默认值...');
      const enhancedToolSet = this.applyDefaults(toolSet, strategy);
      logs.push(`   - 应用完成，工具总数: ${enhancedToolSet.all.length}`);

      // 4. 确定项目路径
      const projectName = options.projectName || 'unified-project';
      const outputDir = options.outputDir || process.cwd();
      const targetPath = path.resolve(outputDir, projectName);
      
      logs.push(`📁 项目路径: ${targetPath}`);

      // 5. 创建项目目录（非预览模式）
      if (!options.preview) {
        logs.push('📂 创建项目目录...');
        await this.createProjectDirectory(targetPath, options.force || false);
        logs.push('   - 目录创建完成');
      }

      // 6. 执行生成策略
      logs.push('🔨 执行项目生成...');
      let result: TemplateResult;
      
      if (strategy.strategy.type === 'template') {
        // 使用固定模板
        const templatePath = this.strategySelector.getTemplatePath(strategy.strategy);
        if (!templatePath) {
          throw new Error('模板策略缺少模板路径');
        }
        logs.push(`   - 使用固定模板: ${templatePath}`);
        result = await generateFromFixedTemplate(
          { name: strategy.strategy.id, ...strategy.strategy },
          projectName,
          this.convertToTechStack(enhancedToolSet),
          logs
        );
      } else {
        // 使用动态生成
        logs.push('   - 使用动态生成');
        result = await generateFromNonFixedTemplate(
          this.convertToTechStack(enhancedToolSet),
          projectName,
          logs
        );
      }

      // 7. 注入额外工具
      logs.push('🔧 注入额外工具...');
      const injectableTools = this.toolParser.getInjectableTools(enhancedToolSet);
      const injectionResult = this.toolInjectorManager.injectTools(
        result.files,
        result.packageJson,
        injectableTools
      );
      
      logs.push(`   - 注入完成，注入工具: ${injectableTools.join(', ')}`);

      // 8. 处理预览模式
      if (options.preview) {
        logs.push('👀 预览模式，跳过文件写入');
        return {
          success: true,
          projectName,
          targetPath,
          files: injectionResult.files,
          packageJson: injectionResult.packageJson,
          logs,
          strategy
        };
      }

      // 9. 写入文件到磁盘
      logs.push('💾 写入文件到磁盘...');
      await this.writeFilesToDisk(targetPath, injectionResult.files, injectionResult.packageJson);
      logs.push(`   - 文件写入完成，共 ${Object.keys(injectionResult.files).length} 个文件`);

      logs.push('✅ 项目生成完成');
      
      return {
        success: true,
        projectName,
        targetPath,
        files: injectionResult.files,
        packageJson: injectionResult.packageJson,
        logs,
        strategy
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logs.push(`❌ 项目生成失败: ${errorMessage}`);
      
      return {
        success: false,
        projectName: options.projectName || 'unified-project',
        targetPath: path.resolve(options.outputDir || process.cwd(), options.projectName || 'unified-project'),
        files: {},
        packageJson: {},
        logs,
        error: errorMessage
      };
    }
  }

  /**
   * 应用策略默认值
   */
  private applyDefaults(toolSet: ParsedToolSet, strategy: StrategyMatch): ParsedToolSet {
    const defaults = strategy.strategy.defaults || {};
    const enhanced = { ...toolSet };

    // 应用默认工具
    if (defaults.tools) {
      for (const tool of defaults.tools) {
        if (!enhanced.all.includes(tool)) {
          enhanced.all.push(tool);
          // 根据工具属性分类到相应类别
          const toolProperties = this.toolParser['toolProperties'].tools[tool];
          if (toolProperties) {
            if (toolProperties.category === 'framework') {
              enhanced.frameworks.push(tool);
            } else if (toolProperties.category === 'builder') {
              enhanced.builders.push(tool);
            } else if (toolProperties.category === 'language') {
              enhanced.languages.push(tool);
            } else {
              enhanced.tools.push(tool);
            }
          }
        }
      }
    }

    return enhanced;
  }

  /**
   * 将 ParsedToolSet 转换为 TechStack
   */
  private convertToTechStack(toolSet: ParsedToolSet): TechStack {
    const techStack: TechStack = {};

    // 映射核心工具到 TechStack 属性
    if (toolSet.frameworks.length > 0) {
      techStack.framework = toolSet.frameworks[0] as any;
    }
    if (toolSet.builders.length > 0) {
      techStack.builder = toolSet.builders[0] as any;
    }
    if (toolSet.languages.length > 0) {
      techStack.language = toolSet.languages[0] as any;
    }
    if (toolSet.ui.length > 0) {
      techStack.ui = toolSet.ui[0] as any;
    }
    if (toolSet.styles.length > 0) {
      techStack.style = toolSet.styles[0] as any;
    }
    if (toolSet.routers.length > 0) {
      techStack.router = toolSet.routers[0] as any;
    }
    if (toolSet.state.length > 0) {
      techStack.state = toolSet.state[0] as any;
    }

    return techStack;
  }

  /**
   * 创建项目目录
   */
  private async createProjectDirectory(targetPath: string, force: boolean): Promise<void> {
    if (!force && fs.existsSync(targetPath)) {
      throw new Error(`项目目录已存在: ${targetPath}. 使用 force 选项覆盖.`);
    }
    
    await fs.promises.mkdir(targetPath, { recursive: true });
  }

  /**
   * 写入文件到磁盘
   */
  private async writeFilesToDisk(
    targetPath: string, 
    files: Record<string, string>, 
    packageJson: any
  ): Promise<void> {
    // 创建项目文件
    await createProjectFiles(targetPath, files, path.basename(targetPath), []);
    
    // 创建 package.json
    const packageJsonPath = path.join(targetPath, "package.json");
    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      "utf-8"
    );
  }

  /**
   * 获取可用的生成策略
   */
  public getAvailableStrategies(): GenerationStrategy[] {
    return this.strategySelector['config'].strategies;
  }

  /**
   * 获取工具分类信息
   */
  public getToolCategories(): Record<string, string[]> {
    return this.toolParser['toolCategories'].categories;
  }

  /**
   * 获取工具属性信息
   */
  public getToolProperties(): Record<string, any> {
    return this.toolParser['toolProperties'].tools;
  }

  /**
   * 验证工具输入
   */
  public validateInput(toolInput: UnifiedToolInput): { valid: boolean; errors: string[] } {
    try {
      const toolSet = this.toolParser.parse(toolInput);
      const errors: string[] = [];

      // 检查是否有核心工具
      const coreTools = toolSet.frameworks.concat(toolSet.builders, toolSet.languages);
      if (coreTools.length === 0) {
        errors.push('至少需要指定一个核心工具（框架、构建工具或语言）');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 预览项目生成结果（不实际创建文件）
   */
  async previewProject(toolInput: UnifiedToolInput, options: Omit<UnifiedGenerateOptions, 'preview'> = {}): Promise<UnifiedGenerateResult> {
    return this.generateProject(toolInput, { ...options, preview: true });
  }
}