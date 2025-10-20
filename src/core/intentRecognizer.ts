import type { TechStack } from '../types/index';


/**
 * 智能意图识别器
 * 用于识别用户的技术栈意图，判断是否应该使用固定模板还是动态生成器
 */
export class IntentRecognizer {
  /**
   * 固定模板的兼容性规则
   * 定义每个固定模板支持的技术栈组合
   */
  private static readonly TEMPLATE_COMPATIBILITY = {
    'vue3-vite-typescript': {
      framework: ['vue3', 'vue'],
      builder: ['vite'],
      language: ['typescript', 'ts', 'javascript', 'js'],
      ui: ['element-plus', 'element', 'ep', undefined], // undefined表示可以不指定UI库
      style: ['scss', 'sass', 'css', 'less', undefined],
      state: ['pinia', 'vuex', undefined],
      router: ['vue-router', 'router', undefined]
    },
    'react-webpack-typescript': {
      framework: ['react'],
      builder: ['webpack'],
      language: ['typescript', 'ts', 'javascript', 'js'],
      ui: ['antd', 'ant-design', undefined], // React模板支持antd
      style: ['scss', 'sass', 'css', 'less', 'tailwind', undefined],
      state: ['redux', 'zustand', 'mobx', undefined],
      router: ['react-router', 'router', undefined]
    },
    'electron-vite-vue3': {
      framework: ['vue3', 'vue'],
      builder: ['vite'],
      language: ['typescript', 'ts', 'javascript', 'js'],
      ui: ['element-plus', 'element', 'ep', undefined],
      style: ['scss', 'sass', 'css', 'less', undefined],
      state: ['pinia', 'vuex', undefined],
      router: ['vue-router', 'router', undefined],
      platform: ['electron']
    },
    'umijs': {
      framework: ['react'],
      builder: ['umi'],
      language: ['typescript', 'ts', 'javascript', 'js'],
      ui: ['antd', 'ant-design', undefined],
      style: ['scss', 'sass', 'css', 'less', undefined],
      state: ['dva', 'redux', undefined],
      router: ['umi-router', 'router', undefined]
    }
  };

  /**
   * 不兼容的技术栈组合
   * 这些组合不应该使用固定模板，而应该使用动态生成器
   */
  private static readonly INCOMPATIBLE_COMBINATIONS = [
    // Vue + React UI库的组合
    { framework: ['vue3', 'vue'], ui: ['antd', 'ant-design'] },
    // React + Vue UI库的组合
    { framework: ['react'], ui: ['element-plus', 'element', 'ep'] },
    // Vue + antd-vue 组合（虽然技术上可行，但固定模板不支持）
    { framework: ['vue3', 'vue'], ui: ['antd-vue'] },
    // 其他不常见的组合
    // 注意：移除了Vue+Webpack的限制，因为这会错误地影响React+Webpack的匹配
    { framework: ['react'], builder: ['vite'], ui: ['antd'] } // React+Vite+Antd组合不在固定模板中
  ];

  /**
   * 识别用户意图，判断是否应该使用固定模板
   * @param techStack 解析后的技术栈
   * @returns 匹配的固定模板名称，如果不匹配则返回null
   */
  public static recognizeIntent(techStack: TechStack): string | null {
    // 首先检查是否存在不兼容的组合
    if (this.hasIncompatibleCombination(techStack)) {
      return null;
    }

    // 遍历所有固定模板，找到最匹配的
    for (const [templateName, compatibility] of Object.entries(this.TEMPLATE_COMPATIBILITY)) {
      if (this.isCompatibleWithTemplate(techStack, compatibility)) {
        return templateName;
      }
    }

    return null;
  }

  /**
   * 检查技术栈是否包含不兼容的组合
   * @param techStack 技术栈
   * @returns 是否包含不兼容组合
   */
  private static hasIncompatibleCombination(techStack: TechStack): boolean {
    return this.INCOMPATIBLE_COMBINATIONS.some(incompatible => {
      return Object.entries(incompatible).every(([key, values]) => {
        const techValue = techStack[key as keyof TechStack];
        return techValue && values.includes(techValue);
      });
    });
  }

  /**
   * 检查技术栈是否与模板兼容
   * @param techStack 技术栈
   * @param compatibility 模板兼容性规则
   * @returns 是否兼容
   */
  private static isCompatibleWithTemplate(
    techStack: TechStack, 
    compatibility: Record<string, (string | undefined)[]>
  ): boolean {
    // 核心技术栈必须匹配（框架和构建工具）
    const coreMatches = this.checkCoreCompatibility(techStack, compatibility);
    if (!coreMatches) {
      return false;
    }

    // 其他技术栈可以灵活匹配
    return this.checkOptionalCompatibility(techStack, compatibility);
  }

  /**
   * 检查核心技术栈兼容性（框架和构建工具必须匹配）
   * @param techStack 技术栈
   * @param compatibility 兼容性规则
   * @returns 是否兼容
   */
  private static checkCoreCompatibility(
    techStack: TechStack,
    compatibility: Record<string, (string | undefined)[]>
  ): boolean {
    // 框架是必须的
    const framework = techStack.framework;
    const compatibleFrameworks = compatibility.framework;
    
    if (!framework || !compatibleFrameworks || !compatibleFrameworks.includes(framework)) {
      return false;
    }
    
    // 构建工具是可选的，如果未指定则认为兼容
    const builder = techStack.builder;
    const compatibleBuilders = compatibility.builder;
    
    if (builder && compatibleBuilders) {
      return compatibleBuilders.includes(builder);
    }
    
    // 如果没有指定构建工具，则认为兼容
    return true;
  }

  /**
   * 检查可选技术栈兼容性
   * @param techStack 技术栈
   * @param compatibility 兼容性规则
   * @returns 是否兼容
   */
  private static checkOptionalCompatibility(
    techStack: TechStack,
    compatibility: Record<string, (string | undefined)[]>
  ): boolean {
    const optionalFields = ['language', 'ui', 'style', 'state', 'router', 'platform'];
    
    return optionalFields.every(field => {
      const techValue = techStack[field as keyof TechStack];
      const compatibleValues = compatibility[field];
      
      // 如果技术栈中没有指定这个字段，或者兼容性规则中没有这个字段，则认为兼容
      if (!techValue || !compatibleValues) {
        return true;
      }
      
      // 检查是否在兼容列表中
      return compatibleValues.includes(techValue);
    });
  }

  /**
   * 获取推荐的固定模板
   * @param framework 框架
   * @param builder 构建工具
   * @returns 推荐的模板名称
   */
  public static getRecommendedTemplate(framework?: string, builder?: string): string | null {
    // 基于框架和构建工具的简单推荐逻辑
    if (framework === 'vue3' || framework === 'vue') {
      if (builder === 'vite' || !builder) {
        return 'vue3-vite-typescript';
      }
    }
    
    if (framework === 'react') {
      if (builder === 'webpack') {
        return 'react-webpack-typescript';
      }
      if (builder === 'umi') {
        return 'umijs';
      }
    }
    
    return null;
  }

  /**
   * 分析技术栈并提供建议
   * @param techStack 技术栈
   * @returns 分析结果和建议
   */
  public static analyzeTechStack(techStack: TechStack): {
    canUseFixedTemplate: boolean;
    recommendedTemplate?: string;
    reason: string;
    suggestions?: string[];
  } {
    const recommendedTemplate = this.recognizeIntent(techStack);
    
    if (recommendedTemplate) {
      return {
        canUseFixedTemplate: true,
        recommendedTemplate,
        reason: `技术栈组合与固定模板 ${recommendedTemplate} 兼容`,
        suggestions: [`使用固定模板 ${recommendedTemplate} 可以获得更好的性能和稳定性`]
      };
    }
    
    // 检查是否有不兼容的组合
    if (this.hasIncompatibleCombination(techStack)) {
      return {
        canUseFixedTemplate: false,
        reason: '技术栈包含不兼容的组合，需要使用动态生成器',
        suggestions: [
          '考虑使用更常见的技术栈组合',
          '或者使用动态生成器来创建自定义项目结构'
        ]
      };
    }
    
    return {
      canUseFixedTemplate: false,
      reason: '技术栈组合不在固定模板支持范围内',
      suggestions: [
        '将使用动态生成器创建项目',
        '如果需要更好的性能，可以考虑使用推荐的技术栈组合'
      ]
    };
  }
}