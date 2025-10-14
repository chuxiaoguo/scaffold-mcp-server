# 脚手架 MCP 服务方案 v2.0

## 需求内容
我需要创建一个生成前端脚手架的 MCP 服务，支持两种创建方式，使用哪种方式取决于用户的意图：
- 若用户只是简单地输入如 `vue3+ts` 这种提示词，则使用固定搭配 `vue3-vite-typescript`。
- 若用户输入了与固定模板不匹配的技术栈，比如 `vue3 + js + webpack + less + antd-vue + mock`，需要构建符合该技术栈的模板；同时必须检验工具与技术栈的搭配（不同构建工具使用不同的测试框架和 Mock 等）。

### 固定模版的方式
目前支持以下技术栈组合的固定模板：
- `vue3-vite-typescript`：vue3、vite、typescript、element-plus、pnpm、pinia、vue-router、tailwindcss（参考 https://cn.vite.dev/guide/ 使用 vite 创建）
- `electron-vite-vue3`：Electron、vite、typescript、vue3、element-plus、pnpm、pinia、vue-router、tailwindcss（参考 https://electron-vite.org/guide/ 使用 electron-vite 创建）
- `react-webpack-typescript`：React、webpack、typescript、antd、pnpm、less（参考 https://create-react-app.dev/docs/getting-started 使用 CRA 创建）
- `umijs`：react、pnpm、antd（参考 https://umijs.org/docs/guides/getting-started 使用 Umi 创建）

注意：除了表格中列出的技术栈和工具，对所有项目还需要以下通用工具：
- mock（webpack 和 vite 使用不同的配置与工具）
- jest（webpack 和 vite 使用不同的配置与工具）
- stylelint
- prettier
- eslint
- lint-staged
- husky
- commitlint
- gitignore（前端通用）
- .npmrc（指定阿里镜像源）
- README.md（介绍如何安装启动项目）
- package.json

要求：
1. 所有工具都使用独立配置文件，避免混入到 `package.json`。
2. 所有工具都集成到每个项目中，无需抽离共享文件夹（如 `shared`）。
3. 若模板已包含相关工具，则无需重复创建；若不包含则根据技术栈搭配适用工具进行补齐。

### 非固定模板的方式
根据用户的内容输入生成模板项目：
- 若能匹配固定模板则直接使用固定模板生成项目。
- 若不能匹配，则按用户输入构建符合需求的技术栈与工具（需检验搭配；不合理时采用相近替代）。

示例：
```
帮我创建一个 vue3 + webpack + typescript + vue-router + vuex + less 的项目，项目名称为 my-project，请使用 MCP 服务
```

---

## 技术方案 v2.0
你需要创建两个项目：
- `scaffold-mcp-server`（MCP 服务与生成引擎）
- `scaffold-template`（固定模板仓库）

### 总体架构
- 目标：通过 MCP 工具调用生成前端项目脚手架，支持“固定模板快速复制”与“非固定模板动态拼装”。
- 组成：
  - 服务端：基于 `@modelcontextprotocol/sdk` 提供 HTTP/stdio MCP Server，暴露 `generate_scaffold` 工具与相关资源。
  - 模板库：`scaffold-template` 存放全部固定模板，通过 `degit` 拉取复制。
  - 生成引擎：在服务器实现“命中固定模板/动态生成”的决策、依赖声明、工具注入、目录落盘、返回目录树与文件摘要。

### 目录结构
- scaffold-mcp-server
  - `src/server.ts` MCP 服务入口（HTTP/stdio）
  - `src/tools/generateScaffold.ts` 生成工具核心逻辑
  - `src/core/matcher.ts` 固定模板匹配与映射表（别名归一化）
  - `src/core/nonFixedBuilder/` 非固定模板生成器（vite/webpack/electron-vite 管线）
  - `src/core/injectors/` 通用工具注入器（jest、mock、eslint、stylelint、prettier、lint-staged、husky、commitlint、gitignore、npmrc、README）
  - `src/core/fs.ts` 落盘/临时目录/原子移动与回滚、冲突处理、资源链接生成
  - `src/core/platform.ts` OS 与工作目录解析（mac/windows 桌面路径）
  - `src/core/tree.ts` 目录树生成与文件摘要
  - `src/core/compat.ts` 技术栈兼容矩阵与策略（框架/构建器/测试/Mock 合理组合）
  - `src/core/cache.ts` 模板拉取缓存（`degit` 本地缓存与版本标签）
  - `package.json` 最小依赖（不混入工具配置）

- scaffold-template
  - `vue3-vite-typescript/`
  - `electron-vite-vue3/`
  - `react-webpack-typescript/`
  - `umijs/`
  - 每个模板可独立运行；若缺失通用工具，由服务端注入器补齐（配置文件独立）。

### 模板选择与生成流程
- 入参：`tech_stack`（字符串或数组）、`project_name?`、`output_dir?`、`tools?`（额外工具）、`options?`（dryRun/install/force/testRunner 等）。
- 决策：
  - 解析技术栈（框架、构建器、语言、路由、状态、样式库、UI 库、测试/Mock）。
  - 固定模板匹配：别名归一化（如 `vue3+ts` → `vue3-vite-typescript`）。
  - 命中固定模板 → 使用 `degit` 从 `scaffold-template/<template>` 复制到目标目录（支持版本标签与缓存）。
  - 不命中 → 启用非固定生成器：按构建器与框架选择生成管线，装配依赖与目录结构。
  - 两种路径均执行“通用工具检查与补齐”。
- 输出：
  - 返回 `structuredContent`：`projectName`、`targetPath`、`tree`（目录树 JSON）、`files`（文件摘要）。
  - 附带 `resource_link` 指向生成的文件 URI，客户端按需拉取内容。
  - 支持阶段性进度事件：解析→匹配→拉取/构建→注入→落盘→完成。

### 固定模板实现
- 模板维护：参考官方脚手架结构（create-vite/electron-vite/CRA/Umi），满足依赖与目录要求；避免把工具配置写入 `package.json`。
- 拉取复制：使用 `degit`（支持标签与本地路径），并引入本地缓存提升重复生成性能。
- 工具检查：模板已有工具则不重复创建；缺失则由注入器补齐（独立配置文件）。
- 模板验收：在 `scaffold-template` 内置烟测脚本：`pnpm ci && pnpm dev && pnpm build && pnpm test`。

### 非固定模板生成引擎
- 管线选择：
  - 构建器：`vite`/`webpack`/`electron-vite`（默认 `vite`）。
  - 框架：`vue3`/`react`；语言：`ts`/`js`；路由/状态/UI/样式按输入映射依赖与初始化代码。
- 目录与基础文件：
  - `src/`、`src/main.ts(x)`、`src/App.vue/tsx`、`src/router/`、`src/store/`、`src/styles/`、`mock/` 等。
  - `index.html`/`public/` 按构建器差异化生成。
- 依赖与脚本：
  - 生成 `package.json`（仅依赖与脚本），优先 `pnpm`（兼容 npm/yarn）；脚本：`dev/build/test/lint/format/mock`。
- 测试与 Mock：
  - Jest for Vite：`jest` + `babel-jest` 或 `ts-jest` + `jsdom`；独立 `jest.config.ts` 与 transform 配置。
  - Jest for Webpack：`babel-jest` + `@babel/preset-env` + React/TS 预设；独立 `jest.config.ts`。
  - 可选 `Vitest` 作为 Vite 专用测试框架，通过入参 `testRunner` 切换；默认仍满足“Jest 可用”要求。
  - Mock for Vite：`vite-plugin-mock` + `mockjs`（开发）；可选生产 `msw`。
  - Mock for Webpack：`webpack-dev-server` 中间件或 `express` 启动脚本。

### 通用工具集成（全部独立配置文件）
- `eslint`：`.eslintrc.cjs`，含 `@typescript-eslint`、`eslint-plugin-vue/react`，结合 `eslint-config-prettier`；不写入 `package.json`。
- `stylelint`：`.stylelintrc.cjs`，含 `stylelint-config-standard`、`stylelint-config-recommended-vue` 或 `stylelint-config-css-modules`；适配 `less/tailwind` 避免误报。
- `prettier`：`.prettierrc` 与 `.prettierignore`；可选 `prettier-plugin-tailwindcss`。
- `lint-staged`：`lint-staged.config.cjs` 针对 `*.{ts,tsx,js,jsx,vue}` 执行 `eslint --fix` 与 `prettier --write`。
- `husky`：初始化 `pre-commit`（执行 `lint-staged`），`commit-msg`（校验 `commitlint`）。
- `commitlint`：`commitlint.config.cjs` 使用 `@commitlint/config-conventional`。
- `gitignore`：前端通用（`node_modules`、`dist`、`.DS_Store` 等）。
- `.npmrc`：`registry=https://registry.npmmirror.com/`。
- `README.md`：安装、启动、测试、Mock 使用说明；区分 `vite/webpack` 差异。
- `.editorconfig`：统一基础格式。
- `tsconfig.base.json`：提供 TS 基准配置，模板引用继承。

### MCP 接口设计
- 工具：`generate_scaffold`
  - 入参：
    - `tech_stack: string | string[]`
    - `project_name?: string`
    - `output_dir?: string`
    - `extra_tools?: string[]`
    - `options?: { force?: boolean; install?: boolean; dryRun?: boolean; testRunner?: 'jest' | 'vitest'; }`
  - 出参：
    - `projectName`、`targetPath`、`tree`（目录树 JSON）、`files`（文件摘要）
    - 阶段性进度与事件（解析/匹配/拉取/注入/落盘/完成）
    - 若 `dryRun`：不落盘，仅返回树与摘要与 diff 预览
- 资源：
  - `scaffold://{projectName}/tree` 返回目录树
  - `scaffold://{projectName}/file/{path}` 返回文件内容（大文件支持分块/摘要）
- 传输：
  - HTTP（`/mcp`）基于 `StreamableHTTPServerTransport`（无状态、每请求新会话）
  - 可选 `stdio` 支持命令行调试
- Prompt：
  - 提供生成命令的模板与技术栈补全（别名纠错，如 `ant-design-vue` vs `antd-vue`）

#### 与官方 SDK 规范对齐补充
- 工具注册：使用 `registerTool(name, config, handler)`，`config` 中通过 `zod` 定义 `inputSchema` 与 `outputSchema`，并设置 `title/description` 以便客户端展示。
- 返回内容：在工具 `handler` 中同时返回 `content`（文本，包含进度/结果）与 `structuredContent`（标准 JSON 结果）；必要时附带 `resource_link` 引用生成的文件。
- 资源注册：固定与动态资源分别通过字符串 URI 与 `ResourceTemplate` 注册；`ResourceTemplate` 的 `complete` 可提供参数补全（如框架、构建器、UI 库）。
- Prompt 与补全：使用 `registerPrompt` 并结合 `completable()` 提供参数补全；例如为 `tech_stack`、`builder`、`testRunner` 等提供智能建议与别名纠错。
- 采样支持（可选）：如需在服务端用 LLM 做建议生成（例如技术栈映射、README 文本草稿），使用 `mcpServer.server.createMessage` 调用 Sampling。默认关闭，按需开启。
- HTTP 传输细节：每个 HTTP 请求创建新的 `StreamableHTTPServerTransport({ enableJsonResponse: true })`，在 `res.close` 时关闭 transport，避免 JSON-RPC 请求 ID 冲突。
- 错误处理：当发生错误且响应头未发送时，返回标准 JSON-RPC 错误（如 `-32603`），并在 `content` 文本中附带可读错误信息。
- 元数据：为工具/资源配置 `title` 字段，客户端显示友好；名称使用稳定的唯一标识。

### 输出与保存策略
- 路径顺序：`output_dir` > IDE 工作目录（`process.cwd()`） > 桌面（mac：`~/Desktop`；windows：`%USERPROFILE%\Desktop`）。
- 命名规则：用户指定优先；固定模板未指定使用模板名；非固定模板未指定采用合成名（如 `vue3-webpack-ts-less-antd`）。
- 冲突与覆盖：默认不覆盖；`force` 时使用临时目录生成，成功后原子移动以避免半成品。

### 安全与健壮性
- 路径校验：禁止 `..` 越权与非法字符；仅允许从 `scaffold-template` 拉取模板。
- 包管理器检测与降级：优先 `pnpm`，未检测到时降级到 `npm`，`README` 提示安装建议。
- Node 版本：在模板 `README` 与可选 `.nvmrc`/`engines` 声明最小 Node 版本。
- 错误处理：各阶段返回结构化错误码与描述，MCP 响应遵循标准 `jsonrpc` 错误格式。

### 验证与测试
- 单元测试：对 `matcher`、`nonFixedBuilder`、`injectors`、`fs` 编写最小单测（Jest）。
- 集成测试：对“固定模板拉取+工具补齐”写集成测试（mock 文件系统）。
- 生成后自检：校验关键文件、脚本与配置存在性；运行 `lint` 与 `test --passWithNoTests` 的烟测。
- CI 持续验证：为 `scaffold-template` 配置 CI，合并前自动跑烟测。

### 运行与使用
- 启动服务：
  - `pnpm i`
  - `pnpm dev`（HTTP：`http://localhost:3000/mcp`）或 `pnpm start:stdio`
- 客户端接入：MCP Inspector / Cursor / VS Code / Claude Code 等按各自方式添加 HTTP/stdio 连接。
- 调用示例：
  - `generate_scaffold({ tech_stack: "vue3 + typescript + vue-router + pinia", project_name: "my-project" })`

### 维护与扩展
- 插件接口：定义 `IBuilder`（vite/webpack/electron-vite）、`IToolInjector`（eslint/jest/mock…）、`IMatcher`（模板匹配），通过注册表驱动扩展新技术栈。
- 兼容策略：在 `compat.ts` 统一维护框架/构建器/测试/Mock 合理组合，避免策略散落于代码。
- 模板版本与升级：在模板依赖中策略性使用 `~` 或 `^` 并提供升级指令与变更日志。
- 缓存层：本地缓存 `degit` 拉取的模板包并使用版本标签，重复生成走缓存提升性能。
- 预览与干跑：支持 `dryRun` 返回目录树与文件摘要，不落盘；支持对现有项目进行“仅注入缺失工具/配置”，返回 diff。
- 大文件返回优化：资源接口对大文件采用分块或摘要返回，客户端按需拉取。

---

## scaffold-template
这里存放“固定模版”中所有固定项目：
- 参照实现要点构建四类模板，并保证 `pnpm dev/build/test` 正常运行。
- 若模板内缺失通用工具，交由服务器注入器在复制后补齐（所有配置独立文件，避免混入 `package.json`）。

---

## 参考与前置
- 请先阅读 `mcp-server-example.md`（MCP 服务示例），以及 `llms-full.txt`（MCP 相关功能描述）。
- MCP 传输与工具/资源/Prompt 的设计参考官方文档与示例实现（HTTP 无状态，每请求新会话，返回结构化内容与资源链接）。