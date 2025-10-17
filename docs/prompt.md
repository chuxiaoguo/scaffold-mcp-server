# 需求内容
我需要创建一个生成前端脚手架的mcp服务，其中支持两种创建方式，使用哪种方式，取决于用户的意图
 - 若用户只是简单的输入vue3+ts这种提示词，则使用固定搭配vue3-vite-typescript
 - 若用户输入了与固定模板不匹配的技术栈，比如vue3 + js + webpack + less + antd-vue + mock，你需要构建符合这样的技术模板，但是这样也需要检验工具与技术栈的搭配，比如使用不同构建工具使用不同的测试框架和mock等

# 固定模版的方式
目前支持以下技术栈组合的固定模板
| 模板名字 | 技术栈组合 | 实现要点 |
| --- | --- | --- |
| vue3-vite-typescript | vue3、vite、typescript、element-plus、pnpm，pinia，vue-router，tailwindcss | 创建使用工具: https://cn.vite.dev/guide/ 使用vite创建vue3+ts+vue-router+pinia+element-plus的项目 |
| Electron-vite-vue3 | Electron、vite、typescript、vue3、element-plus、pnpm，pinia，vue-router，tailwindcss | 创建使用工具: https://electron-vite.org/guide/ 使用electron-vite创建electron+vue3+ts+vue-router+pinia+element-plus的项目 |
| React-webpack-typescript | React、webpack、typescript、antd、pnpm、less | [文档](https://create-react-app.dev/docs/getting-started) 使用create-react-app创建React+webpack+ts的项目 |
| Umijs | react、pnpm、antd | 创建使用工具: https://umijs.org/docs/guides/getting-started 使用create-react-app创建React+webpack+ts的项目 |

注意：除了表格中列出的技术栈和工具，还需要对于所有的项目还需要以下工具:
- mock(webpack和vite需要使用不同的配置和工具)
- jest(webpack和vite需要使用不同的配置和工具)
- stylelint
- prettier
- eslint
- lint-staged
- husky
- commitlint
- gitignore（前端通用）
- npmrc（指定阿里镜像源）
- README.md(介绍如何安装启动项目)
- package.json
要求：
1、所有的工具都成单独文件，不要混入到package.json中
2、所有的工具都集成到每个项目中，无需单独抽离出通用的文件夹，比如shared
3、先看工具生成的模板是否包含这些工具若是包含则无需重复创建，若不包含则需要根据项目技术栈，搭配上适用的工具

# 非固定模板的方式
根据用户的内容输入生成模板项目：
比如用户输入：
```
帮我创建一个vue3 + webpack + typescript + vue-router + vuex + less 的项目，项目名称为my-project，请使用mcp服务
```
首先你需要拆分出技术栈和工具，看固定模板是否能匹配，若是能匹配，则直接使用固定模板生成项目。
若不能匹配，则需要根据用户的输入，构建符合用户需求的技术栈和工具（需要检验工具与技术栈的搭配，若是不搭配则采用相近的技术栈和工具）。

# 技术方案
你需要创建两个项目：
- scaffold-mcp-server（MCP 服务与生成引擎）
- scaffold-template（固定模板仓库）

## 总体架构
- 目标：提供一个通过 MCP 工具调用即可生成前端项目脚手架的服务，既支持“固定模板”快速复制，也支持“非固定模板”按技术栈动态拼装。
- 组成：
  - 服务端：基于 `@modelcontextprotocol/sdk` 提供 HTTP/stdio 的 MCP Server，暴露 `generate_scaffold` 工具与相关资源。
  - 模板库：`scaffold-template` 存放全部固定模板，结构清晰、可独立运行；通过 `degit` 拉取复制。
  - 生成引擎：在服务器中实现“命中固定模板/动态生成”的决策、依赖安装、工具注入、目录落盘与返回预览。

## 目录结构
- scaffold-mcp-server
  - `src/server.ts` MCP 服务入口（HTTP/stdio）
  - `src/tools/generateScaffold.ts` 生成工具核心逻辑
  - `src/core/matcher.ts` 固定模板匹配与映射表
  - `src/core/nonFixedBuilder/` 非固定模板生成器（vite/webpack/electron 等管线）
  - `src/core/injectors/` 通用工具注入器（jest、mock、eslint、stylelint、prettier、lint-staged、husky、commitlint、gitignore、npmrc、README）
  - `src/core/fs.ts` 路径落盘、冲突处理、资源链接返回
  - `src/core/platform.ts` OS 与工作目录解析（mac/windows）
  - `src/core/tree.ts` 目录树生成与内容摘要
  - `package.json` 最小依赖，禁止把工具配置混入此包

- scaffold-template
  - `vue3-vite-typescript/`（含 element-plus、pinia、vue-router、tailwindcss、pnpm）
  - `electron-vite-vue3/`（electron-vite 官方脚手架增强版）
  - `react-webpack-typescript/`（CRA/自定义 webpack + TS + antd + less）
  - `umijs/`（Umi + antd + pnpm）
  - 每个模板均需可运行，并尽量包含部分基础工具；但若缺失通用工具，服务端注入器会补齐（配置文件独立存放）。

## 模板选择与生成流程
- 输入：`tech_stack`（字符串或数组）、`project_name?`、`output_dir?`、`tools?`（额外工具）
- 决策：
  - 解析技术栈（框架、构建器、语言、路由、状态、样式库、UI 库、测试/Mock 偏好）。
  - 先尝试固定模板匹配（规范化别名，如 `vue3+ts` 命中 `vue3-vite-typescript`）。
  - 命中固定模板 → 使用 `degit` 拉取 `scaffold-template/<template>` 到目标目录。
  - 不命中 → 启用非固定生成器：按构建器与框架选择生成管线，逐步装配依赖与目录结构。
  - 在两种路径内，统一执行“通用工具检查与补齐”。
- 输出：
  - `structuredContent` 返回 JSON（`projectName`、`targetPath`、`tree`、`files` 摘要）。
  - 通过 MCP `resource_link` 提供每个文件的 URI，客户端可按需拉取内容。

## 固定模板实现
- 模板来源与维护：
  - 参考 `create-vite` 与 `electron-vite` 官方模板结构，结合项目表中要求的依赖与目录。
  - CRA/umijs 按官方脚手架初始化后精简与增强（移除/避免把工具配置混入 `package.json`）。
- 拉取复制：
  - 使用 `degit`：`degit <repo_or_local_path>/<template>#<tag>` → 复制到目标目录。
  - 支持版本标签与本地路径（`scaffold-template` 同仓库内路径）。
- 工具检查：
  - 若模板已带工具（如 CRA 自带 Jest），遵循“已有则不重复创建”的原则。
  - 否则调用注入器补齐：生成独立配置文件与依赖声明。

## 非固定模板生成引擎
- 管线选择：
  - 构建器：`vite`/`webpack`/`electron-vite` 按输入选择（默认 `vite`）。
  - 框架：`vue3`/`react` 等；语言：`ts`/`js`；路由/状态/UI/样式按输入映射到对应依赖与初始化代码。
- 目录与基础文件：
  - `src/`、`src/main.ts(x)`、`src/App.vue/tsx`、`src/router/`、`src/store/`、`src/styles/`、`mock/` 等。
  - `index.html`/`public/`（按构建器差异化生成）。
- 依赖安装策略：
  - 生成 `package.json`（仅依赖与脚本，所有工具配置独立文件）。
  - `pnpm` 优先（若输入指定 npm/yarn 则兼容），脚本 `dev/build/test/lint/format/mock`。
- 差异化测试与 Mock：
  - Jest for Vite：`jest` + `babel-jest` 或 `ts-jest` + `jsdom`，并提供 `jest.config.ts` 与 `babel.config.cjs`/`ts-jest` transform；避免将配置写入 `package.json`。
  - Jest for Webpack：使用 `babel-jest` + `@babel/preset-env` + `@babel/preset-react/typescript`，`jest.config.ts` 独立；CRA 若已内置则保持原状。
  - Mock for Vite：`vite-plugin-mock` + `mockjs` 或 `msw`（推荐开发时 `vite-plugin-mock`，生产可切 `msw`）。
  - Mock for Webpack：`webpack-dev-server` 自定义中间件或 `mock` 目录 + `express` 启动脚本。

## 通用工具集成（全部独立配置文件）
- `eslint`：框架/语言特定的 `.eslintrc.cjs`，含 `@typescript-eslint`、`eslint-plugin-vue/react`。不写入 `package.json`。
- `stylelint`：`.stylelintrc.cjs`，含 `stylelint-config-standard`、`stylelint-config-recommended-vue`/`stylelint-config-css-modules`；支持 less/tailwind。
- `prettier`：`.prettierrc` 与 `.prettierignore`。
- `lint-staged`：`lint-staged.config.cjs` 对 `*.{ts,tsx,js,jsx,vue}` 执行 `eslint --fix` 与 `prettier --write`。
- `husky`：初始化 `pre-commit` 执行 `lint-staged`，`commit-msg` 校验 `commitlint`。
- `commitlint`：`commitlint.config.cjs` 使用 `@commitlint/config-conventional`。
- `gitignore`：前端通用（node_modules、dist、.DS_Store 等）。
- `.npmrc`：`registry=https://registry.npmmirror.com/`。
- `README.md`：安装、启动、测试、Mock 使用说明；区分 vite/webpack。

## MCP 接口设计
- 工具：`generate_scaffold`
  - 入参：
    - `tech_stack: string | string[]`
    - `project_name?: string`
    - `output_dir?: string`
    - `extra_tools?: string[]`（如额外要求 `msw`/`vitest` 等）
    - `force?: boolean`（存在同名目录是否覆盖）
  - 出参：
    - `projectName`、`targetPath`、`tree`（目录树 JSON）、`files`（文件摘要）
    - 附带若干 `resource_link` 指向生成的文件 URI（客户端可拉取具体内容）
- 资源：
  - `scaffold://{projectName}/tree` 返回目录树
  - `scaffold://{projectName}/file/{path}` 返回文件内容
  - 提示：提供若干 `prompt`（如示例生成命令模板）
- 传输：
  - HTTP（`/mcp`）基于 `StreamableHTTPServerTransport`，参考示例实现无共享会话的无状态处理。
  - 可选 `stdio` 支持命令行环境调试。

## 输出与保存策略
- 路径决策顺序：
  - 若 `output_dir` 指定 → 直接使用；
  - 若 IDE 提供工作目录 → 使用 `process.cwd()` 或环境变量；
  - 否则回落到桌面：
    - mac：`~/Desktop`
    - windows：`%USERPROFILE%\\Desktop`
- 命名规则：
  - 用户指定优先；
  - 固定模板未指定 → 使用模板名；
  - 非固定模板未指定 → `framework-builder-language-...` 合成名（如 `vue3-webpack-ts-less-antd`）。
- 冲突与覆盖：
  - 目录存在时，若未 `force` → 返回错误与建议更名；
  - `force` 时安全清理后再写入。

## 安全与健壮性
- 路径校验：禁止 `..` 越权、确保目标在允许盘符范围内。
- 依赖安装可选：默认只生成项目与说明，安装由用户执行；或提供 `install: true` 时尝试调用 `pnpm i`。
- 错误处理：所有阶段均返回结构化错误码与描述，MCP 响应使用标准 `jsonrpc` 错误格式。

## 验证与测试
- 单元测试：对 `matcher`、`nonFixedBuilder`、`injectors`、`fs` 编写最小单测（Jest）。
- 自检：生成完成后构建目录树与关键文件存在性校验；可选运行 `lint` 与 `test` 预检查。
- 固定模板验证：每个模板在 `scaffold-template` 仓库内可独立 `pnpm i && pnpm dev/build` 启动。

## 运行与使用
- 启动服务：
  - `pnpm i`
  - `pnpm dev`（HTTP：`http://localhost:3000/mcp`）或 `pnpm start:stdio`
- 客户端接入：
  - MCP Inspector/Cursor/VS Code/Claude Code 按各自方式添加 HTTP/stdio 连接。
- 调用示例：
  - `generate_scaffold({ tech_stack: "vue3 + typescript + vue-router + pinia", project_name: "my-project" })`

## 后续维护
- 固定模板更新：集中在 `scaffold-template` 完成，服务端仅负责 `degit` 拉取。
- 技术栈映射表：在 `matcher.ts` 内维护，支持别名与新增组合。
- 工具注入器可扩展：支持 `vitest`、`playwright`、`cypress` 等按需扩展。

# scaffold-template
这里存放“固定模版的方式”中所有的固定项目：
- 参照实现要点构建四类模板，并保证 `pnpm dev/build/test` 正常运行。
- 若模板内缺失本文列出的通用工具，交由服务器注入器在复制后补齐（所有配置独立文件，绝不混入 `package.json`）。