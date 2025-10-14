#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testTemplate(templateName, projectName) {
  console.log(`\n🧪 测试模板: ${templateName}`);
  console.log(`📁 项目名称: ${projectName}`);
  
  const serverPath = join(__dirname, '../scaffold-mcp-server/dist/index.js');
  
  // 创建测试输入
  const testInput = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "generateScaffold",
      arguments: {
        tech_stack: templateName,
        project_name: projectName,
        output_dir: __dirname,
        options: {
          install: false,
          dryRun: false
        }
      }
    }
  });

  return new Promise((resolve, reject) => {
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 服务器启动成功');
        try {
          // 解析输出中的 JSON 响应
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const response = JSON.parse(line);
              if (response.result) {
                console.log('📊 生成结果:', response.result);
                resolve(response.result);
                return;
              }
            } catch (e) {
              // 忽略非 JSON 行
            }
          }
          resolve({ success: true, output });
        } catch (e) {
          reject(new Error(`解析输出失败: ${e.message}`));
        }
      } else {
        reject(new Error(`服务器退出，代码: ${code}, 错误: ${error}`));
      }
    });

    // 发送测试输入
    child.stdin.write(testInput + '\n');
    child.stdin.end();

    // 5秒后超时
    setTimeout(() => {
      child.kill();
      reject(new Error('测试超时'));
    }, 5000);
  });
}

async function checkProjectStructure(projectPath) {
  try {
    const stats = await fs.stat(projectPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(projectPath);
      console.log(`📂 项目文件 (${files.length} 个):`, files.slice(0, 10).join(', '));
      return true;
    }
  } catch (e) {
    console.log('❌ 项目目录不存在');
    return false;
  }
}

async function main() {
  console.log('🚀 开始测试脚手架模板生成功能\n');

  const templates = [
    { name: 'react-webpack-typescript', project: 'test-react-app' },
    { name: 'umijs', project: 'test-umi-app' }
  ];

  for (const template of templates) {
    try {
      await testTemplate(template.name, template.project);
      
      // 检查生成的项目
      const projectPath = join(__dirname, template.project);
      await checkProjectStructure(projectPath);
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
    }
  }

  console.log('\n✨ 测试完成');
}

main().catch(console.error);