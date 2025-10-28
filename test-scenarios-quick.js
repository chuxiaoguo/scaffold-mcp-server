#!/usr/bin/env node

/**
 * 快速场景测试脚本
 * 只测试：生成 → 安装 → 构建（跳过 dev server 测试以节省时间）
 */

import { generateScaffold } from "./dist/tools/generateScaffold.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试场景配置
const scenarios = [
  {
    id: 1,
    name: "Vue3 + Vite + JS + Element Plus",
    tech_stack: "vue3 + vite + javascript + element-plus",
    project_name: "test-s1-vue3-vite-js",
  },
  {
    id: 2,
    name: "Vue3 + Webpack + Element Plus",
    tech_stack: "vue3 + webpack + element-plus",
    project_name: "test-s2-vue3-webpack",
  },
  {
    id: 3,
    name: "Vue3 + Webpack + TS + 全家桶",
    tech_stack:
      "vue3 + webpack + typescript + element-plus + eslint + prettier + pinia + vue-router",
    project_name: "test-s3-vue3-full",
  },
  {
    id: 4,
    name: "React + Vite + TS + Redux + Router",
    tech_stack: "react + vite + typescript + redux + react-router",
    project_name: "test-s4-react-full",
  },
];

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function cleanup() {
  log("\n🧹 清理旧项目...", "yellow");
  scenarios.forEach((s) => {
    const p = path.join(__dirname, s.project_name);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
    }
  });
}

async function testScenario(scenario) {
  log(`\n${"=".repeat(60)}`, "blue");
  log(`场景 ${scenario.id}: ${scenario.name}`, "blue");
  log("=".repeat(60), "blue");

  const projectPath = path.join(__dirname, scenario.project_name);
  const result = { generate: false, install: false, build: false };

  try {
    // 1. 生成
    log("\n1️⃣ 生成项目...", "cyan");
    await generateScaffold({
      tech_stack: scenario.tech_stack,
      project_name: scenario.project_name,
      project_path: __dirname,
    });

    if (fs.existsSync(projectPath)) {
      result.generate = true;
      log("   ✅ 生成成功", "green");
    } else {
      log("   ❌ 生成失败", "red");
      return result;
    }

    // 2. 安装
    log("\n2️⃣ 安装依赖 (可能需要1-2分钟)...", "cyan");
    try {
      execSync("npm install --legacy-peer-deps --no-audit --no-fund", {
        cwd: projectPath,
        stdio: "pipe",
        timeout: 180000,
      });
      result.install = true;
      log("   ✅ 安装成功", "green");
    } catch (err) {
      log("   ❌ 安装失败", "red");
      return result;
    }

    // 3. 构建
    log("\n3️⃣ 构建项目...", "cyan");
    try {
      execSync("npm run build", {
        cwd: projectPath,
        stdio: "pipe",
        timeout: 120000,
      });
      result.build = true;
      log("   ✅ 构建成功", "green");

      // 检查产物
      const distPath = path.join(projectPath, "dist");
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        log(`   📦 构建产物: ${files.length} 个文件`, "dim");
      }
    } catch (err) {
      log("   ❌ 构建失败", "red");
      log(`   错误: ${err.message.split("\n")[0]}`, "red");
    }
  } catch (error) {
    log(`\n❌ 异常: ${error.message}`, "red");
  }

  return result;
}

async function main() {
  const start = Date.now();

  log("\n🚀 开始快速场景测试", "blue");
  log(`场景数量: ${scenarios.length}`, "cyan");
  log(`测试流程: 生成 → 安装 → 构建`, "cyan");

  cleanup();

  const results = [];
  for (const scenario of scenarios) {
    const result = await testScenario(scenario);
    results.push(result);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 报告
  log(`\n${"=".repeat(60)}`, "blue");
  log("📊 测试报告", "blue");
  log("=".repeat(60), "blue");

  let pass = 0;
  results.forEach((r, i) => {
    const s = scenarios[i];
    const ok = r.generate && r.install && r.build;
    if (ok) pass++;

    const status = ok ? "✅" : "❌";
    log(`\n${status} 场景 ${s.id}: ${s.name}`, ok ? "green" : "red");
    log(
      `   生成: ${r.generate ? "✅" : "❌"}  安装: ${r.install ? "✅" : "❌"}  构建: ${r.build ? "✅" : "❌"}`,
      "dim"
    );
  });

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  const rate = ((pass / scenarios.length) * 100).toFixed(1);

  log(`\n${"─".repeat(60)}`, "dim");
  log(
    `总计: ${pass}/${scenarios.length} 通过 (${rate}%)`,
    pass === scenarios.length ? "green" : "yellow"
  );
  log(`耗时: ${duration} 秒`, "cyan");
  log("─".repeat(60), "dim");

  if (pass === scenarios.length) {
    log("\n🎉 所有场景测试通过！\n", "green");
    process.exit(0);
  } else {
    log("\n⚠️  部分场景失败\n", "yellow");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  log("\n\n⚠️  测试中断\n", "yellow");
  process.exit(130);
});

main().catch((err) => {
  log(`\n💥 脚本异常: ${err.message}\n`, "red");
  process.exit(1);
});
