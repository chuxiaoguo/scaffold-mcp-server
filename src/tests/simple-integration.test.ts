import { describe, it, expect } from '@jest/globals';
import { generateProject } from '../tools/projectGenerator.js';

describe('简化集成测试', () => {
  const testOutputDir = '/tmp/test-scaffold-output';

  it('应该能够调用generateProject函数', async () => {
    const result = await generateProject(
      ['vue3', 'vite', 'typescript'],
      'test-project',
      testOutputDir,
      [],
      { dryRun: true }
    );

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('success');
  });

  it('应该能够处理字符串输入', async () => {
    const result = await generateProject(
      'vue3',
      'test-string-project',
      testOutputDir,
      [],
      { dryRun: true }
    );

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('success');
  });

  it('应该能够处理空工具数组', async () => {
    const result = await generateProject(
      [],
      'test-empty-project',
      testOutputDir,
      [],
      { dryRun: true }
    );

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('success');
  });

  it('应该返回包含必要字段的结果', async () => {
    const result = await generateProject(
      ['react', 'vite'],
      'test-fields-project',
      testOutputDir,
      [],
      { dryRun: true }
    );

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('projectPath');
    expect(result).toHaveProperty('directoryTree');
    expect(result).toHaveProperty('fileSummary');
    expect(result).toHaveProperty('processLogs');
  });
});