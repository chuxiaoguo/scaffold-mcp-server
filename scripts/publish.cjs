#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// 颜色输出工具
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, "red");
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function info(message) {
  log(`ℹ️  ${message}`, "blue");
}

function warning(message) {
  log(`⚠️  ${message}`, "yellow");
}

// 执行命令的工具函数
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
    return result;
  } catch (err) {
    error(`命令执行失败: ${command}`);
    error(err.message);
    process.exit(1);
  }
}

// 检查Git状态
function checkGitStatus() {
  info("检查Git状态...");

  // 检查是否有未提交的更改
  const status = runCommand("git status --porcelain", { silent: true });
  if (status.trim()) {
    error("存在未提交的更改，请先提交所有更改");
    console.log(status);
    process.exit(1);
  }

  // 检查当前分支
  const branch = runCommand("git rev-parse --abbrev-ref HEAD", {
    silent: true,
  }).trim();
  if (branch !== "main" && branch !== "master") {
    warning(`当前分支是 ${branch}，建议在 main 或 master 分支发布`);
  }

  success("Git状态检查通过");
}

// 运行测试
function runTests() {
  info("运行测试...");

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  if (packageJson.scripts && packageJson.scripts.test) {
    runCommand("npm test");
    success("测试通过");
  } else {
    warning("未找到测试脚本，跳过测试");
  }
}

// 构建项目
function buildProject() {
  info("构建项目...");

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  if (packageJson.scripts && packageJson.scripts.build) {
    runCommand("npm run build");
    success("项目构建完成");
  } else {
    warning("未找到构建脚本，跳过构建");
  }
}

// 检查包内容
function checkPackageContents() {
  info("检查包内容...");

  const dryRunOutput = runCommand("npm pack --dry-run", { silent: true });
  log("\n📦 包将包含以下文件:", "cyan");
  console.log(dryRunOutput);

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\n是否继续发布? (y/N): ", (answer) => {
      rl.close();
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        resolve(true);
      } else {
        log("发布已取消", "yellow");
        process.exit(0);
      }
    });
  });
}

// 更新版本
function updateVersion(versionType) {
  info(`更新版本 (${versionType})...`);

  const result = runCommand(`npm version ${versionType} --no-git-tag-version`, {
    silent: true,
  });
  const newVersion = result.trim().replace("v", "");

  success(`版本已更新到 ${newVersion}`);
  return newVersion;
}

// 生成changelog
function generateChangelog(version) {
  info("生成changelog...");

  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const date = new Date().toISOString().split("T")[0];

  let changelog = "";
  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, "utf8");
  } else {
    changelog = "# Changelog\n\n";
  }

  // 获取最近的提交信息
  const commits = runCommand("git log --oneline -10", { silent: true });
  const commitLines = commits.split("\n").filter((line) => line.trim());

  const newEntry = `## [${version}] - ${date}\n\n### Changes\n${commitLines.map((line) => `- ${line}`).join("\n")}\n\n`;

  // 在第一个 ## 之前插入新版本
  const lines = changelog.split("\n");
  const insertIndex = lines.findIndex((line) => line.startsWith("## "));

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, ...newEntry.split("\n"));
  } else {
    lines.push(...newEntry.split("\n"));
  }

  fs.writeFileSync(changelogPath, lines.join("\n"));
  success("Changelog已更新");
}

// 提交更改
function commitChanges(version) {
  info("提交版本更改...");

  runCommand("git add .");
  runCommand(`git commit -m "chore: release v${version}"`);
  runCommand(`git tag v${version}`);

  success(`已创建版本标签 v${version}`);
}

// 发布到npm
function publishToNpm(tag = "latest") {
  info(`发布到npm (tag: ${tag})...`);

  // 检查npm登录状态
  try {
    runCommand("npm whoami", { silent: true });
  } catch {
    error("请先登录npm: npm login");
    process.exit(1);
  }

  // 发布
  runCommand(`npm publish --tag ${tag}`);
  success("包已成功发布到npm");
}

// 推送到Git仓库
function pushToGit() {
  info("推送到Git仓库...");

  runCommand("git push");
  runCommand("git push --tags");

  success("已推送到Git仓库");
}

// 主函数
async function main() {
  log("\n🚀 开始自动发布流程\n", "bright");

  // 解析命令行参数
  const args = process.argv.slice(2);
  const versionType = args[0] || "patch"; // patch, minor, major
  const tag = args[1] || "latest";

  if (!["patch", "minor", "major"].includes(versionType)) {
    error("版本类型必须是: patch, minor, major");
    process.exit(1);
  }

  try {
    // 1. 检查Git状态
    checkGitStatus();

    // 2. 运行测试
    runTests();

    // 3. 构建项目
    buildProject();

    // 4. 检查包内容
    await checkPackageContents();

    // 5. 更新版本
    const newVersion = updateVersion(versionType);

    // 6. 生成changelog
    generateChangelog(newVersion);

    // 7. 提交更改
    commitChanges(newVersion);

    // 8. 发布到npm
    publishToNpm(tag);

    // 9. 推送到Git仓库
    pushToGit();

    success(`\n🎉 发布完成! 版本 ${newVersion} 已成功发布`);
    info(
      `📦 npm包: https://www.npmjs.com/package/${JSON.parse(fs.readFileSync("package.json", "utf8")).name}`
    );
  } catch (err) {
    error(`发布失败: ${err.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkGitStatus,
  runTests,
  buildProject,
  updateVersion,
  publishToNpm,
};