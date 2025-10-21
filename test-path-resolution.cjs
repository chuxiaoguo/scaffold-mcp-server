#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// 模拟npx环境
console.log('=== 测试路径解析修复 ===');
console.log('当前 __dirname:', __dirname);
console.log('当前工作目录:', process.cwd());

// 模拟dist/tools目录下的__dirname
const mockDistToolsDir = path.join(__dirname, 'dist', 'tools');
console.log('模拟的 dist/tools __dirname:', mockDistToolsDir);

// 测试原始逻辑
const originalProjectRoot = path.resolve(mockDistToolsDir, "../../..");
console.log('原始逻辑计算的项目根目录:', originalProjectRoot);

// 测试修复后的逻辑
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
    }
    
    return { projectRoot, templateDir, exists: fs.existsSync(templateDir) };
}

// 测试不同的模拟环境
console.log('\n=== 测试场景1: 本地开发环境 ===');
testFixedLogic(__dirname + '/dist/tools');

console.log('\n=== 测试场景2: npx缓存环境 ===');
testFixedLogic('/Users/zcg/.npm/_npx/abc123/node_modules/scaffold-mcp-server/dist/tools');

console.log('\n=== 测试场景3: 全局安装环境 ===');
testFixedLogic('/usr/local/lib/node_modules/scaffold-mcp-server/dist/tools');

console.log('\n=== 验证当前实际环境 ===');
testFixedLogic(path.join(__dirname, 'dist', 'tools'));