#!/usr/bin/env node

// 测试新增的 4 个注入器
import { getUnifiedInjectorManager } from "./dist/core/injectors/unified/index.js";

async function testNewInjectors() {
  console.log("🧪 测试新增的 4 个注入器\n");

  const manager = getUnifiedInjectorManager();

  // 测试场景 1: Pinia + Vue Router
  console.log("📋 场景 1: Vue3 + Pinia + Vue Router");
  const context1 = {
    projectName: "test-vue-full",
    projectPath: ".",
    files: {
      "src/main.ts": `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')
`,
      "src/App.vue": `<template>
  <div id="app">
    <h1>Hello Vue</h1>
  </div>
</template>
`,
    },
    packageJson: {
      name: "test-vue-full",
      version: "1.0.0",
      dependencies: {
        vue: "^3.3.4",
      },
    },
    tools: ["vue3", "pinia", "vue-router"],
    framework: "vue3",
    language: "typescript",
    logs: [],
  };

  const result1 = await manager.injectAll(context1);
  console.log("✅ 注入结果:", result1.success);
  console.log("📁 生成的文件:", Object.keys(result1.files).join(", "));
  console.log(
    "📦 依赖:",
    Object.keys(result1.packageJson.dependencies || {}).join(", ")
  );

  // 测试场景 2: Redux + React Router
  console.log("\n📋 场景 2: React + Redux + React Router");
  const context2 = {
    projectName: "test-react-full",
    projectPath: ".",
    files: {
      "src/main.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
      "src/App.tsx": `import React from 'react'

function App() {
  return (
    <div className="app">
      <h1>Hello React</h1>
    </div>
  )
}

export default App
`,
    },
    packageJson: {
      name: "test-react-full",
      version: "1.0.0",
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
    },
    tools: ["react", "redux", "react-router"],
    framework: "react",
    language: "typescript",
    logs: [],
  };

  const result2 = await manager.injectAll(context2);
  console.log("✅ 注入结果:", result2.success);
  console.log("📁 生成的文件:", Object.keys(result2.files).join(", "));
  console.log(
    "📦 依赖:",
    Object.keys(result2.packageJson.dependencies || {}).join(", ")
  );

  // 输出日志
  console.log("\n📋 注入日志 (包含新注入器的):");
  result1.logs.concat(result2.logs).forEach((log) => {
    if (
      log.includes("pinia") ||
      log.includes("router") ||
      log.includes("redux") ||
      log.includes("Router")
    ) {
      console.log("  ", log);
    }
  });
}

testNewInjectors().catch(console.error);
