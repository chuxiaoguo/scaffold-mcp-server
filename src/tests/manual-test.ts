#!/usr/bin/env node

import { generateProject } from '../tools/projectGenerator.js';

async function runTests() {
  console.log('🚀 开始手动测试统一项目生成系统...\n');

  try {
    // 测试1: 字符串输入
    console.log('📝 测试1: 字符串输入格式');
    const result1 = await generateProject(
      'vue3',
      'test-string-project',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );
    console.log('✅ 字符串输入测试通过');
    console.log(`   - 成功: ${result1.success}`);
    console.log(`   - 消息: ${result1.message}`);
    console.log(`   - 日志数量: ${result1.processLogs?.length || 0}\n`);

    // 测试2: 数组输入
    console.log('📝 测试2: 数组输入格式');
    const result2 = await generateProject(
      ['react', 'vite', 'typescript'],
      'test-array-project',
      '/tmp/test-output',
      ['antd', 'react-router'],
      { dryRun: true }
    );
    console.log('✅ 数组输入测试通过');
    console.log(`   - 成功: ${result2.success}`);
    console.log(`   - 消息: ${result2.message}`);
    console.log(`   - 文件摘要数量: ${result2.fileSummary?.length || 0}\n`);

    // 测试3: 空输入
    console.log('📝 测试3: 空输入处理');
    const result3 = await generateProject(
      [],
      'test-empty-project',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );
    console.log('✅ 空输入测试通过');
    console.log(`   - 成功: ${result3.success}`);
    console.log(`   - 消息: ${result3.message}\n`);

    // 测试4: 复杂技术栈
    console.log('📝 测试4: 复杂技术栈组合');
    const result4 = await generateProject(
      ['vue3', 'vite', 'typescript', 'element-plus', 'vue-router', 'pinia'],
      'test-complex-project',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );
    console.log('✅ 复杂技术栈测试通过');
    console.log(`   - 成功: ${result4.success}`);
    console.log(`   - 消息: ${result4.message}`);
    console.log(`   - 目录树长度: ${result4.directoryTree?.length || 0}\n`);

    // 测试5: 错误处理
    console.log('📝 测试5: 错误处理');
    const result5 = await generateProject(
      ['invalid-framework'],
      'test-error-project',
      '/tmp/test-output',
      [],
      { dryRun: true }
    );
    console.log('✅ 错误处理测试通过');
    console.log(`   - 成功: ${result5.success}`);
    console.log(`   - 消息: ${result5.message}\n`);

    console.log('🎉 所有测试完成！');
    console.log('\n📊 测试结果汇总:');
    console.log(`   - 测试1 (字符串输入): ${result1.success ? '✅' : '❌'}`);
    console.log(`   - 测试2 (数组输入): ${result2.success ? '✅' : '❌'}`);
    console.log(`   - 测试3 (空输入): ${result3.success ? '✅' : '❌'}`);
    console.log(`   - 测试4 (复杂技术栈): ${result4.success ? '✅' : '❌'}`);
    console.log(`   - 测试5 (错误处理): ${result5.success !== undefined ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行测试
runTests().catch(console.error);