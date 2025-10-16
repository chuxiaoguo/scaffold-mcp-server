#!/usr/bin/env node

/**
 * 简化测试 - 只测试脚手架生成，不安装依赖
 */

import { generateScaffold } from './dist/tools/generateScaffold.js';
import path from 'path';
import fs from 'fs/promises';

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function simpleTest() {
  colorLog('cyan', '\n🚀 简化测试 - 脚手架生成验证');
  colorLog('cyan', '='.repeat(50));
  
  const testOutputDir = '/Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/simple-test-output';
  
  // 测试用例
  const testCases = [
    {
      name: '用户原始案例 - UmiJS项目',
      tech_stack: 'umijs',
      project_name: 'nima-test',
      expectedFiles: ['package.json', '.umirc.ts', 'src/pages/index.tsx', 'README.md']
    },
    {
      name: 'React + Vite + TypeScript (动态生成)',
      tech_stack: 'react+vite+typescript',
      project_name: 'react-vite-test',
      expectedFiles: ['package.json', 'vite.config.ts', 'src/main.tsx', 'index.html']
    },
    {
      name: 'Vue3 + Vite + TypeScript (固定模板)',
      tech_stack: 'vue3+vite+typescript',
      project_name: 'vue3-vite-test',
      expectedFiles: ['package.json', 'vite.config.ts', 'src/main.ts', 'index.html']
    }
  ];
  
  let totalTests = 0;
  let successTests = 0;
  const results = [];
  
  try {
    // 清理测试输出目录
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略删除错误
    }
    
    await fs.mkdir(testOutputDir, { recursive: true });
    
    for (const testCase of testCases) {
      totalTests++;
      colorLog('blue', `\n📋 测试: ${testCase.name}`);
      console.log(`技术栈: ${testCase.tech_stack}`);
      console.log(`项目名: ${testCase.project_name}`);
      
      const startTime = Date.now();
      
      try {
        const result = await generateScaffold({
          tech_stack: testCase.tech_stack,
          project_name: testCase.project_name,
          output_dir: testOutputDir,
          install_dependencies: false // 关键：不安装依赖
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 验证生成的文件
        const projectPath = path.join(testOutputDir, testCase.project_name);
        const stats = await fs.stat(projectPath);
        
        if (stats.isDirectory()) {
          let fileCheckResults = [];
          let allFilesExist = true;
          
          for (const file of testCase.expectedFiles) {
            try {
              await fs.access(path.join(projectPath, file));
              fileCheckResults.push(`✅ ${file}`);
            } catch (error) {
              fileCheckResults.push(`❌ ${file} (缺失)`);
              allFilesExist = false;
            }
          }
          
          console.log('📁 文件检查:');
          fileCheckResults.forEach(result => console.log(`  ${result}`));
          
          if (allFilesExist) {
            colorLog('green', `✅ 测试成功！耗时: ${Math.round(duration / 1000)}秒`);
            successTests++;
            results.push({
              testCase: testCase.name,
              success: true,
              duration,
              files: fileCheckResults
            });
          } else {
            colorLog('red', `❌ 测试失败：缺少预期文件`);
            results.push({
              testCase: testCase.name,
              success: false,
              error: '缺少预期文件',
              files: fileCheckResults
            });
          }
        } else {
          colorLog('red', '❌ 项目目录创建失败');
          results.push({
            testCase: testCase.name,
            success: false,
            error: '项目目录创建失败'
          });
        }
        
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        colorLog('red', `❌ 测试失败: ${error.message}`);
        results.push({
          testCase: testCase.name,
          success: false,
          error: error.message,
          duration
        });
      }
    }
    
    // 生成测试报告
    colorLog('cyan', '\n📊 测试报告');
    colorLog('cyan', '='.repeat(50));
    
    console.log(`总测试数: ${totalTests}`);
    colorLog('green', `成功数: ${successTests}`);
    colorLog('red', `失败数: ${totalTests - successTests}`);
    
    const successRate = Math.round((successTests / totalTests) * 100);
    console.log(`成功率: ${successRate}%`);
    
    // 详细结果
    console.log('\n📋 详细结果:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testCase}`);
      if (!result.success) {
        console.log(`   错误: ${result.error}`);
      }
      if (result.duration) {
        console.log(`   耗时: ${Math.round(result.duration / 1000)}秒`);
      }
    });
    
    // 用户原始案例特别检查
    const userCase = results.find(r => r.testCase.includes('用户原始案例'));
    if (userCase) {
      colorLog('cyan', '\n🎯 用户原始案例检查:');
      const status = userCase.success ? '✅' : '❌';
      console.log(`${status} ${userCase.success ? '通过' : '失败'}`);
      if (!userCase.success) {
        console.log(`错误: ${userCase.error}`);
      }
    }
    
    if (successTests === totalTests) {
      colorLog('green', '\n🎉 所有测试都通过了！');
      return true;
    } else {
      colorLog('yellow', `\n⚠️  ${totalTests - successTests} 个测试失败，需要进一步修复`);
      return false;
    }
    
  } catch (error) {
    colorLog('red', `测试运行失败: ${error.message}`);
    console.error(error);
    return false;
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      colorLog('red', `测试运行失败: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

export { simpleTest };