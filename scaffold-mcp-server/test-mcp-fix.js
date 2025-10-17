import { generateScaffold } from './src/tools/generateScaffold.js';

async function testMCPFix() {
  console.log('=== 测试 MCP 路径修复 ===');
  
  const params = {
    tech_stack: ["umi4", "typescript", "antd"],
    project_name: "nima",
    output_dir: "./demo",
    extra_tools: ["eslint", "prettier", "husky"],
    options: {
      force: false,
      install: true,
      dryRun: false,
      testRunner: "jest"
    }
  };
  
  console.log('参数:', JSON.stringify(params, null, 2));
  
  try {
    const result = await generateScaffold(params);
    console.log('\n=== 生成结果 ===');
    console.log('成功:', result.success);
    console.log('消息:', result.message);
    console.log('文件数量:', result.stats?.totalFiles || 0);
    console.log('目录结构:', result.stats?.directoryStructure || 'empty');
    
    if (result.logs && result.logs.length > 0) {
      console.log('\n=== 过程日志 ===');
      result.logs.forEach(log => console.log(log));
    }
    
  } catch (error) {
    console.error('\n=== 错误信息 ===');
    console.error('错误:', error.message);
    console.error('堆栈:', error.stack);
  }
}

testMCPFix();