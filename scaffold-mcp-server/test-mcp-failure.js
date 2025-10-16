import { generateScaffold } from './src/tools/generateScaffold.js';

async function testFailureScenario() {
  console.log('=== 测试失败场景的错误处理 ===');

  // 模拟一个会失败的参数（使用不存在的技术栈）
  const params = {
    tech_stack: 'nonexistent-framework',
    project_name: 'test-failure',
    output_dir: '/tmp/failure-test',
    extra_tools: [],
    options: {
      dryRun: false,
      force: true,
      install: false
    }
  };

  try {
    const result = await generateScaffold(params);
    
    console.log('生成结果:');
    console.log('- projectName:', result.projectName);
    console.log('- targetPath:', result.targetPath);
    console.log('- templateSource:', result.templateSource);
    console.log('- files length:', result.files.length);
    console.log('- tree name:', result.tree.name);
    
    // 检查是否为失败状态
    if (result.templateSource === 'failed' || result.templateSource?.startsWith('生成失败')) {
      console.log('✅ 正确识别为失败状态');
    } else {
      console.log('❌ 未正确识别失败状态');
    }
  } catch (error) {
    console.error('异常捕获:', error.message);
  }
}

testFailureScenario();