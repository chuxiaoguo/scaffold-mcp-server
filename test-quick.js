#!/usr/bin/env node

// 快速测试单个场景
import { generateScaffold } from "./dist/tools/generateScaffold.js";

async function quickTest() {
  console.log("🧪 测试: Vue3 + Vite + JS + Element Plus\n");

  const params = {
    tech_stack: "vue3 + vite + javascript + element-plus",
    project_name: "test-vue3-vite-js",
    project_path:
      "/Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server",
  };

  try {
    const result = await generateScaffold(params);
    console.log("\n✅ 生成成功!");
    console.log("项目路径:", result.targetPath);
    console.log("文件数量:", result.files.length);
  } catch (error) {
    console.error("\n❌ 生成失败:", error.message);
    console.error(error);
  }
}

quickTest();
