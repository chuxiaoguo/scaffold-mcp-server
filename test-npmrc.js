#!/usr/bin/env node

// 测试 NpmrcInjector
import { getUnifiedInjectorManager } from "./dist/core/injectors/unified/index.js";

async function testNpmrc() {
  console.log("🧪 测试 NpmrcInjector...\n");

  const manager = getUnifiedInjectorManager();

  const context = {
    projectName: "test-project",
    projectPath: ".",
    files: {},
    packageJson: {
      name: "test-project",
      version: "1.0.0",
      private: true,
    },
    tools: ["vue2", "webpack"],
    logs: [],
  };

  const result = await manager.injectAll(context);

  console.log("\n📊 注入结果:");
  console.log("- 成功:", result.success);
  console.log("- 文件数量:", Object.keys(result.files).length);
  console.log("- 文件列表:", Object.keys(result.files).join(", "));

  if (result.files[".npmrc"]) {
    console.log("\n✅ .npmrc 文件已生成！");
    console.log("\n📄 文件内容:");
    console.log("---".repeat(20));
    console.log(result.files[".npmrc"]);
    console.log("---".repeat(20));
  } else {
    console.log("\n❌ .npmrc 文件未生成");
  }

  console.log("\n📋 注入日志:");
  result.logs.forEach((log) => {
    if (log.includes("npmrc") || log.includes(".npmrc")) {
      console.log("  ", log);
    }
  });
}

testNpmrc().catch(console.error);
