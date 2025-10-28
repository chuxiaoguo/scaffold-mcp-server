#!/usr/bin/env node

// 简单的测试脚本来生成项目
import { generateScaffold } from "./dist/tools/generateScaffold.js";

async function test() {
  console.log("🚀 开始测试生成...");

  const params = {
    tech_stack: "vue2 + webpack + less + ant-design-vue",
    project_name: "my-project",
    project_path:
      "/Users/zcg/Desktop/scafford-mcp-server-AI/trae/scaffold-mcp-server",
  };

  console.log("📝 参数:", JSON.stringify(params, null, 2));

  try {
    const result = await generateScaffold(params);
    console.log("\n✅ 生成成功!");
    console.log("项目名称:", result.projectName);
    console.log("项目路径:", result.targetPath);
    console.log("文件数量:", result.files.length);
    console.log("\n📋 处理日志:");
    result.processLogs.forEach((log) => console.log(log));
  } catch (error) {
    console.error("\n❌ 生成失败:", error);
    console.error(error.stack);
  }
}

test();
