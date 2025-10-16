#!/usr/bin/env node

/**
 * MCP 客户端模拟测试
 * 模拟用户在 MCP 客户端中的实际使用场景
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟 MCP 服务器
class MockMCPServer {
  constructor() {
    this.tools = new Map();
    this.registerTools();
  }

  async registerTools() {
    // 动态导入 MCP 服务器的工具
    try {
      const { generateScaffold } = await import('./dist/tools/generateScaffold.js');
      
      this.tools.set('mcp_scaffold__generator_generateScaffold', {
        name: 'mcp_scaffold__generator_generateScaffold',
        description: '生成前端项目脚手架，支持 Vue3、React 等技术栈',
        inputSchema: {
          type: 'object',
          properties: {
            tech_stack: {
              description: '技术栈，可以是字符串（如 "vue3+ts"）或数组（如 ["vue3", "typescript", "vite"]）',
              type: ['string', 'array']
            },
            project_name: {
              description: '项目名称，默认为 "my-project"',
              type: 'string',
              default: 'my-project'
            },
            output_dir: {
              description: '输出目录，默认为当前目录',
              type: 'string',
              default: '.'
            },
            extra_tools: {
              description: '额外的工具，如 ["eslint", "prettier", "jest", "husky"]',
              type: 'array',
              items: { type: 'string' },
              default: []
            },
            options: {
              type: 'object',
              properties: {
                dryRun: {
                  description: '是否只预览不实际生成文件',
                  type: 'boolean',
                  default: false
                },
                force: {
                  description: '是否强制覆盖已存在的目录',
                  type: 'boolean',
                  default: false
                },
                install: {
                  description: '是否自动安装依赖',
                  type: 'boolean',
                  default: true
                }
              }
            }
          },
          required: ['tech_stack']
        },
        handler: generateScaffold
      });
      
      console.log('✅ MCP 工具注册成功');
    } catch (error) {
      console.error('❌ MCP 工具注册失败:', error.message);
      throw error;
    }
  }

  async callTool(name, args) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      console.log(`🔧 调用工具: ${name}`);
      console.log(`📋 参数: ${JSON.stringify(args, null, 2)}`);
      
      const result = await tool.handler(args);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 脚手架生成成功！

📁 项目名称: ${result.projectName}
📍 生成路径: ${result.targetPath}
🔧 模板来源: ${result.templateSource || '未知'}

📊 生成统计:
- 总文件数: ${result.files?.length || 0}
- 项目类型: ${result.templateSource?.includes('固定模板') ? '固定模板' : '动态生成'}

🎉 项目已成功创建，可以开始开发了！

💡 快速开始:
  cd ${result.projectName}
  npm install
  npm start`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ 脚手架生成失败: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }
}

// 模拟用户输入解析器
class UserInputParser {
  static parseUserInput(input) {
    // 解析用户的自然语言输入
    const patterns = [
      // "请使用 scaffold-generator服务生成一个umijs项目，名字叫nima，路径/demo"
      {
        pattern: /请使用\s*scaffold-generator\s*服务生成一个\s*(\w+)\s*项目[，,]\s*名字叫\s*(\w+)[，,]\s*路径\s*([^\s]+)/i,
        extract: (match) => ({
          tech_stack: match[1],
          project_name: match[2],
          output_dir: match[3],
          options: {
            install: true,
            force: false,
            dryRun: false
          }
        })
      },
      // "生成一个 React + TypeScript 项目，项目名为 my-app"
      {
        pattern: /生成一个\s*([^项目]+)\s*项目[，,]\s*项目名为\s*(\w+)/i,
        extract: (match) => ({
          tech_stack: match[1].trim(),
          project_name: match[2],
          output_dir: '.',
          options: {
            install: true,
            force: false,
            dryRun: false
          }
        })
      },
      // "创建 Vue3 + Vite 项目 test-project 在 /tmp 目录"
      {
        pattern: /创建\s*([^项目]+)\s*项目\s*(\w+)\s*在\s*([^\s]+)\s*目录/i,
        extract: (match) => ({
          tech_stack: match[1].trim(),
          project_name: match[2],
          output_dir: match[3],
          options: {
            install: true,
            force: false,
            dryRun: false
          }
        })
      }
    ];

    for (const { pattern, extract } of patterns) {
      const match = input.match(pattern);
      if (match) {
        return extract(match);
      }
    }

    // 如果没有匹配到模式，返回默认解析
    return {
      tech_stack: 'vue3+vite+typescript',
      project_name: 'my-project',
      output_dir: '.',
      options: {
        install: true,
        force: false,
        dryRun: false
      }
    };
  }
}

// 测试用例定义
const MCP_CLIENT_TEST_CASES = [
  {
    name: '用户原始案例 - UmiJS项目',
    userInput: '请使用 scaffold-generator服务生成一个umijs项目，名字叫nima，路径/demo',
    expectedParams: {
      tech_stack: 'umijs',
      project_name: 'nima',
      output_dir: '/demo',
      options: {
        install: true,
        force: false,
        dryRun: false
      }
    },
    shouldSucceed: true
  },
  {
    name: 'React + TypeScript 项目',
    userInput: '生成一个 React + TypeScript 项目，项目名为 my-react-app',
    expectedParams: {
      tech_stack: 'React + TypeScript',
      project_name: 'my-react-app',
      output_dir: '.',
      options: {
        install: true,
        force: false,
        dryRun: false
      }
    },
    shouldSucceed: true
  },
  {
    name: 'Vue3 + Vite 项目',
    userInput: '创建 Vue3 + Vite 项目 vue-test 在 /tmp 目录',
    expectedParams: {
      tech_stack: 'Vue3 + Vite',
      project_name: 'vue-test',
      output_dir: '/tmp',
      options: {
        install: true,
        force: false,
        dryRun: false
      }
    },
    shouldSucceed: true
  },
  {
    name: 'Electron + Vue3 项目',
    userInput: '请使用 scaffold-generator服务生成一个electron+vue3项目，名字叫electron-app，路径/Users/test',
    expectedParams: {
      tech_stack: 'electron+vue3',
      project_name: 'electron-app',
      output_dir: '/Users/test',
      options: {
        install: true,
        force: false,
        dryRun: false
      }
    },
    shouldSucceed: true
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

// 运行单个 MCP 客户端测试
async function runMCPClientTest(testCase, server, index) {
  const testNumber = index + 1;
  logStep(testNumber, `MCP 客户端测试: ${testCase.name}`);
  
  try {
    // 模拟用户输入
    logInfo(`用户输入: "${testCase.userInput}"`);
    
    // 解析用户输入
    const parsedParams = UserInputParser.parseUserInput(testCase.userInput);
    logInfo(`解析参数: ${JSON.stringify(parsedParams, null, 2)}`);
    
    // 验证解析结果
    if (testCase.expectedParams) {
      const paramsMatch = JSON.stringify(parsedParams) === JSON.stringify(testCase.expectedParams);
      if (paramsMatch) {
        logSuccess('参数解析正确');
      } else {
        logWarning('参数解析与预期不完全匹配');
        console.log('预期:', testCase.expectedParams);
        console.log('实际:', parsedParams);
      }
    }
    
    // 调用 MCP 工具
    const result = await server.callTool('mcp_scaffold__generator_generateScaffold', parsedParams);
    
    if (result.isError) {
      if (testCase.shouldSucceed) {
        throw new Error(`预期成功但失败了: ${result.content[0].text}`);
      } else {
        logSuccess('预期失败，结果符合预期');
      }
    } else {
      if (!testCase.shouldSucceed) {
        throw new Error('预期失败但成功了');
      } else {
        logSuccess('MCP 工具调用成功');
      }
    }
    
    // 输出结果
    logInfo('MCP 服务响应:');
    console.log(result.content[0].text);
    
    return {
      success: true,
      testCase: testCase.name,
      userInput: testCase.userInput,
      parsedParams,
      result,
      error: null
    };
    
  } catch (error) {
    logError(`MCP 客户端测试失败: ${error.message}`);
    return {
      success: false,
      testCase: testCase.name,
      userInput: testCase.userInput,
      parsedParams: null,
      result: null,
      error: error.message
    };
  }
}

// 主测试函数
async function runMCPClientTests() {
  colorLog('bright', '\n🚀 开始 MCP 客户端模拟测试');
  colorLog('bright', '='.repeat(60));
  
  // 初始化 MCP 服务器
  logStep(0, '初始化 MCP 服务器');
  const server = new MockMCPServer();
  await server.registerTools();
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  // 运行所有测试用例
  for (let i = 0; i < MCP_CLIENT_TEST_CASES.length; i++) {
    const testCase = MCP_CLIENT_TEST_CASES[i];
    const result = await runMCPClientTest(testCase, server, i);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // 测试间隔
    if (i < MCP_CLIENT_TEST_CASES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 输出测试报告
  colorLog('bright', '\n📊 MCP 客户端测试报告');
  colorLog('bright', '='.repeat(60));
  
  logInfo(`总测试数: ${MCP_CLIENT_TEST_CASES.length}`);
  logSuccess(`成功: ${successCount}`);
  logError(`失败: ${failureCount}`);
  
  // 详细结果
  colorLog('bright', '\n📋 详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.testCase}`);
    console.log(`   用户输入: "${result.userInput}"`);
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
  colorLog('bright', '\n🎯 MCP 客户端测试总结');
  colorLog('bright', '='.repeat(60));
  
  if (failureCount === 0) {
    logSuccess('🎉 所有 MCP 客户端测试都通过了！服务可以正确处理用户输入。');
  } else {
    logError(`⚠️  有 ${failureCount} 个 MCP 客户端测试失败，需要修复。`);
  }
  
  return {
    total: MCP_CLIENT_TEST_CASES.length,
    success: successCount,
    failure: failureCount,
    results
  };
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runMCPClientTests()
    .then(summary => {
      process.exit(summary.failure > 0 ? 1 : 0);
    })
    .catch(error => {
      logError(`MCP 客户端测试运行失败: ${error.message}`);
      process.exit(1);
    });
}

export { runMCPClientTests, MCP_CLIENT_TEST_CASES, MockMCPServer, UserInputParser };