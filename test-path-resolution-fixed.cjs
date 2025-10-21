#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// 测试修复后的路径解析逻辑
function testFixedLogic(mockDirname) {
    console.log('\n--- 测试修复后的逻辑 ---');
    console.log('模拟的 __dirname:', mockDirname);
    
    // 检测是否在npx环境
    const isNpxEnvironment = mockDirname.includes('node_modules') || 
                            mockDirname.includes('_npx') || 
                            process.env.npm_execpath?.includes('npx');
    
    console.log('检测到npx环境:', isNpxEnvironment);
    
    let projectRoot = path.resolve(mockDirname, "../../..");
    
    if (isNpxEnvironment) {
        // 在npx环境下，尝试找到scaffold-mcp-server包的根目录
        const packageRootMatch = mockDirname.match(/(.*[\/\\]scaffold-mcp-server)[\/\\]/);
        if (packageRootMatch && packageRootMatch[1]) {
            projectRoot = packageRootMatch[1];
            console.log('npx环境下找到的包根目录:', projectRoot);
        }
    }
    
    console.log('最终项目根目录:', projectRoot);
    
    // 测试模板路径
    const templateDir = path.join(projectRoot, 'scaffold-template');
    console.log('模板目录路径:', templateDir);
    console.log('模板目录是否存在:', fs.existsSync(templateDir));
    
    if (fs.existsSync(templateDir)) {
        const templates = fs.readdirSync(templateDir).filter(item => 
            fs.statSync(path.join(templateDir, item)).isDirectory()
        );
        console.log('可用模板:', templates);
        return { success: true, projectRoot, templateDir, templates };
    } else {
        console.log('❌ 模板目录不存在');
        return { success: false, projectRoot, templateDir };
    }
}

console.log('=== 测试路径解析修复 ===');

// 测试当前环境（本地开发）
console.log('\n=== 测试场景1: 本地开发环境 ===');
const currentResult = testFixedLogic(path.join(__dirname, 'dist', 'tools'));

// 测试npx缓存环境（模拟）
console.log('\n=== 测试场景2: 模拟npx缓存环境 ===');
// 创建一个模拟的npx环境路径，但指向当前项目
const mockNpxPath = path.join(__dirname, 'dist', 'tools').replace(
    'scaffold-mcp-server', 
    'node_modules/scaffold-mcp-server'
);
testFixedLogic(mockNpxPath);

// 验证实际的npm发布包结构
console.log('\n=== 验证npm包结构 ===');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('包名:', packageJson.name);
    console.log('版本:', packageJson.version);
    console.log('files字段:', packageJson.files);
}

// 检查dist目录是否包含模板
console.log('\n=== 检查构建输出 ===');
const distPath = path.join(__dirname, 'dist');
console.log('dist目录内容:', fs.readdirSync(distPath));

// 检查是否需要将模板复制到dist目录
const templateSrcPath = path.join(__dirname, 'scaffold-template');
const templateDistPath = path.join(__dirname, 'dist', 'scaffold-template');

console.log('源模板目录存在:', fs.existsSync(templateSrcPath));
console.log('dist中模板目录存在:', fs.existsSync(templateDistPath));

if (fs.existsSync(templateSrcPath) && !fs.existsSync(templateDistPath)) {
    console.log('\n⚠️  发现问题: 模板目录没有被复制到dist目录');
    console.log('这可能是导致npx环境下找不到模板的原因');
}

console.log('\n=== 总结 ===');
if (currentResult.success) {
    console.log('✅ 路径解析逻辑修复成功');
    console.log('✅ 在本地环境下能找到模板');
} else {
    console.log('❌ 路径解析仍有问题');
}