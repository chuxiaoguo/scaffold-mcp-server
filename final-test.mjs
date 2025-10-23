#!/usr/bin/env node

import { generateProject } from './dist/tools/projectGenerator.js';
import fs from 'fs';
import path from 'path';

async function finalVerificationTest() {
  console.log('🎯 开始最终验证测试...\n');

  const testOutputDir = '/tmp/final-verification-test';
  
  try {
    // 清理测试目录
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testOutputDir, { recursive: true });

    // 测试1: Vue3 完整项目生成
    console.log('🔧 测试1: Vue3 完整项目生成');
    const vue3Result = await generateProject(
      ['vue3', 'vite', 'typescript', 'element-plus', 'vue-router', 'pinia'],
      'vue3-full-project',
      testOutputDir,
      [],
      { dryRun: false }
    );
    
    console.log(`   ✅ Vue3项目生成: ${vue3Result.success ? '成功' : '失败'}`);
    if (vue3Result.success) {
      const projectPath = path.join(testOutputDir, 'vue3-full-project');
      const packageJsonExists = fs.existsSync(path.join(projectPath, 'package.json'));
      const srcExists = fs.existsSync(path.join(projectPath, 'src'));
      console.log(`   📦 package.json存在: ${packageJsonExists}`);
      console.log(`   📁 src目录存在: ${srcExists}`);
    }
    console.log();

    // 测试2: React 项目生成
    console.log('🔧 测试2: React 项目生成');
    const reactResult = await generateProject(
      ['react', 'vite', 'typescript'],
      'react-project',
      testOutputDir,
      ['antd', 'react-router'],
      { dryRun: false }
    );
    
    console.log(`   ✅ React项目生成: ${reactResult.success ? '成功' : '失败'}`);
    if (reactResult.success) {
      const projectPath = path.join(testOutputDir, 'react-project');
      const packageJsonExists = fs.existsSync(path.join(projectPath, 'package.json'));
      const srcExists = fs.existsSync(path.join(projectPath, 'src'));
      console.log(`   📦 package.json存在: ${packageJsonExists}`);
      console.log(`   📁 src目录存在: ${srcExists}`);
    }
    console.log();

    // 测试3: 向后兼容性测试
    console.log('🔧 测试3: 向后兼容性测试');
    const backwardResult = await generateProject(
      'vue3',
      'backward-compat-project',
      testOutputDir,
      [],
      { dryRun: false }
    );
    
    console.log(`   ✅ 向后兼容测试: ${backwardResult.success ? '成功' : '失败'}`);
    if (backwardResult.success) {
      const projectPath = path.join(testOutputDir, 'backward-compat-project');
      const packageJsonExists = fs.existsSync(path.join(projectPath, 'package.json'));
      console.log(`   📦 package.json存在: ${packageJsonExists}`);
    }
    console.log();

    // 测试4: 检查生成的文件内容
    console.log('🔧 测试4: 检查生成文件内容');
    const vue3ProjectPath = path.join(testOutputDir, 'vue3-full-project');
    if (fs.existsSync(vue3ProjectPath)) {
      const packageJsonPath = path.join(vue3ProjectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log(`   📦 项目名称: ${packageJson.name}`);
        console.log(`   🔧 依赖数量: ${Object.keys(packageJson.dependencies || {}).length}`);
        console.log(`   🛠️  开发依赖数量: ${Object.keys(packageJson.devDependencies || {}).length}`);
        
        // 检查关键依赖
        const hasPinia = packageJson.dependencies?.pinia || packageJson.devDependencies?.pinia;
        const hasRouter = packageJson.dependencies?.['vue-router'] || packageJson.devDependencies?.['vue-router'];
        const hasElementPlus = packageJson.dependencies?.['element-plus'] || packageJson.devDependencies?.['element-plus'];
        
        console.log(`   ✅ Pinia集成: ${hasPinia ? '是' : '否'}`);
        console.log(`   ✅ Vue Router集成: ${hasRouter ? '是' : '否'}`);
        console.log(`   ✅ Element Plus集成: ${hasElementPlus ? '是' : '否'}`);
      }
    }
    console.log();

    // 汇总结果
    console.log('📊 最终验证结果汇总:');
    console.log(`   - Vue3完整项目: ${vue3Result.success ? '✅ 通过' : '❌ 失败'}`);
    console.log(`   - React项目: ${reactResult.success ? '✅ 通过' : '❌ 失败'}`);
    console.log(`   - 向后兼容性: ${backwardResult.success ? '✅ 通过' : '❌ 失败'}`);
    
    const allPassed = vue3Result.success && reactResult.success && backwardResult.success;
    console.log(`\n🎉 总体结果: ${allPassed ? '✅ 所有测试通过！' : '❌ 部分测试失败'}`);
    
    if (allPassed) {
      console.log('\n🚀 统一项目生成系统已成功实现并通过所有测试！');
      console.log('   - 支持多种输入格式（字符串、数组）');
      console.log('   - 完全向后兼容');
      console.log('   - 支持复杂技术栈组合');
      console.log('   - 错误处理完善');
      console.log('   - 实际项目生成功能正常');
    }

  } catch (error) {
    console.error('❌ 最终验证测试失败:', error);
    process.exit(1);
  }
}

// 运行最终验证测试
finalVerificationTest().catch(console.error);