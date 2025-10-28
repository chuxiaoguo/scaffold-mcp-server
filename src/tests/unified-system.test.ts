import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UnifiedProjectGenerator } from '../core/UnifiedProjectGenerator.js';
import { BackwardCompatibilityAdapter, generateProject } from '../core/BackwardCompatibilityAdapter.js';
import { TechStack } from '../types/index.js';

describe('统一项目生成系统测试', () => {
  const testOutputDir = path.join(process.cwd(), 'test-output');
  let unifiedGenerator: UnifiedProjectGenerator;
  let backwardAdapter: BackwardCompatibilityAdapter;

  beforeEach(async () => {
    unifiedGenerator = new UnifiedProjectGenerator();
    backwardAdapter = new BackwardCompatibilityAdapter();
    
    // 确保测试输出目录存在
    try {
      await fs.mkdir(testOutputDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
  });

  afterEach(async () => {
    // 清理测试输出目录
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('UnifiedProjectGenerator 测试', () => {
    it('应该能够处理字符串数组输入格式', async () => {
      const toolInput = ['vue3', 'vite', 'typescript'];
      const options = {
        projectName: 'test-vue-project',
        outputDir: testOutputDir,
        preview: true
      };

      const result = await unifiedGenerator.generateProject(toolInput, options);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-vue-project');
      expect(result.files).toBeDefined();
      expect(Object.keys(result.files).length).toBeGreaterThan(0);
      expect(result.packageJson).toBeDefined();
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
    });

    it('应该能够处理TechStack对象输入格式', async () => {
      const techStack: TechStack = {
        framework: 'react',
        builder: 'vite',
        language: 'typescript',
        ui: 'antd',
        style: 'sass',
        router: 'react-router',
        state: 'zustand'
      };

      const options = {
        projectName: 'test-react-project',
        outputDir: testOutputDir,
        preview: true
      };

      const result = await unifiedGenerator.generateProject(techStack, options);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-react-project');
      expect(result.files).toBeDefined();
      expect(Object.keys(result.files).length).toBeGreaterThan(0);
      expect(result.packageJson).toBeDefined();
      expect(result.packageJson.dependencies).toBeDefined();
    });

    it('应该能够处理混合工具输入格式', async () => {
      const toolInput = {
        tools: ['vue3', 'typescript', 'element-plus', 'pinia']
      };

      const options = {
        projectName: 'test-mixed-project',
        outputDir: testOutputDir,
        preview: true
      };

      const result = await unifiedGenerator.generateProject(toolInput, options);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-mixed-project');
      expect(result.files).toBeDefined();
      expect(result.packageJson).toBeDefined();
    });

    it('应该能够验证输入参数', () => {
      const validInput = ['vue3', 'vite', 'typescript'];
      const invalidInput = ['invalid-framework', 'unknown-tool'];

      const validResult = unifiedGenerator.validateInput(validInput);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors.length).toBe(0);

      const invalidResult = unifiedGenerator.validateInput(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('应该能够获取可用策略', () => {
      const strategies = unifiedGenerator.getAvailableStrategies();
      expect(strategies).toBeDefined();
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
    });

    it('应该能够获取工具分类', () => {
      const categories = unifiedGenerator.getToolCategories();
      expect(categories).toBeDefined();
      expect(typeof categories).toBe('object');
      expect(Object.keys(categories).length).toBeGreaterThan(0);
    });
  });

  describe('BackwardCompatibilityAdapter 测试', () => {
    it('应该能够处理原有的字符串输入格式', async () => {
      const result = await backwardAdapter.generateProject(
        'vue3',
        'test-backward-string',
        testOutputDir,
        [],
        { dryRun: true }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('test-backward-string');
      expect(result.directoryTree).toBeDefined();
      expect(result.fileSummary).toBeDefined();
      expect(result.processLogs).toBeDefined();
    });

    it('应该能够处理原有的字符串数组输入格式', async () => {
      const result = await backwardAdapter.generateProject(
        ['react', 'vite', 'typescript'],
        'test-backward-array',
        testOutputDir,
        ['antd', 'react-router'],
        { dryRun: true }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('test-backward-array');
      expect(result.directoryTree).toBeDefined();
      expect(result.fileSummary).toBeDefined();
      expect(result.processLogs).toBeDefined();
    });

    it('应该能够验证输入参数', () => {
      const validResult = backwardAdapter.validateInput(['vue3', 'vite']);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors.length).toBe(0);

      const invalidResult = backwardAdapter.validateInput(['invalid-tool']);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('应该能够获取统一生成器实例', () => {
      const unifiedGen = backwardAdapter.getUnifiedGenerator();
      expect(unifiedGen).toBeInstanceOf(UnifiedProjectGenerator);
    });
  });

  describe('全局 generateProject 函数测试', () => {
    it('应该保持与原有API完全一致', async () => {
      const result = await generateProject(
        ['vue3', 'vite', 'typescript'],
        'test-global-function',
        testOutputDir,
        ['vue-router', 'pinia'],
        { dryRun: true }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('test-global-function');
      expect(result.projectPath).toBeDefined();
      expect(result.directoryTree).toBeDefined();
      expect(result.fileSummary).toBeDefined();
      expect(result.processLogs).toBeDefined();
    });

    it('应该能够处理错误情况', async () => {
      const result = await generateProject(
        ['invalid-framework'],
        'test-error-handling',
        testOutputDir,
        [],
        { dryRun: true }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('失败');
      expect(result.processLogs).toBeDefined();
    });
  });

  describe('集成测试', () => {
    it('应该能够生成完整的Vue3项目', async () => {
      const result = await generateProject(
        ['vue3', 'vite', 'typescript', 'element-plus', 'vue-router', 'pinia'],
        'integration-vue3',
        testOutputDir,
        [],
        { dryRun: true }
      );

      expect(result.success).toBe(true);
      expect(result.fileSummary).toBeDefined();
      expect(result.fileSummary!.length).toBeGreaterThan(5);
      expect(result.directoryTree).toContain('src/');
      expect(result.directoryTree).toContain('package.json');
    });

    it('应该能够生成完整的React项目', async () => {
      const result = await generateProject(
        ['react', 'vite', 'typescript', 'antd', 'react-router', 'zustand'],
        'integration-react',
        testOutputDir,
        [],
        { dryRun: true }
      );

      expect(result.success).toBe(true);
      expect(result.fileSummary).toBeDefined();
      expect(result.fileSummary!.length).toBeGreaterThan(5);
      expect(result.directoryTree).toContain('src/');
      expect(result.directoryTree).toContain('package.json');
    });

    it('应该能够处理复杂的技术栈组合', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
        builder: 'vite',
        language: 'typescript',
        ui: 'element-plus',
        style: 'sass',
        router: 'vue-router',
        state: 'pinia'
      };

      const result = await unifiedGenerator.generateProject(techStack, {
        projectName: 'complex-stack',
        outputDir: testOutputDir,
        preview: true
      });

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.packageJson.dependencies).toBeDefined();
      expect(result.packageJson.devDependencies).toBeDefined();
      
      // 检查是否包含预期的依赖
      const allDeps = {
        ...result.packageJson.dependencies,
        ...result.packageJson.devDependencies
      };
      
      expect(allDeps).toHaveProperty('vue');
      expect(allDeps).toHaveProperty('typescript');
      expect(allDeps).toHaveProperty('element-plus');
      expect(allDeps).toHaveProperty('vue-router');
      expect(allDeps).toHaveProperty('pinia');
    });
  });

  describe('性能测试', () => {
    it('应该能够在合理时间内完成项目生成', async () => {
      const startTime = Date.now();
      
      const result = await generateProject(
        ['vue3', 'vite', 'typescript'],
        'performance-test',
        testOutputDir,
        [],
        { dryRun: true }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    });
  });

  describe('边界情况测试', () => {
    it('应该能够处理空输入', async () => {
      const result = await generateProject(
        [],
        'empty-input-test',
        testOutputDir,
        [],
        { dryRun: true }
      );

      // 空输入应该使用默认配置
      expect(result.success).toBe(true);
    });

    it('应该能够处理重复工具', async () => {
      const result = await generateProject(
        ['vue3', 'vue3', 'vite', 'vite', 'typescript'],
        'duplicate-tools-test',
        testOutputDir,
        [],
        { dryRun: true }
      );

      expect(result.success).toBe(true);
    });

    it('应该能够处理冲突的工具组合', async () => {
      const result = await generateProject(
        ['vue3', 'react'], // 冲突的框架
        'conflict-test',
        testOutputDir,
        [],
        { dryRun: true }
      );

      // 应该能够处理冲突，可能选择第一个或报错
      expect(result).toBeDefined();
    });
  });
});