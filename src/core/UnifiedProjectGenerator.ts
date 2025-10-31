import * as path from "path";
import {
  UnifiedToolParser,
  ToolInput,
  ParsedToolSet,
} from "./UnifiedToolParser.js";
import {
  StrategySelector,
  StrategyMatch,
  GenerationStrategy,
} from "./StrategySelector.js";
import { getUnifiedInjectorManager } from "./injectors/unified/index.js";
import {
  generateFromFixedTemplate,
  type TemplateResult,
} from "../tools/templateDownloader.js";
import {
  TechStack,
  GenerateOptions,
  UnifiedInjectionContext,
} from "../types/index.js";
import { createProjectFiles } from "../tools/fileOperations.js";
import { type MatchResult } from "./matcher/SmartMatcher.js";
import * as fs from "fs";

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
  prompt?: string; // 动态生成时返回的提示词
}

/**
 * 统一项目生成器
 * 集成 UnifiedToolParser、StrategySelector、ToolInjectorManager 和 CoreInjectorManager
 * 提供统一的项目生成入口
 */
export class UnifiedProjectGenerator {
  private toolParser: UnifiedToolParser;
  private strategySelector: StrategySelector;

  constructor() {
    this.toolParser = new UnifiedToolParser();
    this.strategySelector = new StrategySelector();
  }

  /**
   * 使用预匹配的模板生成项目（跳过重复匹配）
   * 这个方法专门为 generateScaffold.ts 提供，避免重复的模板匹配逻辑
   */
  async generateWithMatchedTemplate(
    matchResult: MatchResult,
    toolInput: UnifiedToolInput,
    options: UnifiedGenerateOptions = {}
  ): Promise<UnifiedGenerateResult> {
    return this.generateProjectCore(
      toolInput,
      options,
      (toolSet) => ({
        strategy: {
          id: matchResult.template.name,
          pattern: [],
          type: "template",
          template: matchResult.template.name,
          priority: matchResult.template.priority || 0,
          description: matchResult.template.description,
          defaults: {},
        },
        score: matchResult.score.totalScore,
        matchType: matchResult.matchType as "exact" | "partial" | "wildcard",
        matchedTools: toolSet.all,
        missingTools: [],
        extraTools: [],
      }),
      async (enhancedToolSet, projectName, logs) => {
        const templateConfig = {
          name: matchResult.template.name,
          description: matchResult.template.description,
          matching: matchResult.template.matching,
        };
        logs.push(`   - 使用固定模板: ${matchResult.template.name}`);
        return await generateFromFixedTemplate(
          templateConfig,
          projectName,
          logs
        );
      },
      {
        start: "🚀 开始使用预匹配模板生成项目",
        templateInfo: `🎯 使用模板: ${matchResult.template.name} (置信度: ${(matchResult.confidence * 100).toFixed(1)}%)`,
        strategyInfo: "⚡ 跳过策略选择，使用预匹配模板",
        generationType: "🔨 使用匹配模板生成项目...",
        success: "✅ 项目生成成功",
        error: "❌ 生成失败",
      },
      "unified-project"
    );
  }

  /**
   * 使用纯动态生成（跳过所有模板匹配）
   * 专门为 generateScaffold.ts 的动态分支提供，返回结构化提示词
   */
  async generateWithDynamicTemplate(
    toolInput: UnifiedToolInput,
    options: UnifiedGenerateOptions = {}
  ): Promise<UnifiedGenerateResult> {
    const logs: string[] = [];

    try {
      logs.push("🚀 开始纯动态项目生成流程（提示词模式）");
      logs.push("⚡ 跳过模板匹配，生成项目构建提示词");

      // 1. 解析工具输入
      logs.push("📋 解析工具配置...");
      const toolSet = this.toolParser.parse(toolInput);
      logs.push(`   - 解析完成，共识别 ${toolSet.all.length} 个工具`);

      // 2. 转换为技术栈
      const techStack = this.convertToTechStack(toolSet);

      // 3. 生成提示词（替代原来的动态生成）
      logs.push("🎯 使用 PromptBuilder 生成项目构建提示词...");
      const { generatePromptForDynamicTemplate } = await import(
        "../tools/dynamicGenerator.js"
      );
      const prompt = await generatePromptForDynamicTemplate(
        techStack,
        options.projectName || "my-project",
        toolSet.tools,
        logs
      );

      logs.push("✅ 提示词生成完成");
      logs.push(`   - 提示词长度: ${prompt.length} 字符`);

      // 4. 确定项目路径
      const projectName = options.projectName || "dynamic-project";
      const outputDir = options.outputDir || process.cwd();
      const targetPath = path.resolve(outputDir, projectName);

      // 5. 返回提示词结果（不生成文件）
      return {
        success: true,
        projectName,
        targetPath,
        files: {}, // 空文件列表
        packageJson: {},
        logs,
        prompt, // ⭐️ 返回生成的提示词
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logs.push(`❌ 提示词生成失败: ${errorMessage}`);

      return {
        success: false,
        projectName: options.projectName || "dynamic-project",
        targetPath: path.resolve(
          options.outputDir || process.cwd(),
          options.projectName || "dynamic-project"
        ),
        files: {},
        packageJson: {},
        logs,
        error: errorMessage,
      };
    }
  }

  /**
   * 项目生成的核心逻辑（消除重复代码）
   */
  private async generateProjectCore(
    toolInput: UnifiedToolInput,
    options: UnifiedGenerateOptions,
    createStrategy: (toolSet: ParsedToolSet) => StrategyMatch,
    generateProject: (
      enhancedToolSet: ParsedToolSet,
      projectName: string,
      logs: string[]
    ) => Promise<TemplateResult>,
    logMessages: {
      start: string;
      templateInfo: string;
      strategyInfo: string;
      generationType: string;
      success: string;
      error: string;
    },
    defaultProjectName: string
  ): Promise<UnifiedGenerateResult> {
    const logs: string[] = [];

    try {
      logs.push(logMessages.start);
      logs.push(logMessages.templateInfo);

      // 1. 解析工具输入
      logs.push("📋 解析工具配置...");
      const toolSet = this.toolParser.parse(toolInput);
      logs.push(`   - 解析完成，共识别 ${toolSet.all.length} 个工具`);

      // 2. 创建策略
      logs.push(logMessages.strategyInfo);
      const strategy = createStrategy(toolSet);

      // 3. 应用默认值
      logs.push("⚙️ 应用默认值...");
      const enhancedToolSet = this.applyDefaults(toolSet, strategy);
      logs.push(`   - 应用完成，工具列表: ${enhancedToolSet.all.join(",")}`);
      logs.push(`   - 应用完成，工具总数: ${enhancedToolSet.all.length}`);

      // 4. 确定项目路径
      const projectName = options.projectName || defaultProjectName;
      const outputDir = options.outputDir || process.cwd();
      const targetPath = path.resolve(outputDir, projectName);
      logs.push(`📁 项目路径: ${targetPath}`);

      // 5. 创建项目目录（非预览模式）
      if (!options.preview) {
        logs.push("📂 创建项目目录...");
        await this.createProjectDirectory(targetPath, options.force || false);
        logs.push("   - 目录创建完成");
      }

      // 6. 生成项目
      logs.push(logMessages.generationType);
      const result = await generateProject(enhancedToolSet, projectName, logs);

      // 7. 使用统一注入系统处理额外工具
      logs.push("🔧 使用统一注入系统处理额外工具...");

      // 获取额外的可注入工具
      const injectableTools =
        this.toolParser.getInjectableTools(enhancedToolSet);

      if (injectableTools.length > 0) {
        logs.push(`   - 检测到额外工具: ${injectableTools.join(", ")}`);

        // 使用统一注入管理器
        const unifiedManager = getUnifiedInjectorManager();

        // 准备注入上下文
        const techStack = this.convertToTechStack(enhancedToolSet);
        const injectionContext: UnifiedInjectionContext = {
          projectName,
          projectPath: targetPath,
          files: result.files,
          packageJson: result.packageJson,
          tools: [...enhancedToolSet.all, ...injectableTools], // 包含所有工具
          logs: [],
          ...(techStack.framework && { framework: techStack.framework }),
          ...(techStack.builder && { buildTool: techStack.builder }),
          ...(techStack.language && { language: techStack.language }),
          techStack: techStack,
        };

        // 执行注入
        const injectionResult =
          await unifiedManager.injectAll(injectionContext);

        if (injectionResult.success) {
          result.files = injectionResult.files;
          result.packageJson = injectionResult.packageJson;
          logs.push(...injectionResult.logs);
          logs.push(`   - 额外工具注入完成`);
        } else {
          logs.push(
            `   ⚠️ 部分工具注入失败: ${injectionResult.errors?.join(", ")}`
          );
          logs.push(...injectionResult.logs);
        }
      } else {
        logs.push(`   - 无需注入额外工具`);
      }

      // 8. 处理预览模式
      if (options.preview) {
        logs.push("👀 预览模式，跳过文件写入");
        return {
          success: true,
          projectName,
          targetPath,
          files: result.files,
          packageJson: result.packageJson,
          logs,
          strategy,
        };
      }

      // 9. 写入文件到磁盘
      logs.push("💾 写入文件到磁盘...");
      await this.writeFilesToDisk(targetPath, result.files, result.packageJson);
      logs.push(
        `   - 文件写入完成，共 ${Object.keys(result.files).length} 个文件`
      );

      logs.push(logMessages.success);
      return {
        success: true,
        projectName,
        targetPath,
        files: result.files,
        packageJson: result.packageJson,
        logs,
        strategy,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logs.push(`${logMessages.error}: ${errorMessage}`);

      return {
        success: false,
        projectName: options.projectName || defaultProjectName,
        targetPath: path.resolve(
          options.outputDir || process.cwd(),
          options.projectName || defaultProjectName
        ),
        files: {},
        packageJson: {},
        logs,
        error: errorMessage,
      };
    }
  }

  /**
   * 应用策略默认值
   */
  private applyDefaults(
    toolSet: ParsedToolSet,
    strategy: StrategyMatch
  ): ParsedToolSet {
    const defaults = strategy.strategy.defaults || {};
    const enhanced = { ...toolSet };

    // 应用默认工具
    if (defaults.tools) {
      for (const tool of defaults.tools) {
        if (!enhanced.all.includes(tool)) {
          enhanced.all.push(tool);
          // 根据工具属性分类到相应类别
          const toolProperties = this.toolParser["toolProperties"].tools[tool];
          if (toolProperties) {
            if (toolProperties.category === "framework") {
              enhanced.frameworks.push(tool);
            } else if (toolProperties.category === "builder") {
              enhanced.builders.push(tool);
            } else if (toolProperties.category === "language") {
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
  private async createProjectDirectory(
    targetPath: string,
    force: boolean
  ): Promise<void> {
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
    return this.strategySelector["config"].strategies;
  }

  /**
   * 获取工具分类信息
   */
  public getToolCategories(): Record<string, string[]> {
    return this.toolParser["toolCategories"].categories;
  }

  /**
   * 获取工具属性信息
   */
  public getToolProperties(): Record<string, any> {
    return this.toolParser["toolProperties"].tools;
  }

  /**
   * 验证工具输入
   */
  public validateInput(toolInput: UnifiedToolInput): {
    valid: boolean;
    errors: string[];
  } {
    try {
      const toolSet = this.toolParser.parse(toolInput);
      const errors: string[] = [];

      // 检查是否有核心工具
      const coreTools = toolSet.frameworks.concat(
        toolSet.builders,
        toolSet.languages
      );
      if (coreTools.length === 0) {
        errors.push("至少需要指定一个核心工具（框架、构建工具或语言）");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
