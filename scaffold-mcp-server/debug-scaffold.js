import { generateScaffold } from './src/tools/generateScaffold.js';

async function testScaffold() {
  console.log('=== 测试generateScaffold函数 ===');

  try {
    const result = await generateScaffold({
      tech_stack: 'umijs',
      project_name: 'nima',
      output_dir: '/tmp/demo',
      extra_tools: [],
      options: {
        dryRun: false,
        force: true,
        install: false
      }
    });
    
    console.log('生成结果:');
    console.log('- projectName:', result.projectName);
    console.log('- targetPath:', result.targetPath);
    console.log('- templateSource:', result.templateSource);
    console.log('- files length:', result.files.length);
    console.log('- tree:', result.tree);
  } catch (error) {
    console.error('生成失败:', error.message);
  }
}

testScaffold();