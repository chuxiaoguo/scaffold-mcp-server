#!/usr/bin/env node

/**
 * 完整场景测试脚本
 * 测试多个技术栈组合的 install、dev、build 流程
 */

import { generateScaffold } from "./dist/tools/generateScaffold.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 测试场景列表
const scenarios = [
  {
    name: "Vue3 + Vite + JS + Element Plus",
    tech_stack: "vue3 + vite + javascript + element-plus",
    project_name: "test-vue3-vite-js",
  },
  {
    name: "Vue3 + Webpack + Element Plus",
    tech_stack: "vue3 + webpack + element-plus",
    project_name: "test-vue3-webpack",
  },
  {
    name: "Vue3 + Webpack + TypeScript + 全家桶",
    tech_stack:
      "vue3 + webpack + typescript + element-plus + eslint + prettier + pinia + vue-router",
    project_name: "test-vue3-full",
  },
  {
    name: "React + Vite + TypeScript + Redux + Router",
    tech_stack: "react + vite + typescript + redux + react-router",
    project_name: "test-react-vite",
  },
];

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 清理旧的测试项目
function cleanupProjects() {
  log("\n🧹 清理旧的测试项目...", "yellow");
  scenarios.forEach((scenario) => {
    const projectPath = path.join(process.cwd(), scenario.project_name);
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
      log(`  已删除: ${scenario.project_name}`, "yellow");
    }
  });
}

// 执行命令并捕获输出
function runCommand(command, cwd, description) {
  try {
    log(`  执行: ${description}`, "cyan");
    execSync(command, {
      cwd,
      stdio: "pipe",
      encoding: "utf-8",
      timeout: 300000, // 5分钟超时
    });
    log(`  ✓ ${description} 成功`, "green");
    return true;
  } catch (error) {
    log(`  ✗ ${description} 失败`, "red");
    log(`  错误: ${error.message}`, "red");
    return false;
  }
}

// 测试单个场景
async function testScenario(scenario) {
  log(`\n${"=".repeat(80)}`, "blue");
  log(`📦 测试场景: ${scenario.name}`, "blue");
  log(`${"=".repeat(80)}`, "blue");

  const projectPath = path.join(process.cwd(), scenario.project_name);
  const results = {
    generate: false,
    install: false,
    build: false,
  };

  try {
    // 1. 生成项目
    log("\n1️⃣ 生成项目...", "yellow");
    const params = {
      tech_stack: scenario.tech_stack,
      project_name: scenario.project_name,
      project_path: process.cwd(),
    };

    await generateScaffold(params);

    if (fs.existsSync(projectPath)) {
      results.generate = true;
      log("✓ 项目生成成功", "green");

      // 列出生成的文件
      const files = fs.readdirSync(projectPath);
      log(`  生成的文件: ${files.join(", ")}`, "cyan");
    } else {
      log("✗ 项目生成失败", "red");
      return results;
    }

    // 2. 安装依赖
    log("\n2️⃣ 安装依赖...", "yellow");
    results.install = runCommand(
      "npm install --legacy-peer-deps",
      projectPath,
      "安装依赖"
    );

    if (!results.install) {
      return results;
    }

    // 3. 构建项目
    log("\n3️⃣ 构建项目...", "yellow");
    results.build = runCommand("npm run build", projectPath, "构建项目");

    // 检查构建产物
    if (results.build) {
      const distPath = path.join(projectPath, "dist");
      if (fs.existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        log(`  构建产物: ${distFiles.join(", ")}`, "cyan");
      }
    }
  } catch (error) {
    log(`\n❌ 测试过程出错: ${error.message}`, "red");
    console.error(error);
  }

  return results;
}

// 主测试流程
async function runAllTests() {
  log("\n🚀 开始完整场景测试", "blue");
  log(`测试场景数量: ${scenarios.length}`, "blue");

  // 清理旧项目
  cleanupProjects();

  const allResults = [];

  // 逐个测试场景
  for (const scenario of scenarios) {
    const results = await testScenario(scenario);
    allResults.push({
      scenario: scenario.name,
      ...results,
    });

    // 每个场景之间暂停一下
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 输出总结
  log(`\n${"=".repeat(80)}`, "blue");
  log("📊 测试总结", "blue");
  log(`${"=".repeat(80)}`, "blue");

  let passCount = 0;
  let failCount = 0;

  allResults.forEach((result, index) => {
    const allPassed = result.generate && result.install && result.build;
    const status = allPassed ? "✓ 通过" : "✗ 失败";
    const color = allPassed ? "green" : "red";

    if (allPassed) passCount++;
    else failCount++;

    log(`\n${index + 1}. ${result.scenario}`, color);
    log(
      `   生成: ${result.generate ? "✓" : "✗"}`,
      result.generate ? "green" : "red"
    );
    log(
      `   安装: ${result.install ? "✓" : "✗"}`,
      result.install ? "green" : "red"
    );
    log(`   构建: ${result.build ? "✓" : "✗"}`, result.build ? "green" : "red");
    log(`   ${status}`, color);
  });

  log(
    `\n总计: ${passCount} 通过, ${failCount} 失败`,
    failCount > 0 ? "red" : "green"
  );

  if (failCount === 0) {
    log("\n🎉 所有场景测试通过！", "green");
  } else {
    log("\n⚠️  部分场景测试失败，请检查日志", "red");
  }

  return failCount === 0;
}

// 执行测试
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(`\n💥 测试脚本异常: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  });
