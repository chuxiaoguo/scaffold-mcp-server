import { generateProject } from './src/tools/projectGenerator.js';

async function testGeneration() {
  console.log('=== 测试完整项目生成流程 ===');

  try {
    const result = await generateProject(
      'umijs',
      'test-nima',
      '/tmp/test-scaffold',
      [],
      {
        dryRun: false,
        force: true,
        install: false
      }
    );
    
    console.log('生成结果:');
    console.log('- success:', result.success);
    console.log('- message:', result.message);
    console.log('- projectPath:', result.projectPath);
    console.log('- fileSummary length:', result.fileSummary?.length);
  } catch (error) {
    console.error('生成失败:', error.message);
  }
}

testGeneration();