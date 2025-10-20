import type { TechStack } from '../../types/index.js';
import { ScoreCalculator, type MatchingScore, type TemplateEntry } from './ScoreCalculator.js';
import { KeywordMatcher } from './KeywordMatcher.js';

export interface MatchResult {
  template: TemplateEntry;
  score: MatchingScore;
  matchType: 'direct' | 'smart' | 'fallback';
  confidence: number; // 0-1之间的置信度
}

export interface SmartMatchOptions {
  enableKeywordMatch?: boolean;
  minScore?: number;
  maxResults?: number;
  fallbackToDefault?: boolean;
  defaultTemplate?: string;
}

/**
 * 智能匹配器
 * 整合关键词匹配和积分计算，提供完整的模板匹配解决方案
 */
export class SmartMatcher {
  
  /**
   * 智能匹配模板
   */
  static matchTemplate(
    userTechStack: TechStack,
    userInput: string,
    templates: TemplateEntry[],
    options: SmartMatchOptions = {}
  ): MatchResult | null {
    const {
      enableKeywordMatch = true,
      minScore = 30,
      fallbackToDefault = true,
      defaultTemplate = 'vue3-vite-typescript'
    } = options;

    // 第一阶段：关键词直接匹配
    if (enableKeywordMatch) {
      const directMatch = KeywordMatcher.findDirectMatch(userInput, templates);
      if (directMatch) {
        const score = ScoreCalculator.calculateScore(userTechStack, userInput, directMatch);
        
        // 检查是否有冲突或不满足要求
        if (!ScoreCalculator.hasConflicts(userTechStack, userInput, directMatch) &&
            ScoreCalculator.meetsRequirements(userTechStack, directMatch)) {
          return {
            template: directMatch,
            score,
            matchType: 'direct',
            confidence: 0.9
          };
        }
      }
    }

    // 第二阶段：智能积分匹配
    const smartMatch = this.findBestMatch(userTechStack, userInput, templates, minScore);
    if (smartMatch) {
      return {
        template: smartMatch.template,
        score: smartMatch.score,
        matchType: 'smart',
        confidence: this.calculateConfidence(smartMatch.score)
      };
    }

    // 第三阶段：回退到默认模板
    if (fallbackToDefault) {
      const defaultTemplateEntry = templates.find(t => t.name === defaultTemplate);
      if (defaultTemplateEntry) {
        const score = ScoreCalculator.calculateScore(userTechStack, userInput, defaultTemplateEntry);
        return {
          template: defaultTemplateEntry,
          score,
          matchType: 'fallback',
          confidence: 0.3
        };
      }
    }

    return null;
  }

  /**
   * 获取多个匹配结果（排序）
   */
  static matchMultiple(
    userTechStack: TechStack,
    userInput: string,
    templates: TemplateEntry[],
    options: SmartMatchOptions = {}
  ): MatchResult[] {
    const {
      minScore = 20,
      maxResults = 5
    } = options;

    const results: MatchResult[] = [];

    // 计算所有模板的分数
    for (const template of templates) {
      // 检查冲突和要求
      if (ScoreCalculator.hasConflicts(userTechStack, userInput, template) ||
          !ScoreCalculator.meetsRequirements(userTechStack, template)) {
        continue;
      }

      const score = ScoreCalculator.calculateScore(userTechStack, userInput, template);
      
      if (score.totalScore >= minScore) {
        results.push({
          template,
          score,
          matchType: 'smart',
          confidence: this.calculateConfidence(score)
        });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score.totalScore - a.score.totalScore);

    return results.slice(0, maxResults);
  }

  /**
   * 查找最佳匹配
   */
  private static findBestMatch(
    userTechStack: TechStack,
    userInput: string,
    templates: TemplateEntry[],
    minScore: number
  ): { template: TemplateEntry; score: MatchingScore } | null {
    let bestMatch: { template: TemplateEntry; score: MatchingScore } | null = null;

    for (const template of templates) {
      // 检查冲突和要求
      if (ScoreCalculator.hasConflicts(userTechStack, userInput, template) ||
          !ScoreCalculator.meetsRequirements(userTechStack, template)) {
        continue;
      }

      const score = ScoreCalculator.calculateScore(userTechStack, userInput, template);
      
      if (score.totalScore >= minScore) {
        if (!bestMatch || score.totalScore > bestMatch.score.totalScore) {
          bestMatch = { template, score };
        }
      }
    }

    return bestMatch;
  }

  /**
   * 计算置信度
   */
  private static calculateConfidence(score: MatchingScore): number {
    const totalScore = score.totalScore;
    
    // 将总分转换为0-1的置信度
    if (totalScore >= 100) return 1.0;
    if (totalScore >= 80) return 0.9;
    if (totalScore >= 60) return 0.8;
    if (totalScore >= 40) return 0.7;
    if (totalScore >= 20) return 0.6;
    
    return Math.max(0.1, totalScore / 100);
  }

  /**
   * 解释匹配结果
   */
  static explainMatch(result: MatchResult): string {
    const { template, score, matchType, confidence } = result;
    
    let explanation = `匹配到模板: ${template.name}\n`;
    explanation += `匹配类型: ${this.getMatchTypeDescription(matchType)}\n`;
    explanation += `置信度: ${(confidence * 100).toFixed(1)}%\n`;
    explanation += `总分: ${score.totalScore.toFixed(1)}\n`;
    explanation += `详细分数:\n`;
    explanation += `  - 核心技术栈: ${score.coreScore}\n`;
    explanation += `  - 可选技术栈: ${score.optionalScore}\n`;
    explanation += `  - 关键词匹配: ${score.keywordScore}\n`;
    explanation += `  - 优先级加成: ${score.priorityBonus}\n`;

    return explanation;
  }

  /**
   * 获取匹配类型描述
   */
  private static getMatchTypeDescription(matchType: string): string {
    switch (matchType) {
      case 'direct':
        return '关键词直接匹配';
      case 'smart':
        return '智能积分匹配';
      case 'fallback':
        return '默认模板回退';
      default:
        return '未知匹配类型';
    }
  }

  /**
   * 验证模板配置
   */
  static validateTemplate(template: TemplateEntry): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name) {
      errors.push('模板名称不能为空');
    }

    if (!template.matching) {
      errors.push('模板匹配规则不能为空');
    } else {
      if (!template.matching.core) {
        errors.push('核心匹配规则不能为空');
      }
    }

    if (template.priority !== undefined && (template.priority < 0 || template.priority > 100)) {
      errors.push('优先级必须在0-100之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取匹配统计信息
   */
  static getMatchStats(
    userTechStack: TechStack,
    userInput: string,
    templates: TemplateEntry[]
  ): {
    totalTemplates: number;
    validTemplates: number;
    conflictTemplates: number;
    matchableTemplates: number;
  } {
    let validTemplates = 0;
    let conflictTemplates = 0;
    let matchableTemplates = 0;

    for (const template of templates) {
      const validation = this.validateTemplate(template);
      if (validation.valid) {
        validTemplates++;

        if (ScoreCalculator.hasConflicts(userTechStack, userInput, template)) {
          conflictTemplates++;
        } else if (ScoreCalculator.meetsRequirements(userTechStack, template)) {
          matchableTemplates++;
        }
      }
    }

    return {
      totalTemplates: templates.length,
      validTemplates,
      conflictTemplates,
      matchableTemplates
    };
  }
}