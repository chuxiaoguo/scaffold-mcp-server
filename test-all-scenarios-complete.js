#!/usr/bin/env node

/**
 * 完整场景自动化测试脚本
 * 测试 4 个技术栈组合的完整流程：生成 → 安装 → 构建
 */

import { generateScaffold } from "./dist/tools/generateScaffold.js";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试场景配置
const scenarios = [
  {
    id: 1,
    name: "Vue3 + Vite + JavaScript + Element Plus",
    tech_stack: "vue3 + vite + javascript + element-plus",
    project_name: "test-vue3-vite-js-ep",
    expectedFiles: [
      ".npmrc",
      "package.json",
      "vite.config.ts",
      "src/main.js",
      "src/App.vue",
    ],
    devCommand: "npm run dev",
    buildCommand: "npm run build",
    devPort: 5173,
  },
  {
    id: 2,
    name: "Vue3 + Webpack + Element Plus",
    tech_stack: "vue3 + webpack + element-plus",
    project_name: "test-vue3-webpack-ep",
    expectedFiles: [
      ".npmrc",
      "package.json",
      "webpack.config.js",
      "src/main.ts",
      "src/App.vue",
    ],
    devCommand: "npm run dev",
    buildCommand: "npm run build",
    devPort: 8080,
  },
  {
    id: 3,
    name: "Vue3 + Webpack + TypeScript + 全家桶",
    tech_stack:
      "vue3 + webpack + typescript + element-plus + eslint + prettier + pinia + vue-router",
    project_name: "test-vue3-full-stack",
    expectedFiles: [
      ".npmrc",
      "package.json",
      "webpack.config.js",
      "src/main.ts",
      "src/App.vue",
      "src/stores/counter.ts",
      "src/router/index.ts",
      ".eslintrc.cjs",
      ".prettierrc",
    ],
    devCommand: "npm run dev",
    buildCommand: "npm run build",
    devPort: 8080,
  },
  {
    id: 4,
    name: "React + Vite + TypeScript + Redux + Router",
    tech_stack: "react + vite + typescript + redux + react-router",
    project_name: "test-react-vite-full",
    expectedFiles: [
      ".npmrc",
      "package.json",
      "vite.config.ts",
      "src/main.tsx",
      "src/App.tsx",
      "src/store/index.ts",
      "src/routes.tsx",
    ],
    devCommand: "npm run dev",
    buildCommand: "npm run build",
    devPort: 5173,
  },
];

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "blue");
  console.log("=".repeat(80) + "\n");
}

function logStep(step, message) {
  log(`${step} ${message}`, "cyan");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

// 清理旧的测试项目
function cleanupProjects() {
  logStep("🧹", "清理旧的测试项目...");
  let cleanedCount = 0;

  scenarios.forEach((scenario) => {
    const projectPath = path.join(__dirname, scenario.project_name);
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
      log(`  已删除: ${scenario.project_name}`, "dim");
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    logSuccess(`清理完成，删除了 ${cleanedCount} 个旧项目`);
  } else {
    log("  无需清理", "dim");
  }
}

// 执行命令并返回结果
function runCommand(command, cwd, description, options = {}) {
  const { timeout = 300000, silent = false } = options;

  try {
    if (!silent) {
      log(`  执行: ${description}`, "dim");
    }

    const result = execSync(command, {
      cwd,
      stdio: silent ? "pipe" : "inherit",
      encoding: "utf-8",
      timeout,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    if (!silent) {
      logSuccess(`${description} - 完成`);
    }

    return { success: true, output: result };
  } catch (error) {
    if (!silent) {
      logError(`${description} - 失败`);
      if (error.stderr) {
        log(error.stderr.toString(), "red");
      }
    }
    return { success: false, error: error.message };
  }
}

// 检查端口是否被占用
function isPortInUse(port) {
  try {
    execSync(`lsof -i :${port}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

// 启动开发服务器并测试
async function testDevServer(projectPath, scenario) {
  return new Promise((resolve) => {
    logStep("🚀", "启动开发服务器...");

    // 检查端口
    if (isPortInUse(scenario.devPort)) {
      logWarning(`端口 ${scenario.devPort} 已被占用，跳过 dev 测试`);
      resolve({ success: false, skipped: true });
      return;
    }

    // 启动开发服务器
    const devProcess = spawn("npm", ["run", "dev"], {
      cwd: projectPath,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let output = "";
    let isReady = false;

    const timeout = setTimeout(() => {
      if (!isReady) {
        logError("开发服务器启动超时 (30秒)");
        devProcess.kill();
        resolve({ success: false });
      }
    }, 30000);

    devProcess.stdout.on("data", (data) => {
      output += data.toString();

      // 检测服务器是否就绪
      const readyPatterns = [
        /Local:.*http:\/\/localhost:\d+/,
        /ready in \d+ms/i,
        /compiled successfully/i,
        /webpack \d+\.\d+\.\d+ compiled/i,
      ];

      if (readyPatterns.some((pattern) => pattern.test(output))) {
        if (!isReady) {
          isReady = true;
          clearTimeout(timeout);
          logSuccess("开发服务器启动成功");

          // 等待 2 秒后关闭
          setTimeout(() => {
            devProcess.kill();
            resolve({ success: true });
          }, 2000);
        }
      }
    });

    devProcess.stderr.on("data", (data) => {
      output += data.toString();
    });

    devProcess.on("error", (error) => {
      clearTimeout(timeout);
      logError(`进程错误: ${error.message}`);
      resolve({ success: false });
    });
  });
}

// 测试单个场景
async function testScenario(scenario) {
  logSection(`📦 场景 ${scenario.id}: ${scenario.name}`);

  const projectPath = path.join(__dirname, scenario.project_name);
  const results = {
    generate: false,
    filesCheck: false,
    install: false,
    build: false,
    dev: false,
    errors: [],
  };

  try {
    // 步骤 1: 生成项目
    logStep("1️⃣", "生成项目...");
    const params = {
      tech_stack: scenario.tech_stack,
      project_name: scenario.project_name,
      project_path: __dirname,
    };

    await generateScaffold(params);

    if (fs.existsSync(projectPath)) {
      results.generate = true;
      logSuccess("项目生成成功");

      // 检查关键文件
      const missingFiles = scenario.expectedFiles.filter(
        (file) => !fs.existsSync(path.join(projectPath, file))
      );

      if (missingFiles.length === 0) {
        results.filesCheck = true;
        logSuccess(
          `关键文件检查通过 (${scenario.expectedFiles.length} 个文件)`
        );
      } else {
        results.filesCheck = false;
        logError(`缺失文件: ${missingFiles.join(", ")}`);
        results.errors.push(`缺失文件: ${missingFiles.join(", ")}`);
      }
    } else {
      results.generate = false;
      logError("项目生成失败 - 目录不存在");
      return results;
    }

    // 步骤 2: 安装依赖
    logStep("2️⃣", "安装依赖...");
    log("  这可能需要几分钟时间，请耐心等待...", "dim");

    const installResult = runCommand(
      "npm install --legacy-peer-deps",
      projectPath,
      "安装依赖"
    );

    results.install = installResult.success;
    if (!installResult.success) {
      results.errors.push("依赖安装失败");
      return results;
    }

    // 步骤 3: 构建项目
    logStep("3️⃣", "构建项目...");
    const buildResult = runCommand(
      scenario.buildCommand,
      projectPath,
      "构建项目"
    );

    results.build = buildResult.success;
    if (!buildResult.success) {
      results.errors.push("项目构建失败");
    } else {
      // 检查构建产物
      const distPath = path.join(projectPath, "dist");
      if (fs.existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        log(
          `  构建产物: ${distFiles.slice(0, 5).join(", ")}${distFiles.length > 5 ? "..." : ""}`,
          "dim"
        );
      }
    }

    // 步骤 4: 测试开发服务器（可选）
    logStep("4️⃣", "测试开发服务器...");
    const devResult = await testDevServer(projectPath, scenario);
    results.dev = devResult.success;

    if (devResult.skipped) {
      log("  (已跳过)", "yellow");
    } else if (!devResult.success) {
      results.errors.push("开发服务器启动失败");
    }
  } catch (error) {
    logError(`测试异常: ${error.message}`);
    results.errors.push(error.message);
  }

  return results;
}

// 生成测试报告
function generateReport(allResults) {
  logSection("📊 测试总结报告");

  let passCount = 0;
  let totalCount = scenarios.length;

  console.log("");
  allResults.forEach((result, index) => {
    const scenario = scenarios[index];
    const allPassed =
      result.generate && result.filesCheck && result.install && result.build;

    if (allPassed) passCount++;

    const statusIcon = allPassed ? "✅" : "❌";
    const statusColor = allPassed ? "green" : "red";

    log(`${statusIcon} 场景 ${scenario.id}: ${scenario.name}`, statusColor);
    log(
      `   生成: ${result.generate ? "✅" : "❌"}  文件: ${result.filesCheck ? "✅" : "❌"}  安装: ${result.install ? "✅" : "❌"}  构建: ${result.build ? "✅" : "❌"}  开发: ${result.dev ? "✅" : "⚠️ "}`,
      "dim"
    );

    if (result.errors.length > 0) {
      log(`   错误: ${result.errors.join("; ")}`, "red");
    }
    console.log("");
  });

  console.log("─".repeat(80));
  const successRate = ((passCount / totalCount) * 100).toFixed(1);
  log(
    `总计: ${passCount}/${totalCount} 通过 (${successRate}%)`,
    passCount === totalCount ? "green" : "yellow"
  );
  console.log("─".repeat(80));

  // 详细统计
  console.log("\n📈 详细统计:");
  const stats = {
    generate: allResults.filter((r) => r.generate).length,
    filesCheck: allResults.filter((r) => r.filesCheck).length,
    install: allResults.filter((r) => r.install).length,
    build: allResults.filter((r) => r.build).length,
    dev: allResults.filter((r) => r.dev).length,
  };

  Object.entries(stats).forEach(([key, count]) => {
    const percentage = ((count / totalCount) * 100).toFixed(1);
    const label = {
      generate: "项目生成",
      filesCheck: "文件检查",
      install: "依赖安装",
      build: "项目构建",
      dev: "开发服务器",
    }[key];

    log(
      `  ${label}: ${count}/${totalCount} (${percentage}%)`,
      count === totalCount ? "green" : "yellow"
    );
  });

  return passCount === totalCount;
}

// 主函数
async function main() {
  const startTime = Date.now();

  console.log("\n");
  log("🚀 开始完整场景自动化测试", "bright");
  log(`测试场景数量: ${scenarios.length}`, "cyan");
  log(`测试时间: ${new Date().toLocaleString("zh-CN")}`, "dim");

  // 清理旧项目
  cleanupProjects();

  // 执行所有测试
  const allResults = [];
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const result = await testScenario(scenario);
    allResults.push(result);

    // 每个场景之间暂停一下
    if (i < scenarios.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // 生成报告
  const allPassed = generateReport(allResults);

  // 显示耗时
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("");
  log(`⏱️  总耗时: ${duration} 秒`, "cyan");

  // 退出
  if (allPassed) {
    log("\n🎉 所有场景测试通过！", "green");
    process.exit(0);
  } else {
    log("\n⚠️  部分场景测试失败，请查看上方报告", "yellow");
    process.exit(1);
  }
}

// 错误处理
process.on("unhandledRejection", (error) => {
  logError(`未处理的异常: ${error.message}`);
  console.error(error);
  process.exit(1);
});

process.on("SIGINT", () => {
  log("\n\n⚠️  测试被用户中断", "yellow");
  process.exit(130);
});

// 执行测试
main().catch((error) => {
  logError(`测试脚本异常: ${error.message}`);
  console.error(error);
  process.exit(1);
});
