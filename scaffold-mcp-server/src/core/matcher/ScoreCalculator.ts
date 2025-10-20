import type { TechStack } from '../../types/index';

export interface MatchingScore {
  coreScore: number;      // 核心技术栈匹配分数 (0-100)
  optionalScore: number;  // 可选技术栈匹配分数 (0-50)
  keywordScore: number;   // 关键词匹配分数 (0-30)
  priorityBonus: number;  // 模板优先级加成 (0-20)
  totalScore: number;     // 总分
}

export interface TemplateEntry {
  name: string;
  description: string;
  keywords?: string[];
  matching: {
    required?: (keyof TechStack)[];
    core: Partial<Record<keyof TechStack, string[]>>;
    optional?: Partial<Record<keyof TechStack, string[]>>;
    conflicts?: string[];
  };
  priority?: number;
  tags?: string[];
}

/**
 * 积分计算器
 * 负责计算用户输入与模板的匹配分数
 */
export class ScoreCalculator {
  
  /**
   * 计算模板匹配分数
   */
  static calculateScore(
    userTechStack: TechStack,
    userInput: string,
    template: TemplateEntry
  ): MatchingScore {
    // 添加空值检查
    if (!userTechStack) {
      console.warn('ScoreCalculator: userTechStack is undefined');
      return {
        coreScore: 0,
        optionalScore: 0,
        keywordScore: 0,
        priorityBonus: 0,
        totalScore: 0
      };
    }
    
    console.log(`🎯 [权重打分] 开始计算模板 "${template.name}" 的匹配分数`);
    console.log(`   用户技术栈: ${JSON.stringify(userTechStack)}`);
    console.log(`   用户输入: "${userInput}"`);
    
    const coreScore = this.calculateCoreScore(userTechStack, template);
    const optionalScore = this.calculateOptionalScore(userTechStack, template);
    const keywordScore = this.calculateKeywordScore(userInput, template);
    const priorityBonus = this.calculatePriorityBonus(template);
    const totalScore = coreScore + optionalScore + keywordScore + priorityBonus;

    console.log(`   📊 分数详情:`);
    console.log(`      核心分数: ${coreScore}/100`);
    console.log(`      可选分数: ${optionalScore}/50`);
    console.log(`      关键词分数: ${keywordScore}/30`);
    console.log(`      优先级加成: ${priorityBonus}/20`);
    console.log(`      总分: ${totalScore}`);

    return {
      coreScore,
      optionalScore,
      keywordScore,
      priorityBonus,
      totalScore
    };
  }

  /**
   * 计算核心技术栈匹配分数
   */
  private static calculateCoreScore(userTechStack: TechStack, template: TemplateEntry): number {
    // 添加空值检查
    if (!userTechStack) {
      console.warn('ScoreCalculator.calculateCoreScore: userTechStack is undefined');
      return 0;
    }
    
    let score = 0;
    const core = template.matching.core;

    // 框架匹配（必须匹配，否则返回0）
    if (userTechStack.framework) {
      const frameworks = core.framework || [];
      if (frameworks.includes(userTechStack.framework)) {
        score += 40; // 框架匹配40分
      } else {
        return 0; // 框架不匹配直接返回0
      }
    }

    // 构建工具匹配
    if (userTechStack.builder) {
      const builders = core.builder || [];
      if (builders.includes(userTechStack.builder)) {
        score += 30; // 构建工具匹配30分
      } else {
        // 构建工具不匹配，但不是致命的，减少分数
        score -= 10;
      }
    }

    // 语言匹配
    if (userTechStack.language) {
      const languages = core.language || [];
      if (languages.includes(userTechStack.language)) {
        score += 30; // 语言匹配30分
      }
    }

    return Math.max(0, score);
  }

  /**
   * 计算可选技术栈匹配分数
   */
  private static calculateOptionalScore(userTechStack: TechStack, template: TemplateEntry): number {
    let score = 0;
    const optional = template.matching.optional || {};

    // 检查每个可选字段
    const optionalFields: (keyof TechStack)[] = ['ui', 'style', 'state', 'router'];
    
    for (const field of optionalFields) {
      const userValue = userTechStack[field];
      const templateValues = optional[field] || [];
      
      if (userValue && templateValues.includes(userValue)) {
        score += 10; // 每个可选项匹配10分
      }
    }

    return Math.min(50, score); // 最多50分
  }

  /**
   * 计算关键词匹配分数
   */
  private static calculateKeywordScore(userInput: string, template: TemplateEntry): number {
    if (!template.keywords || template.keywords.length === 0) {
      return 0;
    }

    const inputLower = userInput.toLowerCase();
    let matchedKeywords = 0;

    for (const keyword of template.keywords) {
      if (inputLower.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    }

    // 每个匹配的关键词5分，最多30分
    return Math.min(30, matchedKeywords * 5);
  }

  /**
   * 计算优先级加成分数
   */
  private static calculatePriorityBonus(template: TemplateEntry): number {
    const priority = template.priority || 0;
    
    // 将优先级转换为0-20的加成分数
    if (priority >= 100) return 20;
    if (priority >= 90) return 15;
    if (priority >= 80) return 10;
    if (priority >= 70) return 5;
    
    return 0;
  }

  /**
   * 检查是否有冲突
   */
  static hasConflicts(userTechStack: TechStack, userInput: string, template: TemplateEntry): boolean {
    // 添加空值检查
    if (!userTechStack) {
      console.warn('ScoreCalculator.hasConflicts: userTechStack is undefined');
      return false;
    }
    
    const conflicts = template.matching.conflicts || [];
    
    // 检查技术栈冲突
    const allUserTechs = Object.values(userTechStack).filter(Boolean);
    for (const conflict of conflicts) {
      if (allUserTechs.includes(conflict)) {
        return true;
      }
    }

    // 检查输入文本中的冲突关键词
    const inputLower = userInput.toLowerCase();
    for (const conflict of conflicts) {
      if (inputLower.includes(conflict.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否满足必需条件
   */
  static meetsRequirements(userTechStack: TechStack, template: TemplateEntry): boolean {
    // 添加空值检查
    if (!userTechStack) {
      console.warn('ScoreCalculator.meetsRequirements: userTechStack is undefined');
      return false;
    }
    
    const required = template.matching.required || [];
    
    for (const field of required) {
      if (!userTechStack[field]) {
        return false;
      }
    }

    return true;
  }
}