import { ScaffoldMCPServer } from './src/index.js';

async function testMCPServer() {
  console.log('=== 测试修复后的MCP服务器 ===');

  const server = new ScaffoldMCPServer();
  
  // 模拟MCP调用
  const params = {
    tech_stack: 'umijs',
    project_name: 'test-mcp-project',
    output_dir: '/tmp/mcp-test',
    extra_tools: [],
    options: {
      dryRun: false,
      force: true,
      install: false
    }
  };

  try {
    // 直接调用handleGenerateScaffold方法（通过反射访问私有方法）
    const result = await server['handleGenerateScaffold'](params);
    
    console.log('MCP服务器响应:');
    console.log('- 内容类型:', result.content[0].type);
    console.log('- 是否错误:', result.isError || false);
    console.log('- 响应文本:');
    console.log(result.content[0].text);
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testMCPServer();