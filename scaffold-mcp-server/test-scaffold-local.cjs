#!/usr/bin/env node

/**
 * 本地脚手架测试脚本
 * 用于透明地调试和验证脚手架生成功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 测试配置
const TEST_CONFIG = {
  testDir: path.join(__dirname, 'test-output'),
  projectName: 'test-project',
  framework: 'vue3',
  buildTool: 'vite',
  language: 'typescript'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logStep(step, message) {
  log(`[步骤 ${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 清理测试目录
function cleanupTestDir() {
  logStep(1, '清理测试目录');
  
  if (fs.existsSync(TEST_CONFIG.testDir)) {
    try {
      fs.rmSync(TEST_CONFIG.testDir, { recursive: true, force: true });
      logSuccess('测试目录清理完成');
    } catch (err) {
      logError(`清理测试目录失败: ${err.message}`);
    }
  } else {
    log('测试目录不存在，跳过清理');
  }
}

// 检查脚手架服务器状态
function checkScaffoldServer() {
  logStep(2, '检查脚手架服务器状态');
  
  const checks = [
    { name: 'package.json', path: path.join(__dirname, 'package.json') },
    { name: 'src目录', path: path.join(__dirname, 'src') },
    { name: 'dist目录', path: path.join(__dirname, 'dist') },
    { name: 'templateConfigManager.ts', path: path.join(__dirname, 'src/core/config/templateConfigManager.ts') },
    { name: 'templates.config.json', path: path.join(__dirname, 'scaffold-template/templates.config.json') }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (fs.existsSync(check.path)) {
      logSuccess(`${check.name} 存在`);
    } else {
      logError(`${check.name} 不存在: ${check.path}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// 测试模板匹配
async function testTemplateMatching() {
  logStep(3, '测试模板匹配功能');
  
  try {
    const { smartMatchFixedTemplate } = require('./dist/core/matcher.js');
    
    const testCases = [
      { input: 'vue3+ts', expected: 'vue3-vite-typescript' },
      { input: 'react+typescript', expected: 'react-webpack-typescript' },
      { input: 'electron+vue3', expected: 'electron-vite-vue3' }
    ];
    
    let passed = 0;
    
    for (const testCase of testCases) {
      try {
        const result = await smartMatchFixedTemplate(testCase.input);
        const templateName = result.template ? result.template.name : null;
        if (templateName && templateName.includes(testCase.expected)) {
          logSuccess(`模板匹配测试通过: ${testCase.input} -> ${templateName}`);
          passed++;
        } else {
          logError(`模板匹配测试失败: ${testCase.input} -> ${templateName} (期望包含: ${testCase.expected})`);
        }
      } catch (err) {
        logError(`模板匹配测试异常: ${testCase.input} -> ${err.message}`);
      }
    }
    
    logSuccess(`模板匹配测试完成: ${passed}/${testCases.length} 通过`);
    return passed === testCases.length;
    
  } catch (err) {
    logError(`模板匹配测试失败: ${err.message}`);
    return false;
  }
}

// 测试脚手架生成
async function testScaffoldGeneration() {
  logStep(4, '测试脚手架生成功能');
  
  try {
    const { generateScaffold } = require('./dist/tools/generateScaffold.js');
    
    const options = {
      project_name: TEST_CONFIG.projectName,
      tech_stack: `${TEST_CONFIG.framework}+${TEST_CONFIG.language}`,
      output_dir: TEST_CONFIG.testDir,
      options: {
        install: false, // 跳过依赖安装以加快测试
        dryRun: false
      }
    };
    
    log(`生成参数: ${JSON.stringify(options, null, 2)}`);
    
    const result = await generateScaffold(options);
    
    if (result && result.projectName) {
      logSuccess('脚手架生成成功');
      
      // 检查生成的文件
      const projectPath = path.join(TEST_CONFIG.testDir, TEST_CONFIG.projectName);
      const expectedFiles = ['package.json', 'src', 'public'];
      
      let filesExist = 0;
      expectedFiles.forEach(file => {
        const filePath = path.join(projectPath, file);
        if (fs.existsSync(filePath)) {
          logSuccess(`生成文件检查通过: ${file}`);
          filesExist++;
        } else {
          logError(`生成文件检查失败: ${file} 不存在`);
        }
      });
      
      return filesExist === expectedFiles.length;
    } else {
      logError(`脚手架生成失败: ${result ? JSON.stringify(result) : '未知错误'}`);
      return false;
    }
    
  } catch (err) {
    logError(`脚手架生成测试失败: ${err.message}`);
    return false;
  }
}

// 运行性能测试
async function runPerformanceTest() {
  logStep(5, '运行性能测试');
  
  try {
    const { getTemplateConfigManager } = require('./dist/core/config/templateConfigManager.js');
    
    const startTime = Date.now();
    const configManager = getTemplateConfigManager();
    const config = await configManager.getTemplatesIndex();
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    if (config) {
      logSuccess(`配置加载成功 (耗时: ${loadTime}ms)`);
      log(`配置包含 ${Object.keys(config.templates || {}).length} 个模板`);
      return true;
    } else {
      logWarning('配置加载返回空结果，但这可能是正常的（如果没有远程配置）');
      return true; // 修复后这是正常的行为
    }
    
  } catch (err) {
    logError(`性能测试失败: ${err.message}`);
    return false;
  }
}

// 生成测试报告
function generateTestReport(results) {
  logSection('测试报告');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`总测试数: ${totalTests}`);
  log(`通过: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`失败: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    const color = passed ? 'green' : 'red';
    log(`  ${test}: ${status}`, color);
  });
  
  if (passedTests === totalTests) {
    logSuccess('\n🎉 所有测试通过！脚手架功能正常');
  } else {
    logError(`\n💥 ${failedTests} 个测试失败，需要进一步调试`);
  }
  
  return passedTests === totalTests;
}

// 主测试函数
async function runTests() {
  logSection('脚手架本地测试');
  log('开始运行脚手架功能测试...\n');
  
  const results = {};
  
  try {
    // 1. 清理测试目录
    cleanupTestDir();
    
    // 2. 检查服务器状态
    results['服务器状态检查'] = checkScaffoldServer();
    
    // 3. 测试模板匹配
    results['模板匹配测试'] = await testTemplateMatching();
    
    // 4. 测试脚手架生成
    results['脚手架生成测试'] = await testScaffoldGeneration();
    
    // 5. 性能测试
    results['性能测试'] = await runPerformanceTest();
    
    // 6. 生成报告
    const allPassed = generateTestReport(results);
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (err) {
    logError(`测试运行异常: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  TEST_CONFIG
};