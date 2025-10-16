#!/usr/bin/env node

/**
 * 本地脚手架测试脚本
 * 用于透明的本地调试和验证脚手架生成功能
 */

const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

// 测试配置
const TEST_CONFIG = {
  // 测试项目名称
  projectName: 'test-scaffold-project',
  
  // 测试技术栈
  techStacks: [
    'react,typescript,webpack,tailwind,antd,jest,msw',
    'vue3,typescript,vite,tailwind,element-plus,vitest',
    'electron,vue3,vite,typescript,sass'
  ],
  
  // 测试输出目录
  outputDirs: [
    path.resolve(process.cwd(), 'test-output'),
    path.resolve(require('os').homedir(), 'Desktop', 'scaffold-test'),
    path.resolve(require('os').tmpdir(), 'scaffold-test')
  ]
};

/**
 * 清理测试目录
 */
async function cleanupTestDirs() {
  console.log('🧹 清理测试目录...');
  
  for (const dir of TEST_CONFIG.outputDirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log(`✅ 清理目录: ${dir}`);
    } catch (error) {
      console.log(`⚠️  清理目录失败: ${dir} - ${error.message}`);
    }
  }
}

/**
 * 检查脚手架服务器状态
 */
async function checkScaffoldServer() {
  console.log('🔍 检查脚手架服务器状态...');
  
  const serverPath = path.resolve(__dirname, 'scaffold-mcp-server');
  const packageJsonPath = path.join(serverPath, 'package.json');
  
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    console.log(`📦 脚手架服务器版本: ${packageJson.version}`);
    console.log(`📁 服务器路径: ${serverPath}`);
    
    // 检查关键文件
    const keyFiles = [
      'src/tools/generateScaffold.ts',
      'src/core/matcher.ts',
      'src/core/config/templateConfigManager.ts', // 修正路径
      'scaffold-template/templates.config.json'
    ];
    
    for (const file of keyFiles) {
      const filePath = path.join(serverPath, file);
      try {
        await fs.access(filePath);
        console.log(`✅ 关键文件存在: ${file}`);
      } catch (error) {
        console.log(`❌ 关键文件缺失: ${file}`);
      }
    }
    
    // 检查构建输出
    const distPath = path.join(serverPath, 'dist');
    try {
      await fs.access(distPath);
      console.log(`✅ 构建输出目录存在: dist/`);
      
      const distFiles = await fs.readdir(distPath, { recursive: true });
      console.log(`📁 构建文件数量: ${distFiles.length}`);
    } catch (error) {
      console.log(`❌ 构建输出目录不存在: dist/`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 检查脚手架服务器失败:`, error.message);
    return false;
  }
}

/**
 * 测试模板匹配
 */
async function testTemplateMatching() {
  console.log('🎯 测试模板匹配...');
  
  try {
    // 动态导入 ES 模块（使用构建后的 JS 文件）
    const { smartMatchFixedTemplate } = await import('./scaffold-mcp-server/dist/core/matcher.js');
    
    for (const techStackStr of TEST_CONFIG.techStacks) {
      console.log(`\n📋 测试技术栈: ${techStackStr}`);
      
      try {
        const result = await smartMatchFixedTemplate(techStackStr);
        
        if (result.matched) {
          console.log(`✅ 匹配成功:`);
          console.log(`   - 模板名称: ${result.template.name}`);
          console.log(`   - 匹配分数: ${result.score}`);
          console.log(`   - 模板描述: ${result.template.description}`);
        } else {
          console.log(`❌ 匹配失败: ${result.reason || '未知原因'}`);
        }
      } catch (error) {
        console.error(`❌ 模板匹配错误:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 测试模板匹配失败:`, error.message);
    return false;
  }
}

/**
 * 测试脚手架生成
 */
async function testScaffoldGeneration() {
  console.log('🏗️  测试脚手架生成...');
  
  try {
    // 动态导入 ES 模块（使用构建后的 JS 文件）
    const { generateScaffold } = await import('./scaffold-mcp-server/dist/tools/generateScaffold.js');
    
    for (let i = 0; i < TEST_CONFIG.techStacks.length; i++) {
      const techStack = TEST_CONFIG.techStacks[i];
      const outputDir = TEST_CONFIG.outputDirs[i] || TEST_CONFIG.outputDirs[0];
      const projectName = `${TEST_CONFIG.projectName}-${i + 1}`;
      
      console.log(`\n🚀 生成项目: ${projectName}`);
      console.log(`📋 技术栈: ${techStack}`);
      console.log(`📁 输出目录: ${outputDir}`);
      
      try {
        const result = await generateScaffold({
          tech_stack: techStack,
          project_name: projectName,
          output_dir: outputDir,
          options: {
            dryRun: false,
            force: true,
            install: false // 跳过依赖安装以加快测试
          }
        });
        
        console.log(`✅ 项目生成成功:`);
        console.log(`   - 项目路径: ${result.targetPath}`);
        console.log(`   - 文件数量: ${result.files?.length || 0}`);
        console.log(`   - 模板来源: ${result.templateSource || '未知'}`);
        
        // 验证关键文件
        const keyFiles = ['package.json', 'README.md', '.gitignore'];
        for (const file of keyFiles) {
          const filePath = path.join(result.targetPath, file);
          try {
            await fs.access(filePath);
            console.log(`   ✅ 关键文件存在: ${file}`);
          } catch (error) {
            console.log(`   ❌ 关键文件缺失: ${file}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ 项目生成失败:`, error.message);
        console.error(`   错误详情:`, error.stack);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 测试脚手架生成失败:`, error.message);
    return false;
  }
}

/**
 * 运行性能测试
 */
async function runPerformanceTest() {
  console.log('⚡ 运行性能测试...');
  
  const startTime = Date.now();
  
  try {
    const { generateScaffold } = await import('./scaffold-mcp-server/dist/tools/generateScaffold.js');
    
    const result = await generateScaffold({
      tech_stack: 'react,typescript,webpack',
      project_name: 'perf-test',
      output_dir: path.resolve(require('os').tmpdir(), 'perf-test'),
      options: {
        dryRun: true, // 预览模式，不实际创建文件
        force: true,
        install: false
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 性能测试完成:`);
    console.log(`   - 耗时: ${duration}ms`);
    console.log(`   - 文件数量: ${result.files?.length || 0}`);
    console.log(`   - 平均每文件耗时: ${result.files?.length ? (duration / result.files.length).toFixed(2) : 0}ms`);
    
    return true;
  } catch (error) {
    console.error(`❌ 性能测试失败:`, error.message);
    return false;
  }
}

/**
 * 生成测试报告
 */
async function generateTestReport(results) {
  console.log('\n📊 测试报告');
  console.log('='.repeat(50));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n详细结果:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${test}`);
  });
  
  // 保存报告到文件
  const reportPath = path.resolve(process.cwd(), 'scaffold-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: (passedTests / totalTests) * 100
    }
  };
  
  try {
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 测试报告已保存: ${reportPath}`);
  } catch (error) {
    console.warn(`⚠️  保存测试报告失败: ${error.message}`);
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🧪 开始脚手架本地测试');
  console.log('='.repeat(50));
  
  const results = {};
  
  try {
    // 1. 清理测试目录
    await cleanupTestDirs();
    
    // 2. 检查脚手架服务器
    results['服务器状态检查'] = await checkScaffoldServer();
    
    // 3. 测试模板匹配
    results['模板匹配测试'] = await testTemplateMatching();
    
    // 4. 测试脚手架生成
    results['脚手架生成测试'] = await testScaffoldGeneration();
    
    // 5. 性能测试
    results['性能测试'] = await runPerformanceTest();
    
    // 6. 生成测试报告
    await generateTestReport(results);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 测试完成!');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  cleanupTestDirs,
  checkScaffoldServer,
  testTemplateMatching,
  testScaffoldGeneration,
  runPerformanceTest,
  generateTestReport
};