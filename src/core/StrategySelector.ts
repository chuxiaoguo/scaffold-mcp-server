import * as fs from 'fs';
import * as path from 'path';
import { ParsedToolSet } from './UnifiedToolParser.js';

// 生成策略类型定义
export interface GenerationStrategy {
  id: string;
  pattern: string[];
  type: 'template' | 'dynamic';
  template?: string;
  priority: number;
  description: string;
  additionalTools?: string[];
  coreTools?: string[];
  defaults?: Record<string, string>;
}

// 策略配置接口
interface StrategyConfig {
  strategies: GenerationStrategy[];
  matchingRules: {
    exactMatch: { weight: number; description: string };
    partialMatch: { weight: number; description: string };
    wildcardMatch: { weight: number; description: string };
  };
  templateMapping: Record<string, string>;
}

// 匹配结果接口
export interface StrategyMatch {
  strategy: GenerationStrategy;
  score: number;
  matchType: 'exact' | 'partial' | 'wildcard';
  matchedTools: string[];
  missingTools: string[];
  extraTools: string[];
}

export class StrategySelector {
  private config!: StrategyConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'configs', 'strategies');
    this.loadConfiguration();
  }

  /**
   * 加载策略配置
   */
  private loadConfiguration(): void {
    try {
      const configFile = path.join(this.configPath, 'generation-strategies.json');
      this.config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    } catch (error: any) {
      throw new Error(`Failed to load strategy configuration: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * 选择最佳生成策略
   */
  public select(toolSet: ParsedToolSet): StrategyMatch {
    const matches = this.evaluateAllStrategies(toolSet);
    
    if (matches.length === 0) {
      throw new Error('No suitable generation strategy found');
    }

    // 按分数降序排序，选择最佳策略
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 分数相同时，优先选择优先级更高的策略
      return b.strategy.priority - a.strategy.priority;
    });

    return matches[0]!;
  }

  /**
   * 获取所有可能的策略匹配
   */
  public getAllMatches(toolSet: ParsedToolSet): StrategyMatch[] {
    return this.evaluateAllStrategies(toolSet);
  }

  /**
   * 评估所有策略
   */
  private evaluateAllStrategies(toolSet: ParsedToolSet): StrategyMatch[] {
    const matches: StrategyMatch[] = [];

    for (const strategy of this.config.strategies) {
      const match = this.evaluateStrategy(strategy, toolSet);
      if (match.score > 0) {
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * 评估单个策略
   */
  private evaluateStrategy(strategy: GenerationStrategy, toolSet: ParsedToolSet): StrategyMatch {
    const allTools = toolSet.all;
    const pattern = strategy.pattern;

    // 处理通配符模式
    if (pattern.length === 1 && pattern[0] === '*') {
      return {
        strategy,
        score: this.config.matchingRules.wildcardMatch.weight * strategy.priority / 100,
        matchType: 'wildcard',
        matchedTools: allTools,
        missingTools: [],
        extraTools: []
      };
    }

    // 计算匹配情况
    const matchedTools = pattern.filter(tool => allTools.includes(tool));
    const missingTools = pattern.filter(tool => !allTools.includes(tool));
    const extraTools = allTools.filter(tool => !pattern.includes(tool));

    // 计算匹配分数
    let score = 0;
    let matchType: 'exact' | 'partial' | 'wildcard' = 'partial';

    if (matchedTools.length === pattern.length && extraTools.length === 0) {
      // 完全匹配
      score = this.config.matchingRules.exactMatch.weight * strategy.priority / 100;
      matchType = 'exact';
    } else if (matchedTools.length > 0) {
      // 部分匹配
      const matchRatio = matchedTools.length / pattern.length;
      const extraPenalty = extraTools.length * 0.1; // 额外工具的惩罚
      score = (this.config.matchingRules.partialMatch.weight * matchRatio - extraPenalty) * strategy.priority / 100;
      matchType = 'partial';
    }

    // 确保分数不为负数
    score = Math.max(0, score);

    return {
      strategy,
      score,
      matchType,
      matchedTools,
      missingTools,
      extraTools
    };
  }

  /**
   * 根据策略应用默认值
   */
  public applyDefaults(strategy: GenerationStrategy, toolSet: ParsedToolSet): ParsedToolSet {
    if (!strategy.defaults) {
      return toolSet;
    }

    const result = { ...toolSet };
    const allTools = [...result.all];

    // 应用默认值
    for (const [category, defaultTool] of Object.entries(strategy.defaults)) {
      // 检查该分类是否已有工具
      const categoryTools = result[category as keyof ParsedToolSet] as string[];
      
      if (!categoryTools || categoryTools.length === 0) {
        // 该分类没有工具，应用默认值
        if (Array.isArray(result[category as keyof ParsedToolSet])) {
          (result[category as keyof ParsedToolSet] as string[]).push(defaultTool);
          allTools.push(defaultTool);
        }
      }
    }

    result.all = [...new Set(allTools)]; // 去重
    return result;
  }

  /**
   * 获取策略的模板路径
   */
  public getTemplatePath(strategy: GenerationStrategy): string | null {
    if (strategy.type !== 'template' || !strategy.template) {
      return null;
    }

    const templateName = this.config.templateMapping[strategy.template] || strategy.template;
    return path.join(process.cwd(), 'scaffold-template', templateName);
  }

  /**
   * 检查模板是否存在
   */
  public isTemplateAvailable(strategy: GenerationStrategy): boolean {
    const templatePath = this.getTemplatePath(strategy);
    if (!templatePath) {
      return false;
    }

    try {
      return fs.existsSync(templatePath) && fs.statSync(templatePath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 获取需要注入的额外工具类别
   */
  public getAdditionalToolCategories(strategy: GenerationStrategy): string[] {
    return strategy.additionalTools || [];
  }

  /**
   * 获取核心工具类别（用于动态生成）
   */
  public getCoreToolCategories(strategy: GenerationStrategy): string[] {
    return strategy.coreTools || ['frameworks', 'builders', 'languages'];
  }

  /**
   * 生成策略执行计划
   */
  public generateExecutionPlan(match: StrategyMatch, toolSet: ParsedToolSet): {
    strategy: GenerationStrategy;
    templatePath?: string;
    coreTools: string[];
    additionalTools: string[];
    executionSteps: string[];
  } {
    const strategy = match.strategy;
    const templatePath = this.getTemplatePath(strategy);
    
    // 获取核心工具和额外工具
    const coreCategories = this.getCoreToolCategories(strategy);
    const additionalCategories = this.getAdditionalToolCategories(strategy);
    
    const coreTools: string[] = [];
    const additionalTools: string[] = [];
    
    // 分类工具
    for (const tool of toolSet.all) {
      let isCore = false;
      for (const category of coreCategories) {
        const categoryTools = toolSet[category as keyof ParsedToolSet] as string[];
        if (categoryTools && categoryTools.includes(tool)) {
          coreTools.push(tool);
          isCore = true;
          break;
        }
      }
      
      if (!isCore) {
        for (const category of additionalCategories) {
          const categoryTools = toolSet[category as keyof ParsedToolSet] as string[];
          if (categoryTools && categoryTools.includes(tool)) {
            additionalTools.push(tool);
            break;
          }
        }
      }
    }

    // 生成执行步骤
    const executionSteps: string[] = [];
    
    if (strategy.type === 'template') {
      executionSteps.push(`使用模板: ${strategy.template}`);
      if (templatePath) {
        executionSteps.push(`模板路径: ${templatePath}`);
      }
      if (additionalTools.length > 0) {
        executionSteps.push(`注入额外工具: ${additionalTools.join(', ')}`);
      }
    } else {
      executionSteps.push('动态生成项目结构');
      if (coreTools.length > 0) {
        executionSteps.push(`核心工具: ${coreTools.join(', ')}`);
      }
      if (additionalTools.length > 0) {
        executionSteps.push(`注入工具: ${additionalTools.join(', ')}`);
      }
    }

    return {
      strategy,
      ...(templatePath && { templatePath }),
      coreTools,
      additionalTools,
      executionSteps
    };
  }

  /**
   * 获取策略统计信息
   */
  public getStrategyStats(): {
    totalStrategies: number;
    templateStrategies: number;
    dynamicStrategies: number;
    availableTemplates: number;
  } {
    const totalStrategies = this.config.strategies.length;
    const templateStrategies = this.config.strategies.filter(s => s.type === 'template').length;
    const dynamicStrategies = this.config.strategies.filter(s => s.type === 'dynamic').length;
    const availableTemplates = this.config.strategies.filter(s => 
      s.type === 'template' && this.isTemplateAvailable(s)
    ).length;

    return {
      totalStrategies,
      templateStrategies,
      dynamicStrategies,
      availableTemplates
    };
  }
}