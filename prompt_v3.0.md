# 脚手架 MCP 服务方案 v3.0

## 变更摘要（相对 v2.0）
- 引入“通用工具可插拔架构”：模块化增删、版本化食谱、统一执行器、干跑与回滚。
- 新增“操作序列 DSL”和`toolset.json`清单，支持差异预览与幂等执行。
- 扩充兼容矩阵与适配器机制，细化对 `vite/webpack/electron-vite` 的差异化注入。
- 增强 MCP 接口体验：进度事件、错误规范、资源链接与大文件分块；对齐官方 SDK 的 `zod`/`registerTool`/`ResourceTemplate`/Prompt 补全。
- 路径安全、原子写入与本地缓存完善；支持 `dryRun/install/force/testRunner`/局部注入。

---

## 需求内容（与 v2.0 保持一致）
- 固定模板：命中 `vue3-vite-typescript`、`electron-vite-vue3`、`react-webpack-typescript`、`umijs` 时，直接复制固定模板并补齐缺失工具。
- 非固定模板：按输入组合（框架/构建器/语言/路由/状态/UI/样式/测试/Mock）动态生成，并验证工具与技术栈搭配合理性。
- 通用工具均需独立配置文件（不放入 `package.json`），模板若缺失则补齐。

通用工具清单：mock、jest、stylelint、prettier、eslint、lint-staged、husky、commitlint、gitignore、.npmrc、README。

---

## 总体架构
- 项目：
  - `scaffold-mcp-server`（MCP 服务与生成引擎）
  - `scaffold-template`（固定模板仓库，`degit` 拉取）
- 关键能力：
  - 固定模板匹配与复制、非固定模板生成管线、通用工具可插拔注入。
  - 目录落盘与原子移动、回滚与本地缓存、路径安全与 OS 桌面回退。
  - MCP 工具/资源/Prompt 接口，支持进度事件与资源链接返回。

---

## 目录结构建议
- scaffold-mcp-server
  - `src/server.ts` MCP 服务入口（HTTP/stdio）
  - `src/tools/generateScaffold.ts` 生成工具核心
  - `src/core/matcher.ts` 固定模板匹配与别名归一化
  - `src/core/nonFixedBuilder/` 非固定模板生成器（vite/webpack/electron-vite）
  - `src/core/injectors/` 通用工具注入器（模块化，见“工具模块规范”）
  - `src/core/compat.ts` 兼容矩阵与策略（框架/构建器/测试/Mock 的合理组合）
  - `src/core/adapter/` Builder 适配器（对 `vite/webpack/electron-vite` 的差异注入）
  - `src/core/dsl.ts` 操作序列 DSL 定义与执行器
  - `src/core/fs.ts` 临时目录生成、原子移动、冲突处理与资源链接
  - `src/core/tree.ts` 目录树生成与文件摘要
  - `src/core/cache.ts` 模板拉取缓存（`degit` 本地缓存与版本标签）
  - `src/core/platform.ts` OS 与工作目录解析（mac/windows 桌面路径）
  - `package.json` 最小依赖（不混入工具配置）

- scaffold-template
  - `vue3-vite-typescript/`
  - `electron-vite-vue3/`
  - `react-webpack-typescript/`
  - `umijs/`
  - 每个模板可独立运行；缺失通用工具由服务器注入器补齐。

---

## 工具模块规范（可插拔）
- 接口定义：
  - `IToolInjector`：
    - `name: string`
    - `plan(ctx): Operation[]` 生成操作序列（增删改文件/依赖/脚本/钩子）
    - `supports(ctx): boolean`（兼容校验）
    - `options?: Record<string, unknown>`（模块自定义选项）
  - `IBuilderAdapter`：
    - `type: 'vite' | 'webpack' | 'electron-vite'`
    - `patches: Patch[]`（对构建器配置文件的注入片段）
    - 提供 builder-specific 文件路径与写入策略
- 模块结构：
  - `files/`：模板文件（如 `.eslintrc.cjs`、`.prettierrc`、`jest.config.ts`、`.stylelintrc.cjs`、`commitlint.config.cjs` 等）
  - `recipe.ts`：声明式食谱（依赖、脚本、钩子、忽略规则、适配差异）
  - `index.ts`：实现 `plan(ctx)`，产出 DSL 操作序列
- 幂等与回滚：
  - 操作必须幂等（重复执行无副作用）；失败时支持回滚（基于临时目录与操作日志）。

### 操作序列 DSL（示例）
```ts
// Operation 类型示例
type Operation =
  | { type: 'addFile'; path: string; content: string; ifMissing?: boolean }
  | { type: 'removeFile'; path: string; ifExists?: boolean }
  | { type: 'mergeJson'; path: string; fragment: object; strategy?: 'deep' | 'replace' }
  | { type: 'addDeps'; deps: Record<string, string>; dev?: boolean }
  | { type: 'removeDeps'; names: string[] }
  | { type: 'addScript'; name: string; command: string; ifMissing?: boolean }
  | { type: 'removeScript'; name: string }
  | { type: 'huskyHook'; hook: 'pre-commit' | 'commit-msg'; command: string }
  | { type: 'adapterPatch'; builder: 'vite' | 'webpack' | 'electron-vite'; patchId: string };
```
- 执行器：`applyPlan(plan, { dryRun, force })` 返回 diff（新文件/变更/依赖/脚本）与错误；`dryRun` 时不落盘。
- 局部注入：支持只注入缺失项；合并策略遵循“项目覆盖 > 预设 > 默认”。

### 清单与预设
- `toolset.json`（示例）：
```json
{
  "eslint": { "preset": "vue-ts" },
  "prettier": {},
  "stylelint": { "css": true, "less": true, "vue": true },
  "jest": { "runner": "jest", "jsdom": true },
  "mock": { "type": "vite-plugin-mock" },
  "lint-staged": {},
  "husky": { "hooks": ["pre-commit", "commit-msg"] },
  "commitlint": { "config": "conventional" },
  "gitignore": {},
  "npmrc": { "registry": "https://registry.npmmirror.com/" },
  "editorconfig": {},
  "tsconfigBase": {}
}
```
- 预设：`web-vite-vue-ts-standard` 等，快速启用一组常用工具。

### 兼容矩阵（片段）
- `vite`：可用 `jest` 或 `vitest`；如用 `jest`，需 `jsdom`、`babel-jest`/`ts-jest`；Mock 推荐 `vite-plugin-mock`。
- `webpack`：测试优先 `jest`；Mock 可走 `webpack-dev-server` 中间件或 `express`。
- `tailwind`：需 `postcss` 与预设；`stylelint` 需适配忽略类名规则（避免误报）。

---

## 模板选择与生成流程
- 入参：`tech_stack: string | string[]`、`project_name?`、`output_dir?`、`extra_tools?`、`options?`（`force/install/dryRun/testRunner`、`partialInject`）。
- 决策：
  - 解析技术栈 → 固定模板匹配（别名归一化）→ 命中则 `degit` 拉取；否则走非固定生成器（按构建器/框架装配目录与依赖）。
  - 通用工具按 `toolset.json` 与兼容矩阵执行注入（DSL + 适配器）。
- 输出：
  - `structuredContent`：`projectName`、`targetPath`、`tree`、`files` 摘要、依赖与脚本变更、工具启用清单。
  - 附带 `resource_link`：指向生成的文件 URI（客户端可按需拉取）。
  - 进度事件：`parse` → `match` → `fetch/build` → `inject` → `write` → `done`（可选 `install`）。

---

## MCP 接口设计（对齐官方 SDK）
- 工具：`generate_scaffold`
  - `registerTool(name, config, handler)`；`config` 使用 `zod` 定义 `inputSchema`/`outputSchema` 并设置 `title/description`。
  - 返回同时包含 `content`（文本）与 `structuredContent`（JSON），必要时返回 `resource_link`（文件引用）。
- 资源：
  - `scaffold://{projectName}/tree`（目录树）
  - `scaffold://{projectName}/file/{path}`（文件内容，支持大文件分块/摘要）
  - 动态资源用 `ResourceTemplate`，可提供参数补全（`complete`）。
- Prompt 与补全：
  - `registerPrompt` + `completable()` 提供 `tech_stack`/`builder`/`testRunner`/`preset` 补全与别名纠错（例如 `ant-design-vue` vs `antd-vue`）。
- 传输：
  - HTTP（`/mcp`）采用“每请求新 transport”的无状态模式，`enableJsonResponse: true`，`res.close` 时关闭 transport，避免 JSON-RPC 请求 ID 冲突。
- 采样（可选）：
  - 使用 `server.createMessage` 为 README/映射建议生成草稿；默认关闭，按需开启。
- 错误：
  - 未发送响应头时返回标准 JSON-RPC 错误（如 `-32603`）；`content` 附带可读错误信息。
- 元数据：
  - 工具/资源设置 `title` 以提升客户端展示；`name` 保持唯一稳定标识。

---

## 输出与保存策略
- 路径优先级：`output_dir` > IDE 工作目录（`process.cwd()`） > 桌面（mac：`~/Desktop`；windows：`%USERPROFILE%\Desktop`）。
- 命名规则：用户指定优先；固定模板默认用模板名；非固定模板未指定时采用合成名（如 `vue3-webpack-ts-less-antd`）。
- 冲突与覆盖：默认不覆盖；`force` 时在临时目录生成，成功后原子移动。
- 本地缓存：`degit` 拉取的模板使用版本标签与本地缓存，重复生成走缓存。

---

## 安全与健壮性
- 路径校验：禁止 `..` 越权与非法字符；`degit` 仅允许从 `scaffold-template` 源拉取。
- 包管理器检测与降级：优先 `pnpm`，未检测到时降级 `npm`；在 `README` 提示安装建议。
- Node 版本：模板 `README` 与（可选）`.nvmrc`/`engines` 声明最小 Node 版本。
- 原子写与回滚：生成到临时目录，失败清理并回滚；记录操作日志以便审计。

---

## 验证与测试
- 单元测试：对 `matcher`、`nonFixedBuilder`、`injectors`、`dsl`、`adapter`、`fs` 编写最小单测（Jest）。
- 集成测试：在多技术栈项目上执行增删操作并校验最终文件树、脚本与运行命令（`lint/test/build`）。
- 模板烟测：`scaffold-template` 内置 `pnpm ci && pnpm dev && pnpm build && pnpm test`。
- CI：推送前在常见组合上跑烟测并输出变更报告。

---

## 运行与使用
- 启动服务：
  - `pnpm i`
  - `pnpm dev`（HTTP：`http://localhost:3000/mcp`）或 `pnpm start:stdio`
- 客户端接入：MCP Inspector / Cursor / VS Code / Claude Code 等配置 HTTP/stdio。
- 调用示例：
```ts
await generate_scaffold({
  tech_stack: "vue3 + typescript + vue-router + pinia",
  project_name: "my-project",
  options: { dryRun: true, testRunner: 'jest' }
});
```

---

## 维护与扩展
- 注册表驱动：`IBuilder`、`IToolInjector`、`IMatcher` 通过注册表统一管理，便于增删技术栈与工具。
- 版本化食谱：`recipe@vX.Y` 支持升级/降级迁移；输出迁移报告与回滚点。
- 预览与局部注入：支持 `dryRun` 与“仅注入缺失项”；返回 diff 与影响范围说明。
- 大文件优化：资源接口对大文件采用分块或摘要返回，客户端按需读取。

---

## 参考与前置
- 请先阅读 `mcp-server-example.md` 与 `llms-full.txt`（MCP 规范、HTTP 传输、工具/资源/Prompt、Sampling 示例）。
- 本方案与官方 SDK 接口对齐，满足“独立配置文件、不混入 `package.json`”的工具管理原则，同时提供模块化增删与适配差异。