import { generateScaffold } from './src/tools/generateScaffold.js';

const params = {
  "tech_stack": "umi4+ts",
  "project_name": "nima-test-fix",
  "output_dir": ".",
  "extra_tools": ["eslint", "prettier", "husky"],
  "options": {
    "force": true,
    "install": true,
    "dryRun": false,
    "testRunner": "jest"
  }
};

console.log('=== 测试MCP路径修复 ===');
console.log('参数:', JSON.stringify(params, null, 2));

try {
  const result = await generateScaffold(params);
  console.log('\n=== 生成结果 ===');
  console.log('成功:', result.success);
  console.log('项目名称:', result.projectName);
  console.log('目标路径:', result.targetPath);
  console.log('文件数量:', result.files?.length || 0);
  console.log('模板来源:', result.templateSource);
  
  if (result.processLogs) {
    console.log('\n=== 过程日志 ===');
    result.processLogs.forEach(log => console.log(log));
  }
} catch (error) {
  console.error('测试失败:', error.message);
  console.error('错误堆栈:', error.stack);
}