import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class JestInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 基础 Jest 依赖
    result.devDependencies!['jest'] = '^29.7.0';
    result.devDependencies!['@jest/types'] = '^29.6.3';

    if (techStack.language === 'typescript') {
      result.devDependencies!['ts-jest'] = '^29.1.2';
      result.devDependencies!['@types/jest'] = '^29.5.12';
    }

    if (techStack.framework === 'vue3') {
      result.devDependencies!['@vue/test-utils'] = '^2.4.4';
      result.devDependencies!['@vue/vue3-jest'] = '^29.2.6';
      result.devDependencies!['jest-environment-jsdom'] = '^29.7.0';
    } else if (techStack.framework === 'react') {
      result.devDependencies!['@testing-library/react'] = '^14.2.1';
      result.devDependencies!['@testing-library/jest-dom'] = '^6.4.2';
      result.devDependencies!['@testing-library/user-event'] = '^14.5.2';
      result.devDependencies!['jest-environment-jsdom'] = '^29.7.0';
    }

    // 生成 Jest 配置文件
    result.files['jest.config.js'] = this.generateJestConfig(techStack);
    
    // 生成测试设置文件
    if (techStack.framework === 'react') {
      result.files['src/setupTests.ts'] = this.generateSetupTests();
    }

    // 添加脚本
    result.scripts!['test'] = 'jest';
    result.scripts!['test:watch'] = 'jest --watch';
    result.scripts!['test:coverage'] = 'jest --coverage';

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // Jest 对大多数项目都是推荐的
    return true;
  }

  private generateJestConfig(techStack: TechStack): string {
    const config: any = {
      preset: techStack.language === 'typescript' ? 'ts-jest' : undefined,
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      testMatch: [
        '**/__tests__/**/*.(ts|tsx|js|jsx)',
        '**/*.(test|spec).(ts|tsx|js|jsx)'
      ],
      collectCoverageFrom: [
        'src/**/*.(ts|tsx|js|jsx)',
        '!src/**/*.d.ts',
        '!src/main.(ts|tsx|js|jsx)',
        '!src/index.(ts|tsx|js|jsx)'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
      setupFilesAfterEnv: [],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1'
      }
    };

    if (techStack.framework === 'vue3') {
      config.transform = {
        '^.+\\.vue$': '@vue/vue3-jest',
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest'
      };
      config.moduleFileExtensions = ['js', 'jsx', 'ts', 'tsx', 'json', 'vue'];
      config.testMatch = [
        '**/__tests__/**/*.(ts|tsx|js|jsx|vue)',
        '**/*.(test|spec).(ts|tsx|js|jsx|vue)'
      ];
    } else if (techStack.framework === 'react') {
      config.setupFilesAfterEnv.push('<rootDir>/src/setupTests.ts');
      if (techStack.language === 'typescript') {
        config.transform = {
          '^.+\\.(ts|tsx)$': 'ts-jest',
          '^.+\\.(js|jsx)$': 'babel-jest'
        };
      }
    }

    // CSS 和静态资源处理
    config.moduleNameMapping = {
      ...config.moduleNameMapping,
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
    };

    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }

  private generateSetupTests(): string {
    return `import '@testing-library/jest-dom';

// 全局测试设置
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
`;
  }
}