import { generateProject } from './dist/tools/projectGenerator.js';
import { parseTechStack, normalizeTechStack } from './dist/tools/techStackParser.js';

async function testVue2Scaffold() {
  console.log('🧪 开始测试 Vue2 + Webpack + Element-UI + Less 组合...\n');
  
  // 先测试解析过程
  console.log('🔍 测试技术栈解析过程:');
  const input = ["vue2", "webpack", "element-ui", "less"];
  console.log('- 输入:', input);
  
  const parsed = parseTechStack(input);
  console.log('- 解析结果:', JSON.stringify(parsed, null, 2));
  
  const normalized = normalizeTechStack(parsed);
  console.log('- 标准化结果:', JSON.stringify(normalized, null, 2));
  
  console.log('\n🚀 开始生成项目...\n');
  
  try {
    const result = await generateProject(
      input,
      "test-vue2-project",
      "/tmp/test-vue2-output",
      [],
      {
        force: true,
        install: false,
        dryRun: true
      }
    );
    
    console.log('\n✅ 测试结果:');
    console.log('- 成功:', result.success);
    console.log('- 消息:', result.message);
    console.log('- 项目路径:', result.projectPath);
    
    if (result.processLogs) {
      console.log('\n📋 处理日志:');
      result.processLogs.forEach(log => console.log('  ', log));
    }
    
    if (result.fileSummary) {
      console.log('\n📁 生成的文件:');
      result.fileSummary.forEach(file => console.log('  ', file));
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testVue2Scaffold();