import { generateFromFixedTemplate } from './src/tools/templateDownloader.js';

const template = {
  name: 'umijs',
  framework: 'react',
  builder: 'umi',
  language: 'typescript',
  description: 'React + umi + TypeScript 项目模板'
};

const techStack = {
  framework: 'react',
  builder: 'umi',
  language: 'typescript'
};

console.log('=== 测试UmiJS模板下载 ===');
console.log('模板配置:', template);

try {
  const result = await generateFromFixedTemplate(template, 'test-project', techStack);
  console.log('下载结果:');
  console.log('- 文件数量:', Object.keys(result.files).length);
  console.log('- package.json存在:', !!result.packageJson);
  console.log('- 文件列表:', Object.keys(result.files).slice(0, 10));
} catch (error) {
  console.error('下载失败:', error.message);
}