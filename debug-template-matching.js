#!/usr/bin/env node

/**
 * 调试脚手架模板匹配问题的测试脚本
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 调试脚手架模板匹配问题');
console.log('=====================================');

// 1. 检查当前工作目录和脚本位置
console.log('\n📍 路径信息:');
console.log(`   - 当前工作目录: ${process.cwd()}`);
console.log(`   - 脚本文件路径: ${__filename}`);
console.log(`   - 脚本目录: ${__dirname}`);

// 2. 检查模板配置文件
console.log('\n📋 检查模板配置:');
const configPath = path.join(__dirname, 'scaffold-template', 'templates.config.json');
console.log(`   - 配置文件路径: ${configPath}`);

try {
  const configContent = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  console.log(`   - 配置版本: ${config.version}`);
  console.log(`   - 可用模板:`);
  Object.keys(config.templates).forEach(name => {
    console.log(`     * ${name}: ${config.templates[name].description}`);
  });
} catch (error) {
  console.error(`   ❌ 读取配置文件失败: ${error.message}`);
}

// 3. 检查本地模板目录
console.log('\n📁 检查本地模板目录:');
const templateDir = path.join(__dirname, 'scaffold-template');
console.log(`   - 模板目录路径: ${templateDir}`);

try {
  const templates = await fs.readdir(templateDir);
  console.log(`   - 发现的模板目录:`);
  for (const template of templates) {
    if (template === 'templates.config.json') continue;
    
    const templatePath = path.join(templateDir, template);
    try {
      const stat = await fs.stat(templatePath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(templatePath);
        console.log(`     * ${template} (${files.length} 个文件)`);
        
        // 检查是否有 package.json
        if (files.includes('package.json')) {
          const pkgPath = path.join(templatePath, 'package.json');
          const pkgContent = await fs.readFile(pkgPath, 'utf-8');
          const pkg = JSON.parse(pkgContent);
          console.log(`       - package.json: ${pkg.name} v${pkg.version}`);
        }
      }
    } catch (err) {
      console.log(`     * ${template} (无法访问: ${err.message})`);
    }
  }
} catch (error) {
  console.error(`   ❌ 读取模板目录失败: ${error.message}`);
}

// 4. 模拟技术栈匹配
console.log('\n🧠 模拟技术栈匹配:');
const testTechStack = ['react', 'typescript', 'webpack', 'tailwind', 'antd', 'jest', 'msw'];
console.log(`   - 测试技术栈: ${testTechStack.join(', ')}`);

// 简化的匹配逻辑
const expectedTemplate = 'react-webpack-typescript';
console.log(`   - 期望匹配模板: ${expectedTemplate}`);

// 检查期望模板是否存在
const expectedTemplatePath = path.join(templateDir, expectedTemplate);
try {
  await fs.access(expectedTemplatePath);
  console.log(`   ✅ 期望模板目录存在: ${expectedTemplatePath}`);
} catch (error) {
  console.error(`   ❌ 期望模板目录不存在: ${expectedTemplatePath}`);
}

// 5. 检查目标目录权限
console.log('\n🔐 检查目标目录权限:');
const testTargetDirs = [
  '/demo',
  '/tmp/demo',
  path.join(process.cwd(), 'demo'),
  path.join(process.env.HOME || '/tmp', 'demo')
];

for (const targetDir of testTargetDirs) {
  try {
    // 尝试创建目录
    await fs.mkdir(targetDir, { recursive: true });
    console.log(`   ✅ 可以创建目录: ${targetDir}`);
    
    // 尝试写入测试文件
    const testFile = path.join(targetDir, 'test.txt');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    console.log(`   ✅ 可以写入文件: ${targetDir}`);
    
    // 清理测试目录
    await fs.rmdir(targetDir).catch(() => {});
  } catch (error) {
    console.error(`   ❌ 无法访问目录 ${targetDir}: ${error.message}`);
  }
}

// 6. 生成修复建议
console.log('\n💡 修复建议:');
console.log('   1. 确保模板匹配逻辑返回正确的模板名称 (react-webpack-typescript)');
console.log('   2. 修复本地模板路径计算，考虑 npm 全局安装的情况');
console.log('   3. 使用用户有权限的目录作为默认输出路径');
console.log('   4. 添加更详细的错误处理和调试信息');

console.log('\n🎯 推荐的测试命令:');
console.log(`   mkdir -p ${path.join(process.env.HOME || '/tmp', 'test-scaffold')}`);
console.log(`   cd ${path.join(process.env.HOME || '/tmp', 'test-scaffold')}`);
console.log('   # 然后在该目录下测试脚手架生成');