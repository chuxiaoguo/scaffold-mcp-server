#!/usr/bin/env node

/**
 * 综合测试脚本 - 覆盖所有模板类型
 * 测试4个固定模板 + 动态模板生成
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { generateScaffold } from './dist/tools/generateScaffold.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试配置
const TEST_CONFIG = {
  baseDir: path.join(__dirname, 'test-output'),
  timeout: 30000, // 30秒超时
};

// 测试用例定义
const TEST_CASES = [
  // 固定模板测试用例
  {
    name: 'React + Webpack + TypeScript (固定模板)',
    type: 'fixed',
    params: {
      tech_stack: 'react+webpack+typescript',
      project_name: 'react-webpack-test',
      output_dir: TEST_CONFIG.baseDir,
      options: {
        install: false,
        dryRun: false,
        force: true
      }
    },
    expectedTemplate: 'react-webpack-typescript',
    expectedFiles: ['package.json', 'src/index.tsx', 'webpack.config.js', 'tsconfig.json']
  },
  {
    name: 'Vue3 + Vite + TypeScript (固定模板)',
    type: 'fixed',
    params: {
      tech_stack: 'vue3+vite+typescript',
      project_name: 'vue3-vite-test',
      output_dir: TEST_CONFIG.baseDir,
      options: {
        install: false,
        dryRun: false,
        force: true
      }
    },
    expectedTemplate: 'vue3-vite-typescript',
    expectedFiles: ['package.json', 'src/main.ts', 'vite.config.ts', 'tsconfig.json']
  },
  {
    name: 'Electron + Vite + Vue3 (固定模板)',
    type: 'fixed',
    params: {
      tech_stack: 'electron+vue3+vite+typescript',
      project_name: 'electron-vue3-test',
      output_dir: TEST_CONFIG.baseDir,
      options: {
        install: false,
        dryRun: false,
        force: true
      }
    },
    expectedTemplate: 'electron-vite-vue3',
    expectedFiles: ['package.json', 'src/main.ts', 'electron/main.ts', 'vite.config.ts']
  },
  {
    name: 'UmiJS + React + TypeScript (固定模板)',
    type: 'fixed',
    params: {
      tech_stack: 'umijs',
      project_name: 'umijs-test',
      output_dir: TEST_CONFIG.baseDir,
      options: {
        install: false,
        dryRun: false,
        force: true
      }
    },
    expectedTemplate: 'umijs',
    expectedFiles: ['package.json', 'src/pages/index.tsx', '.umirc.ts', 'tsconfig.json']
  },
  // 动态模板测试用例
  {
    name: 'React + Vite + JavaScript (动态生成)',
    type: 'dynamic',
    params: {
      tech_stack: 'react+vite+javascript',
      project_name: 'react-vite-dynamic',
      output_dir: TEST_CONFIG.baseDir,
      options: {
        install: false,
        dryRun: false,
        force: true
      }
    },
    expectedTemplate: null, // 动态生成
    expectedFiles: ['package.json', 'src/main.jsx', 'vite.config.js', 'index.html']
  },
  {
    name: 'Vue3 + Webpack + JavaScript (动态生成)',
    type: 'dynamic',
    params: {
      tech_stack: 'vue3+webpack+javascript',
      project_name: 'vue3-webpack-dynamic',
      output_dir: TEST_CONFIG.baseDir,
      options: {
        install: false,
        dryRun: false,
        force: true
      }
    },
    expectedTemplate: null, // 动态生成
    expectedFiles: ['package.json', 'src/main.js', 'webpack.config.js', 'index.html']
  },
  // 用户原始案例
  {
    name: '用户原始案例: UmiJS项目 (nima)',
    type: 'fixed',
    params: {
      tech_stack: 'umijs',
      project_name: 'nima',
      output_dir: '/demo',
      options: {
        install: true,
        force: false,
        dryRun: false
      }
    },
    expectedTemplate: 'umijs',
    expectedFiles: ['package.json', 'src/pages/index.tsx', '.umirc.ts']
  }
];

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
  colorLog('cyan', `\n🔄 步骤 ${step}: ${message}`);
}

// 清理测试目录
async function cleanupTestDir() {
  try {
    await fs.rm(TEST_CONFIG.baseDir, { recursive: true, force: true });
    logInfo(`清理测试目录: ${TEST_CONFIG.baseDir}`);
  } catch (error) {
    // 忽略清理错误
  }
}

// 创建测试目录
async function createTestDir() {
  try {
    await fs.mkdir(TEST_CONFIG.baseDir, { recursive: true });
    logInfo(`创建测试目录: ${TEST_CONFIG.baseDir}`);
  } catch (error) {
    logError(`创建测试目录失败: ${error.message}`);
    throw error;
  }
}

// 检查文件是否存在
async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 验证生成的项目
async function validateProject(testCase, result) {
  const projectPath = path.join(testCase.params.output_dir, testCase.params.project_name);
  
  logInfo(`验证项目: ${projectPath}`);
  
  // 检查项目目录是否存在
  const projectExists = await checkFileExists(projectPath);
  if (!projectExists) {
    throw new Error(`项目目录不存在: ${projectPath}`);
  }
  
  // 检查预期文件
  const missingFiles = [];
  for (const expectedFile of testCase.expectedFiles) {
    const filePath = path.join(projectPath, expectedFile);
    const exists = await checkFileExists(filePath);
    if (!exists) {
      missingFiles.push(expectedFile);
    } else {
      logSuccess(`文件存在: ${expectedFile}`);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`缺少预期文件: ${missingFiles.join(', ')}`);
  }
  
  // 验证 package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    if (packageJson.name !== testCase.params.project_name) {
      throw new Error(`package.json 中的项目名称不匹配: 期望 ${testCase.params.project_name}, 实际 ${packageJson.name}`);
    }
    
    logSuccess(`package.json 验证通过`);
  } catch (error) {
    throw new Error(`package.json 验证失败: ${error.message}`);
  }
  
  // 验证模板来源
  if (testCase.expectedTemplate) {
    if (!result.templateSource || !result.templateSource.includes(testCase.expectedTemplate)) {
      logWarning(`模板来源验证: 期望包含 ${testCase.expectedTemplate}, 实际 ${result.templateSource}`);
    } else {
      logSuccess(`模板来源验证通过: ${result.templateSource}`);
    }
  }
  
  return true;
}

// 运行单个测试用例
async function runTestCase(testCase, index) {
  const testNumber = index + 1;
  logStep(testNumber, `${testCase.name}`);
  
  try {
    logInfo(`测试参数: ${JSON.stringify(testCase.params, null, 2)}`);
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('测试超时')), TEST_CONFIG.timeout);
    });
    
    // 执行生成
    const generatePromise = generateScaffold(testCase.params);
    
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    logSuccess(`脚手架生成成功`);
    logInfo(`生成结果: 项目名称=${result.projectName}, 路径=${result.targetPath}`);
    logInfo(`模板来源: ${result.templateSource || '未知'}`);
    
    // 验证结果
    if (!testCase.params.options.dryRun) {
      await validateProject(testCase, result);
      logSuccess(`项目验证通过`);
    }
    
    return {
      success: true,
      testCase: testCase.name,
      result,
      error: null
    };
    
  } catch (error) {
    logError(`测试失败: ${error.message}`);
    return {
      success: false,
      testCase: testCase.name,
      result: null,
      error: error.message
    };
  }
}

// 主测试函数
async function runAllTests() {
  colorLog('bright', '\n🚀 开始综合测试 - MCP 脚手架生成服务');
  colorLog('bright', '='.repeat(60));
  
  // 准备测试环境
  logStep(0, '准备测试环境');
  await cleanupTestDir();
  await createTestDir();
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  // 运行所有测试用例
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const result = await runTestCase(testCase, i);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // 测试间隔
    if (i < TEST_CASES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 输出测试报告
  colorLog('bright', '\n📊 测试报告');
  colorLog('bright', '='.repeat(60));
  
  logInfo(`总测试数: ${TEST_CASES.length}`);
  logSuccess(`成功: ${successCount}`);
  logError(`失败: ${failureCount}`);
  
  // 详细结果
  colorLog('bright', '\n📋 详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.testCase}`);
    if (!result.success) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  // 失败的测试用例
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    colorLog('bright', '\n❌ 失败的测试用例:');
    failedTests.forEach(test => {
      logError(`- ${test.testCase}: ${test.error}`);
    });
  }
  
  // 成功的测试用例
  const successTests = results.filter(r => r.success);
  if (successTests.length > 0) {
    colorLog('bright', '\n✅ 成功的测试用例:');
    successTests.forEach(test => {
      logSuccess(`- ${test.testCase}`);
    });
  }
  
  // 总结
  colorLog('bright', '\n🎯 测试总结');
  colorLog('bright', '='.repeat(60));
  
  if (failureCount === 0) {
    logSuccess('🎉 所有测试用例都通过了！MCP服务工作正常。');
  } else {
    logError(`⚠️  有 ${failureCount} 个测试用例失败，需要修复。`);
  }
  
  // 清理
  logInfo('\n🧹 清理测试环境...');
  // 注意: 保留测试输出以便检查
  
  return {
    total: TEST_CASES.length,
    success: successCount,
    failure: failureCount,
    results
  };
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(summary => {
      process.exit(summary.failure > 0 ? 1 : 0);
    })
    .catch(error => {
      logError(`测试运行失败: ${error.message}`);
      process.exit(1);
    });
}

export { runAllTests, TEST_CASES };