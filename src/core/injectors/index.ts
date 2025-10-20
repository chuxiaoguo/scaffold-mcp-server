import type { TechStack } from '../../types/index.js';
import { EslintInjector } from './eslintInjector.js';
import { PrettierInjector } from './prettierInjector.js';
import { JestInjector } from './jestInjector.js';
import { MockInjector } from './mockInjector.js';
import { StylelintInjector } from './stylelintInjector.js';
import { LintStagedInjector } from './lintStagedInjector.js';
import { HuskyInjector } from './huskyInjector.js';
import { CommitlintInjector } from './commitlintInjector.js';
import { GitignoreInjector } from './gitignoreInjector.js';
import { NpmrcInjector } from './npmrcInjector.js';
import { EditorConfigInjector } from './editorConfigInjector.js';

export interface InjectorResult {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface IToolInjector {
  inject(techStack: TechStack, projectName: string): Promise<InjectorResult>;
  isRequired(techStack: TechStack): boolean;
}

// 导出所有注入器
export { EslintInjector } from './eslintInjector.js';
export { PrettierInjector } from './prettierInjector.js';
export { JestInjector } from './jestInjector.js';
export { MockInjector } from './mockInjector.js';
export { StylelintInjector } from './stylelintInjector.js';
export { LintStagedInjector } from './lintStagedInjector.js';
export { HuskyInjector } from './huskyInjector.js';
export { CommitlintInjector } from './commitlintInjector.js';
export { GitignoreInjector } from './gitignoreInjector.js';
export { NpmrcInjector } from './npmrcInjector.js';
export { EditorConfigInjector } from './editorConfigInjector.js';

/**
 * 通用工具注入器管理器
 */
export class ToolInjectorManager {
  private injectors: IToolInjector[] = [];

  constructor() {
    // 注册所有注入器
    this.registerInjectors();
  }

  private registerInjectors(): void {
    // 暂时注释掉所有注入器，专注于模板功能
    this.injectors = [
      // new EslintInjector(),
      // new PrettierInjector(),
      // new JestInjector(),
      // new MockInjector(),
      // new StylelintInjector(),
      // new LintStagedInjector(),
      // new HuskyInjector(),
      // new CommitlintInjector(),
      // new GitignoreInjector(),
      // new NpmrcInjector(),
      // new EditorConfigInjector()
    ];
  }

  /**
   * 注入所有必需的工具
   */
  async injectAll(techStack: TechStack, projectName: string, existingFiles: Set<string> = new Set()): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      dependencies: {},
      devDependencies: {},
      scripts: {}
    };

    for (const injector of this.injectors) {
      if (injector.isRequired(techStack)) {
        const injectorResult = await injector.inject(techStack, projectName);
        
        // 合并文件（不覆盖已存在的文件）
        for (const [filePath, content] of Object.entries(injectorResult.files)) {
          if (!existingFiles.has(filePath)) {
            result.files[filePath] = content;
          }
        }

        // 合并依赖
        if (injectorResult.dependencies) {
          Object.assign(result.dependencies!, injectorResult.dependencies);
        }

        if (injectorResult.devDependencies) {
          Object.assign(result.devDependencies!, injectorResult.devDependencies);
        }

        if (injectorResult.scripts) {
          Object.assign(result.scripts!, injectorResult.scripts);
        }
      }
    }

    return result;
  }

  /**
   * 注入特定工具
   */
  async injectSpecific(toolNames: string[], techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      dependencies: {},
      devDependencies: {},
      scripts: {}
    };

    for (const injector of this.injectors) {
      const injectorName = injector.constructor.name.toLowerCase().replace('injector', '');
      
      if (toolNames.includes(injectorName)) {
        const injectorResult = await injector.inject(techStack, projectName);
        
        Object.assign(result.files, injectorResult.files);
        
        if (injectorResult.dependencies) {
          Object.assign(result.dependencies!, injectorResult.dependencies);
        }

        if (injectorResult.devDependencies) {
          Object.assign(result.devDependencies!, injectorResult.devDependencies);
        }

        if (injectorResult.scripts) {
          Object.assign(result.scripts!, injectorResult.scripts);
        }
      }
    }

    return result;
  }

  /**
   * 获取支持的工具列表
   */
  getSupportedTools(): string[] {
    return this.injectors.map(injector => 
      injector.constructor.name.toLowerCase().replace('injector', '')
    );
  }
}