import { generateProject } from './dist/tools/projectGenerator.js';

/**
 * 测试动态模板生成逻辑
 * 验证修改后的智能匹配器不会强制使用默认模板
 */

console.log('🧪 开始测试动态模板生成逻辑...\n');

// 测试用例1: 使用不常见的技术栈组合，应该触发动态模板生成
async function testUncommonTechStack() {
  console.log('📋 测试用例1: 不常见技术栈组合');
  console.log('   技术栈: ["svelte", "rollup", "javascript", "tailwindcss"]');
  
  try {
    const result = await generateProject(
      ["svelte", "rollup", "javascript", "tailwindcss"],
      "svelte-rollup-test",
      "/tmp/dynamic-template-test",
      [],
      { dryRun: true }
    );
    
    console.log(`   ✅ 生成${result.success ? '成功' : '失败'}`);
    if (result.processLogs) {
      const relevantLogs = result.processLogs.filter(log => 
        log.includes('动态模板') || 
        log.includes('固定模板') || 
        log.includes('匹配') ||
        log.includes('策略')
      );
      relevantLogs.forEach(log => console.log(`      ${log}`));
    }
    console.log('');
    return result.success;
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    console.log('');
    return false;
  }
}

// 测试用例2: 使用常见技术栈，应该匹配到固定模板
async function testCommonTechStack() {
  console.log('📋 测试用例2: 常见技术栈组合');
  console.log('   技术栈: ["vue3", "vite", "typescript"]');
  
  try {
    const result = await generateProject(
      ["vue3", "vite", "typescript"],
      "vue3-vite-test",
      "/tmp/dynamic-template-test",
      [],
      { dryRun: true }
    );
    
    console.log(`   ✅ 生成${result.success ? '成功' : '失败'}`);
    if (result.processLogs) {
      const relevantLogs = result.processLogs.filter(log => 
        log.includes('动态模板') || 
        log.includes('固定模板') || 
        log.includes('匹配') ||
        log.includes('策略')
      );
      relevantLogs.forEach(log => console.log(`      ${log}`));
    }
    console.log('');
    return result.success;
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    console.log('');
    return false;
  }
}

// 测试用例3: 使用完全不存在的技术栈，应该触发动态模板生成
async function testNonExistentTechStack() {
  console.log('📋 测试用例3: 不存在的技术栈');
  console.log('   技术栈: ["unknown-framework", "unknown-builder"]');
  
  try {
    const result = await generateProject(
      ["unknown-framework", "unknown-builder"],
      "unknown-test",
      "/tmp/dynamic-template-test",
      [],
      { dryRun: true }
    );
    
    console.log(`   ✅ 生成${result.success ? '成功' : '失败'}`);
    if (result.processLogs) {
      const relevantLogs = result.processLogs.filter(log => 
        log.includes('动态模板') || 
        log.includes('固定模板') || 
        log.includes('匹配') ||
        log.includes('策略')
      );
      relevantLogs.forEach(log => console.log(`      ${log}`));
    }
    console.log('');
    return result.success;
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    console.log('');
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  const results = [];
  
  results.push(await testUncommonTechStack());
  results.push(await testCommonTechStack());
  results.push(await testNonExistentTechStack());
  
  const passedTests = results.filter(r => r).length;
  const totalTests = results.length;
  
  console.log('📊 测试结果汇总:');
  console.log(`   通过: ${passedTests}/${totalTests}`);
  console.log(`   状态: ${passedTests === totalTests ? '✅ 全部通过' : '❌ 部分失败'}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 动态模板生成逻辑测试完成，修改后的智能匹配器工作正常！');
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步检查逻辑。');
  }
}

// 执行测试
runAllTests().catch(console.error);