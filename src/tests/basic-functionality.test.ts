import { describe, it, expect } from '@jest/globals';

describe('基础功能测试', () => {
  it('应该能够导入构建后的模块', async () => {
    // 测试构建后的模块是否可以正常导入
    const { generateProject } = await import('../../dist/tools/projectGenerator.js');
    
    expect(generateProject).toBeDefined();
    expect(typeof generateProject).toBe('function');
  });

  it('应该能够调用generateProject函数', async () => {
    const { generateProject } = await import('../../dist/tools/projectGenerator.js');
    
    const result = await generateProject(
      ['vue3'],
      'test-project',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('success');
  });

  it('应该能够处理不同的输入格式', async () => {
    const { generateProject } = await import('../../dist/tools/projectGenerator.js');
    
    // 测试字符串输入
    const stringResult = await generateProject(
      'react',
      'test-string',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );
    
    expect(stringResult).toBeDefined();
    expect(stringResult).toHaveProperty('success');

    // 测试数组输入
    const arrayResult = await generateProject(
      ['vue3', 'vite'],
      'test-array',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );
    
    expect(arrayResult).toBeDefined();
    expect(arrayResult).toHaveProperty('success');
  });

  it('应该返回正确的结果结构', async () => {
    const { generateProject } = await import('../../dist/tools/projectGenerator.js');
    
    const result = await generateProject(
      ['react', 'vite'],
      'test-structure',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );

    // 验证返回结构
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('projectPath');
    expect(result).toHaveProperty('directoryTree');
    expect(result).toHaveProperty('fileSummary');
    expect(result).toHaveProperty('processLogs');
    
    // 验证类型
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
    expect(typeof result.projectPath).toBe('string');
    expect(Array.isArray(result.processLogs)).toBe(true);
  });
});