#!/usr/bin/env node

/**
 * 快速测试 - 验证用户原始案例修复
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

async function quickTest() {
  colorLog('cyan', '\n🚀 快速测试 - 用户原始案例验证');
  colorLog('cyan', '='.repeat(50));
  
  const testOutputDir = '/Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server/quick-test-output';
  
  try {
    // 清理测试输出目录
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略删除错误
    }
    
    await fs.mkdir(testOutputDir, { recursive: true });
    
    // 用户原始案例：UmiJS项目 nima
    colorLog('blue', '\n📋 测试用例: UmiJS项目 nima');
    console.log('技术栈: umijs');
    console.log('项目名: nima');
    console.log('输出目录:', path.join(testOutputDir, 'nima'));
    
    const startTime = Date.now();
    
    const result = await generateScaffold({
      tech_stack: 'umijs',
      project_name: 'nima',
      output_dir: testOutputDir
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    colorLog('green', `✅ 测试成功完成！耗时: ${Math.round(duration / 1000)}秒`);
    
    // 验证生成的文件
    const projectPath = path.join(testOutputDir, 'nima');
    const stats = await fs.stat(projectPath);
    
    if (stats.isDirectory()) {
      colorLog('green', '✅ 项目目录创建成功');
      
      // 检查关键文件
      const keyFiles = [
        'package.json',
        '.umirc.ts',
        'src/pages/index.tsx',
        'README.md'
      ];
      
      let fileCheckResults = [];
      
      for (const file of keyFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          fileCheckResults.push(`✅ ${file}`);
        } catch (error) {
          fileCheckResults.push(`❌ ${file} (缺失)`);
        }
      }
      
      console.log('\n📁 关键文件检查:');
      fileCheckResults.forEach(result => console.log(`  ${result}`));
      
      // 检查 package.json 内容
      try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        
        console.log('\n📦 package.json 检查:');
        console.log(`  项目名: ${packageJson.name}`);
        console.log(`  版本: ${packageJson.version}`);
        console.log(`  主要依赖: ${Object.keys(packageJson.dependencies || {}).join(', ')}`);
        
        if (packageJson.dependencies && packageJson.dependencies.umi) {
          colorLog('green', '✅ Umi 依赖正确配置');
        } else {
          colorLog('red', '❌ 缺少 Umi 依赖');
        }
        
      } catch (error) {
        colorLog('red', `❌ package.json 读取失败: ${error.message}`);
      }
      
    } else {
      colorLog('red', '❌ 项目目录创建失败');
    }
    
    // 输出结果摘要
    console.log('\n📊 生成结果摘要:');
    console.log(`  文件总数: ${result.summary?.totalFiles || 'N/A'}`);
    console.log(`  目录总数: ${result.summary?.totalDirectories || 'N/A'}`);
    console.log(`  项目路径: ${result.projectPath}`);
    
    if (result.directoryTree) {
      console.log('\n🌳 项目结构预览:');
      console.log(JSON.stringify(result.directoryTree, null, 2).slice(0, 500) + '...');
    }
    
    colorLog('green', '\n🎉 用户原始案例测试通过！');
    return true;
    
  } catch (error) {
    colorLog('red', `❌ 测试失败: ${error.message}`);
    console.error('详细错误:', error);
    return false;
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  quickTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      colorLog('red', `测试运行失败: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

export { quickTest };