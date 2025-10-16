#!/usr/bin/env node

/**
 * 统一测试运行器
 * 整合所有测试：综合测试 + MCP 客户端模拟测试
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { runAllTests } from './test-comprehensive.js';
import { runMCPClientTests } from './test-mcp-client-simulation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  colorLog('green', `✅ ${message}`);
}

function logError(message) {
  colorLog('red', `❌ ${message}`);
}

function logWarning(message) {
  colorLog('yellow', `⚠️  ${message}`);
}

function logInfo(message) {
  colorLog('blue', `ℹ️  ${message}`);
}

function logStep(step, message) {
  colorLog('cyan', `\n🔄 阶段 ${step}: ${message}`);
}

// 检查构建状态
async function checkBuildStatus() {
  const fs = await import('fs/promises');
  
  try {
    const distPath = path.join(__dirname, 'dist');
    await fs.access(distPath);
    
    const indexPath = path.join(distPath, 'index.js');
    await fs.access(indexPath);
    
    const toolsPath = path.join(distPath, 'tools', 'generateScaffold.js');
    await fs.access(toolsPath);
    
    logSuccess('构建文件检查通过');
    return true;
  } catch (error) {
    logError('构建文件不存在，请先运行 npm run build');
    return false;
  }
}

// 主测试函数
async function runAllTestSuites() {
  colorLog('bright', '\n🚀 MCP 脚手架生成服务 - 完整测试套件');
  colorLog('bright', '='.repeat(80));
  
  const startTime = Date.now();
  
  // 检查构建状态
  logStep(0, '检查构建状态');
  const buildOk = await checkBuildStatus();
  if (!buildOk) {
    process.exit(1);
  }
  
  const testResults = {
    comprehensive: null,
    mcpClient: null,
    totalTests: 0,
    totalSuccess: 0,
    totalFailure: 0
  };
  
  try {
    // 运行综合测试
    logStep(1, '运行综合功能测试');
    colorLog('magenta', '测试所有固定模板和动态模板生成功能');
    
    testResults.comprehensive = await runAllTests();
    testResults.totalTests += testResults.comprehensive.total;
    testResults.totalSuccess += testResults.comprehensive.success;
    testResults.totalFailure += testResults.comprehensive.failure;
    
    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 运行 MCP 客户端模拟测试
    logStep(2, '运行 MCP 客户端模拟测试');
    colorLog('magenta', '模拟用户在 MCP 客户端中的实际使用场景');
    
    testResults.mcpClient = await runMCPClientTests();
    testResults.totalTests += testResults.mcpClient.total;
    testResults.totalSuccess += testResults.mcpClient.success;
    testResults.totalFailure += testResults.mcpClient.failure;
    
  } catch (error) {
    logError(`测试套件运行失败: ${error.message}`);
    process.exit(1);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 生成最终报告
  colorLog('bright', '\n📊 最终测试报告');
  colorLog('bright', '='.repeat(80));
  
  logInfo(`测试总耗时: ${Math.round(duration / 1000)}秒`);
  logInfo(`总测试数: ${testResults.totalTests}`);
  logSuccess(`总成功数: ${testResults.totalSuccess}`);
  logError(`总失败数: ${testResults.totalFailure}`);
  
  // 分类报告
  colorLog('bright', '\n📋 分类测试结果:');
  
  console.log(`\n1️⃣  综合功能测试:`);
  console.log(`   - 总数: ${testResults.comprehensive.total}`);
  console.log(`   - 成功: ${testResults.comprehensive.success}`);
  console.log(`   - 失败: ${testResults.comprehensive.failure}`);
  console.log(`   - 成功率: ${Math.round((testResults.comprehensive.success / testResults.comprehensive.total) * 100)}%`);
  
  console.log(`\n2️⃣  MCP 客户端模拟测试:`);
  console.log(`   - 总数: ${testResults.mcpClient.total}`);
  console.log(`   - 成功: ${testResults.mcpClient.success}`);
  console.log(`   - 失败: ${testResults.mcpClient.failure}`);
  console.log(`   - 成功率: ${Math.round((testResults.mcpClient.success / testResults.mcpClient.total) * 100)}%`);
  
  // 整体成功率
  const overallSuccessRate = Math.round((testResults.totalSuccess / testResults.totalTests) * 100);
  console.log(`\n🎯 整体成功率: ${overallSuccessRate}%`);
  
  // 关键问题分析
  colorLog('bright', '\n🔍 关键问题分析:');
  
  const comprehensiveFailures = testResults.comprehensive.results.filter(r => !r.success);
  const mcpClientFailures = testResults.mcpClient.results.filter(r => !r.success);
  
  if (comprehensiveFailures.length > 0) {
    logError('综合功能测试失败项:');
    comprehensiveFailures.forEach(failure => {
      console.log(`   - ${failure.testCase}: ${failure.error}`);
    });
  }
  
  if (mcpClientFailures.length > 0) {
    logError('MCP 客户端测试失败项:');
    mcpClientFailures.forEach(failure => {
      console.log(`   - ${failure.testCase}: ${failure.error}`);
    });
  }
  
  // 用户原始案例特别检查
  const originalUserCase = testResults.comprehensive.results.find(r => 
    r.testCase.includes('用户原始案例') || r.testCase.includes('nima')
  );
  
  const mcpOriginalCase = testResults.mcpClient.results.find(r => 
    r.testCase.includes('用户原始案例') || r.userInput?.includes('nima')
  );
  
  colorLog('bright', '\n🎯 用户原始案例检查:');
  if (originalUserCase) {
    const status = originalUserCase.success ? '✅' : '❌';
    console.log(`${status} 综合测试中的用户案例: ${originalUserCase.success ? '通过' : '失败'}`);
    if (!originalUserCase.success) {
      console.log(`   错误: ${originalUserCase.error}`);
    }
  }
  
  if (mcpOriginalCase) {
    const status = mcpOriginalCase.success ? '✅' : '❌';
    console.log(`${status} MCP 客户端中的用户案例: ${mcpOriginalCase.success ? '通过' : '失败'}`);
    if (!mcpOriginalCase.success) {
      console.log(`   错误: ${mcpOriginalCase.error}`);
    }
  }
  
  // 最终结论
  colorLog('bright', '\n🏁 最终结论');
  colorLog('bright', '='.repeat(80));
  
  if (testResults.totalFailure === 0) {
    logSuccess('🎉 所有测试都通过了！MCP 脚手架生成服务完全正常工作。');
    logSuccess('✨ 用户可以正常使用所有功能，包括固定模板和动态生成。');
  } else if (overallSuccessRate >= 80) {
    logWarning(`⚠️  大部分测试通过（${overallSuccessRate}%），但仍有 ${testResults.totalFailure} 个问题需要修复。`);
    logWarning('🔧 建议优先修复失败的测试用例。');
  } else {
    logError(`❌ 测试成功率较低（${overallSuccessRate}%），存在严重问题。`);
    logError('🚨 需要立即修复核心功能问题。');
  }
  
  // 建议
  colorLog('bright', '\n💡 改进建议:');
  if (comprehensiveFailures.length > 0) {
    console.log('1. 检查模板文件完整性和路径配置');
    console.log('2. 验证技术栈解析逻辑');
    console.log('3. 确保所有构建器都正确实现');
  }
  
  if (mcpClientFailures.length > 0) {
    console.log('4. 优化用户输入解析逻辑');
    console.log('5. 改进错误处理和用户反馈');
  }
  
  if (testResults.totalFailure === 0) {
    console.log('🎯 当前系统运行良好，可以考虑添加更多测试用例以提高覆盖率。');
  }
  
  return {
    success: testResults.totalFailure === 0,
    summary: testResults,
    overallSuccessRate
  };
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTestSuites()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logError(`测试套件运行失败: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

export { runAllTestSuites };