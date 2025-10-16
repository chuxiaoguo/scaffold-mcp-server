#!/usr/bin/env node

import { ScaffoldMCPServer } from './src/index.js';

async function testLogsOutput() {
  console.log('=== 测试日志输出功能 ===');
  
  const server = new ScaffoldMCPServer();
  
  // 测试成功场景
  console.log('\n1. 测试成功场景（UmiJS）:');
  try {
    const successResult = await server.handleGenerateScaffold({
      tech_stack: 'umijs',
      project_name: 'test-logs-success',
      output_dir: './test-output',
      options: { install: false }
    });
    
    console.log('成功结果类型:', successResult.content[0].type);
    console.log('成功结果长度:', successResult.content[0].text.length);
    console.log('包含过程日志:', successResult.content[0].text.includes('🔍 过程日志:'));
    console.log('包含生成完成:', successResult.content[0].text.includes('✅ 脚手架项目生成完成'));
    
    // 显示部分内容
    const lines = successResult.content[0].text.split('\n');
    const logSection = lines.find(line => line.includes('🔍 过程日志:'));
    if (logSection) {
      const logIndex = lines.indexOf(logSection);
      console.log('\n过程日志部分:');
      for (let i = logIndex; i < Math.min(logIndex + 10, lines.length); i++) {
        console.log(lines[i]);
      }
    }
    
  } catch (error) {
    console.error('成功场景测试失败:', error.message);
  }
  
  // 测试失败场景
  console.log('\n2. 测试失败场景（不存在的技术栈）:');
  try {
    const failResult = await server.handleGenerateScaffold({
      tech_stack: 'nonexistent-stack',
      project_name: 'test-logs-fail',
      output_dir: './test-output',
      options: { install: false }
    });
    
    console.log('失败结果类型:', failResult.content[0].type);
    console.log('失败结果长度:', failResult.content[0].text.length);
    console.log('包含过程日志:', failResult.content[0].text.includes('🔍 过程日志:'));
    console.log('包含失败信息:', failResult.content[0].text.includes('❌ 脚手架生成失败'));
    console.log('错误标记:', failResult.isError);
    
    // 显示部分内容
    const lines = failResult.content[0].text.split('\n');
    const logSection = lines.find(line => line.includes('🔍 过程日志:'));
    if (logSection) {
      const logIndex = lines.indexOf(logSection);
      console.log('\n过程日志部分:');
      for (let i = logIndex; i < Math.min(logIndex + 10, lines.length); i++) {
        console.log(lines[i]);
      }
    }
    
  } catch (error) {
    console.error('失败场景测试失败:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

testLogsOutput().catch(console.error);