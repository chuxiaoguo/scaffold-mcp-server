import type { TemplateEntry } from './ScoreCalculator.js';

export interface KeywordMatchResult {
  matched: boolean;
  matchedKeywords: string[];
  confidence: number; // 0-1之间的置信度
}

/**
 * 关键词匹配器
 * 专门处理基于关键词的直接匹配
 */
export class KeywordMatcher {
  
  /**
   * 检查用户输入是否直接命中某个模板的关键词
   */
  static findDirectMatch(userInput: string, templates: TemplateEntry[]): TemplateEntry | null {
    const inputLower = userInput.toLowerCase();
    let bestMatch: { template: TemplateEntry; score: number } | null = null;

    for (const template of templates) {
      const matchResult = this.matchKeywords(inputLower, template);
      
      if (matchResult.matched && matchResult.confidence > 0.7) {
        const score = matchResult.confidence * 100;
        
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { template, score };
        }
      }
    }

    return bestMatch?.template || null;
  }

  /**
   * 匹配关键词
   */
  static matchKeywords(userInput: string, template: TemplateEntry): KeywordMatchResult {
    if (!template.keywords || template.keywords.length === 0) {
      return {
        matched: false,
        matchedKeywords: [],
        confidence: 0
      };
    }

    const matchedKeywords: string[] = [];
    const inputLower = userInput.toLowerCase();

    // 检查每个关键词
    for (const keyword of template.keywords) {
      if (this.isKeywordMatched(inputLower, keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    const matched = matchedKeywords.length > 0;
    const confidence = matchedKeywords.length / template.keywords.length;

    return {
      matched,
      matchedKeywords,
      confidence
    };
  }

  /**
   * 检查单个关键词是否匹配
   */
  private static isKeywordMatched(userInput: string, keyword: string): boolean {
    // 精确匹配
    if (userInput.includes(keyword)) {
      return true;
    }

    // 模糊匹配（处理一些常见的变体）
    const variations = this.generateKeywordVariations(keyword);
    
    for (const variation of variations) {
      if (userInput.includes(variation)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 生成关键词变体
   */
  private static generateKeywordVariations(keyword: string): string[] {
    const variations: string[] = [];

    // 移除常见后缀
    const suffixes = ['项目', '应用', '开发', '构建', '框架'];
    for (const suffix of suffixes) {
      if (keyword.endsWith(suffix)) {
        variations.push(keyword.slice(0, -suffix.length));
      }
    }

    // 添加常见前缀
    const prefixes = ['我要', '创建', '生成', '搭建'];
    for (const prefix of prefixes) {
      variations.push(prefix + keyword);
    }

    // 英文关键词的变体
    if (/^[a-zA-Z0-9]+$/.test(keyword)) {
      // 添加常见的英文变体
      const englishVariations = this.getEnglishVariations(keyword);
      variations.push(...englishVariations);
    }

    return variations;
  }

  /**
   * 获取英文关键词的变体
   */
  private static getEnglishVariations(keyword: string): string[] {
    const variations: string[] = [];

    // 技术栈别名映射
    const aliases: Record<string, string[]> = {
      'react': ['reactjs', 'react.js'],
      'vue': ['vuejs', 'vue.js', 'vue3'],
      'vue3': ['vue', 'vuejs'],
      'typescript': ['ts'],
      'javascript': ['js'],
      'webpack': ['webpack.js'],
      'vite': ['vitejs', 'vite.js'],
      'electron': ['electron-vite'],
      'antd': ['ant-design', 'antdesign'],
      'element': ['element-plus', 'element-ui']
    };

    const keywordLower = keyword.toLowerCase();
    if (aliases[keywordLower]) {
      variations.push(...aliases[keywordLower]);
    }

    // 反向查找
    for (const [key, values] of Object.entries(aliases)) {
      if (values.includes(keywordLower)) {
        variations.push(key);
        variations.push(...values.filter(v => v !== keywordLower));
      }
    }

    return variations;
  }

  /**
   * 获取所有模板的关键词统计
   */
  static getKeywordStats(templates: TemplateEntry[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const template of templates) {
      if (template.keywords) {
        for (const keyword of template.keywords) {
          stats[keyword] = (stats[keyword] || 0) + 1;
        }
      }
    }

    return stats;
  }

  /**
   * 建议相关关键词
   */
  static suggestKeywords(userInput: string, templates: TemplateEntry[]): string[] {
    const inputLower = userInput.toLowerCase();
    const suggestions: Set<string> = new Set();

    for (const template of templates) {
      if (template.keywords) {
        for (const keyword of template.keywords) {
          // 如果关键词与用户输入有部分匹配，添加到建议中
          if (keyword.toLowerCase().includes(inputLower) || 
              inputLower.includes(keyword.toLowerCase())) {
            suggestions.add(keyword);
          }
        }
      }
    }

    return Array.from(suggestions).slice(0, 10); // 最多返回10个建议
  }
}