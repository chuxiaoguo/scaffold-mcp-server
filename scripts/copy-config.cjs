#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 复制配置文件到 dist 目录
 */
function copyConfigFiles() {
    const sourceDir = path.join(__dirname, '..', 'src', 'config');
    const targetDir = path.join(__dirname, '..', 'dist', 'config');
    
    console.log('开始复制配置文件...');
    console.log('源目录:', sourceDir);
    console.log('目标目录:', targetDir);
    
    if (!fs.existsSync(sourceDir)) {
        console.error('❌ 源配置目录不存在:', sourceDir);
        process.exit(1);
    }
    
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 复制所有 JSON 配置文件
    const files = fs.readdirSync(sourceDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    console.log('📋 找到配置文件:', jsonFiles);
    
    for (const file of jsonFiles) {
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(targetDir, file);
        
        console.log('📄 复制配置文件:', file);
        fs.copyFileSync(srcPath, destPath);
    }
    
    console.log('✅ 配置文件复制完成!');
}

// 如果直接运行此脚本
if (require.main === module) {
    copyConfigFiles();
}

module.exports = { copyConfigFiles };