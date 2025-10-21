#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 复制模板文件到dist目录，排除不必要的文件
 */
function copyTemplates() {
    const sourceDir = path.join(__dirname, '..', 'scaffold-template');
    const targetDir = path.join(__dirname, '..', 'dist', 'scaffold-template');
    
    console.log('开始复制模板文件...');
    console.log('源目录:', sourceDir);
    console.log('目标目录:', targetDir);
    
    if (!fs.existsSync(sourceDir)) {
        console.error('❌ 源模板目录不存在:', sourceDir);
        process.exit(1);
    }
    
    // 需要排除的文件和目录
    const excludePatterns = [
        'node_modules',
        '.git',
        '.DS_Store',
        'Thumbs.db',
        '*.log',
        '.npm',
        '.cache',
        'dist',
        'build',
        '.next',
        '.nuxt',
        'coverage',
        '.nyc_output',
        '.vscode/settings.json', // 保留配置但排除个人设置
        '.idea',
        '*.tmp',
        '*.temp'
    ];
    
    /**
     * 检查文件/目录是否应该被排除
     */
    function shouldExclude(filePath, fileName) {
        return excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                // 处理通配符模式
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(fileName);
            } else if (pattern.includes('/')) {
                // 处理路径模式
                return filePath.includes(pattern);
            } else {
                // 处理文件名模式
                return fileName === pattern;
            }
        });
    }
    
    /**
     * 递归复制目录
     */
    function copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(src);
        
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const relativePath = path.relative(sourceDir, srcPath);
            
            // 检查是否应该排除
            if (shouldExclude(relativePath, item)) {
                console.log('⏭️  跳过:', relativePath);
                continue;
            }
            
            const stat = fs.statSync(srcPath);
            
            if (stat.isDirectory()) {
                console.log('📁 复制目录:', relativePath);
                copyDirectory(srcPath, destPath);
            } else {
                console.log('📄 复制文件:', relativePath);
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    
    try {
        // 如果目标目录存在，先删除
        if (fs.existsSync(targetDir)) {
            console.log('🗑️  清理旧的模板目录...');
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        
        // 开始复制
        copyDirectory(sourceDir, targetDir);
        
        // 验证复制结果
        const copiedTemplates = fs.readdirSync(targetDir).filter(item => 
            fs.statSync(path.join(targetDir, item)).isDirectory()
        );
        
        console.log('✅ 模板复制完成!');
        console.log('📦 复制的模板:', copiedTemplates);
        console.log('📍 目标位置:', targetDir);
        
        // 检查每个模板的大小
        copiedTemplates.forEach(template => {
            const templatePath = path.join(targetDir, template);
            const files = getAllFiles(templatePath);
            console.log(`   ${template}: ${files.length} 个文件`);
        });
        
    } catch (error) {
        console.error('❌ 复制模板时出错:', error.message);
        process.exit(1);
    }
}

/**
 * 递归获取目录下所有文件
 */
function getAllFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files = files.concat(getAllFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }
    
    return files;
}

// 如果直接运行此脚本
if (require.main === module) {
    copyTemplates();
}

module.exports = { copyTemplates };