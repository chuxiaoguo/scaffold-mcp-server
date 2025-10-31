#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 递归复制目录
 */
function copyDir(src, dest) {
  // 确保目标目录存在
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDir(srcPath, destPath);
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 复制 configs 目录到 dist
 */
function copyConfigs() {
  const sourceDir = path.join(__dirname, "..", "configs");
  const targetDir = path.join(__dirname, "..", "dist", "configs");

  console.log("开始复制 configs 目录...");
  console.log("源目录:", sourceDir);
  console.log("目标目录:", targetDir);

  if (!fs.existsSync(sourceDir)) {
    console.error("❌ 源 configs 目录不存在:", sourceDir);
    process.exit(1);
  }

  // 清理旧的 configs 目录
  if (fs.existsSync(targetDir)) {
    console.log("🗑️  清理旧的 configs 目录...");
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // 复制整个 configs 目录
  copyDir(sourceDir, targetDir);

  console.log("✅ configs 目录复制完成!");

  // 列出复制的文件
  const promptsDir = path.join(targetDir, "prompts");
  const toolsDir = path.join(targetDir, "tools");

  if (fs.existsSync(promptsDir)) {
    const promptFiles = fs.readdirSync(promptsDir);
    console.log("📁 prompts 文件:", promptFiles);
  }

  if (fs.existsSync(toolsDir)) {
    const toolFiles = fs.readdirSync(toolsDir);
    console.log("📁 tools 文件:", toolFiles);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  copyConfigs();
}

module.exports = { copyConfigs };
