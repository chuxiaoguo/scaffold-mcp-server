# 模块交互图

## 整体模块交互概览

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as ScaffoldMCPServer
    participant Generator as generateScaffold
    participant Matcher as SmartMatcher
    participant Builder as NonFixedBuilder
    participant Injector as ToolInjector
    participant FileSystem as File System
    
    Client->>Server: generateScaffold request
    Server->>Generator: process request
    Generator->>Generator: parse tech stack
    Generator->>Generator: resolve project path
    Generator->>Matcher: match template
    Matcher->>Matcher: calculate scores
    Matcher-->>Generator: return best match
    
    alt Fixed Template
        Generator->>FileSystem: copy template files
        Generator->>Injector: inject tools
        Injector->>FileSystem: modify files
    else Non-Fixed Template
        Generator->>Builder: build project
        Builder->>FileSystem: create project structure
        Builder->>Injector: inject tools
        Injector->>FileSystem: modify files
    end
    
    Generator-->>Server: return result
    Server-->>Client: response
```

## 核心模块详细交互

### 模板匹配交互流程

```mermaid
sequenceDiagram
    participant GS as generateScaffold
    participant M as matcher
    participant IR as intentRecognizer
    participant SM as SmartMatcher
    participant KM as KeywordMatcher
    participant SC as ScoreCalculator
    participant TCM as templateConfigManager
    
    GS->>M: smartMatchFixedTemplate(techStack)
    M->>IR: recognizeIntent(techStack)
    IR-->>M: intent analysis
    M->>SM: match(techStack, templates)
    SM->>KM: matchKeywords(techStack, template)
    KM->>SC: calculateScore(matches)
    SC-->>KM: keyword score
    KM-->>SM: keyword match result
    SM->>SC: calculateFinalScore(results)
    SC-->>SM: final scores
    SM-->>M: ranked matches
    M->>TCM: getTemplateConfig(bestMatch)
    TCM-->>M: template config
    M-->>GS: best template match
```

### 项目生成交互流程

```mermaid
sequenceDiagram
    participant PG as projectGenerator
    participant TM as templateManager
    participant NFB as nonFixedBuilder
    participant TI as toolInjector
    participant TD as templateDownloader
    participant FS as File System
    
    PG->>TM: getTemplateSync()
    TM->>FS: check local templates
    alt Templates outdated
        TM->>TD: downloadTemplates()
        TD->>FS: download and extract
    end
    TM-->>PG: templates ready
    
    alt Fixed Template
        PG->>FS: copyTemplate(templatePath, targetPath)
        PG->>TI: injectExtraTools(tools, targetPath)
        TI->>FS: modify package.json, configs
    else Non-Fixed Template
        PG->>NFB: buildProject(techStack, targetPath)
        NFB->>FS: create project structure
        NFB->>TI: injectTools(tools, targetPath)
        TI->>FS: create config files
    end
    
    PG-->>PG: project generated
```

### 工具注入交互流程

```mermaid
sequenceDiagram
    participant TIM as ToolInjectorManager
    participant EI as eslintInjector
    participant PI as prettierInjector
    participant JI as jestInjector
    participant HI as huskyInjector
    participant SI as stylelintInjector
    participant FS as File System
    
    TIM->>TIM: processTools(tools, projectPath)
    
    loop for each tool
        alt tool === 'eslint'
            TIM->>EI: inject(projectPath)
            EI->>FS: create .eslintrc.js
            EI->>FS: update package.json
        else tool === 'prettier'
            TIM->>PI: inject(projectPath)
            PI->>FS: create .prettierrc
            PI->>FS: update package.json
        else tool === 'jest'
            TIM->>JI: inject(projectPath)
            JI->>FS: create jest.config.js
            JI->>FS: update package.json
        else tool === 'husky'
            TIM->>HI: inject(projectPath)
            HI->>FS: create .husky/
            HI->>FS: update package.json
        else tool === 'stylelint'
            TIM->>SI: inject(projectPath)
            SI->>FS: create .stylelintrc.js
            SI->>FS: update package.json
        end
    end
```

## 构建器系统交互

### 非固定模板构建交互

```mermaid
sequenceDiagram
    participant NFB as NonFixedBuilder
    participant VB as vue3Builder
    participant RB as reactBuilder
    participant UB as umiBuilder
    participant EB as electronBuilder
    participant FS as File System
    
    NFB->>NFB: determineBuilder(techStack)
    
    alt Vue3 project
        NFB->>VB: build(projectPath, options)
        VB->>FS: create Vue3 structure
        VB->>FS: create vite.config.ts
        VB->>FS: create main.ts
    else React project
        NFB->>RB: build(projectPath, options)
        RB->>FS: create React structure
        RB->>FS: create webpack.config.js
        RB->>FS: create index.tsx
    else Umi project
        NFB->>UB: build(projectPath, options)
        UB->>FS: create Umi structure
        UB->>FS: create .umirc.ts
        UB->>FS: create pages/
    else Electron project
        NFB->>EB: build(projectPath, options)
        EB->>FS: create Electron structure
        EB->>FS: create main process
        EB->>FS: create renderer process
    end
```

## 模板管理系统交互

### 模板同步交互流程

```mermaid
sequenceDiagram
    participant TS as TemplateSync
    participant LM as LocalManager
    participant VC as VersionChecker
    participant RF as RemoteFetcher
    participant TCM as templateConfigManager
    participant FS as File System
    
    TS->>LM: checkLocalTemplates()
    LM->>FS: read local template info
    LM-->>TS: local template status
    
    TS->>VC: checkVersion(localVersion)
    VC->>RF: fetchRemoteVersion()
    RF-->>VC: remote version info
    VC-->>TS: version comparison
    
    alt Update needed
        TS->>RF: downloadTemplates()
        RF->>FS: download template archive
        RF->>FS: extract templates
        RF->>TCM: update template config
        TCM->>FS: save config
    end
    
    TS-->>TS: sync completed
```

## 配置管理交互

### 配置加载和管理交互

```mermaid
sequenceDiagram
    participant App as Application
    participant TCM as templateConfigManager
    participant PM as PluginManager
    participant CM as ConfigMerger
    participant FS as File System
    
    App->>TCM: loadTemplateConfig()
    TCM->>FS: read templates.config.json
    TCM-->>App: template configurations
    
    App->>PM: loadPlugins()
    PM->>FS: read configs/plugins/
    PM->>CM: mergeConfigs(pluginConfigs)
    CM-->>PM: merged plugin config
    PM-->>App: plugin configurations
    
    App->>App: initialize with configs
```

## 错误处理交互

### 错误处理和响应格式化交互

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as ScaffoldMCPServer
    participant EH as MCPErrorHandler
    participant RF as ResponseFormatter
    participant Generator as generateScaffold
    
    Client->>Server: request
    Server->>Generator: process
    
    alt Success
        Generator-->>Server: success result
        Server->>RF: formatSuccess(result)
        RF-->>Server: formatted response
        Server-->>Client: success response
    else Error
        Generator-->>Server: error
        Server->>EH: handleError(error)
        EH->>RF: formatError(error)
        RF-->>EH: formatted error
        EH-->>Server: error response
        Server-->>Client: error response
    end
```

## 文件系统操作交互

### 文件操作交互流程

```mermaid
sequenceDiagram
    participant App as Application
    participant PR as pathResolver
    participant PG as projectGenerator
    participant FS as File System
    
    App->>PR: resolveProjectPathAndName(input)
    PR->>FS: check path existence
    PR->>PR: validate path
    PR-->>App: resolved path info
    
    App->>PG: generateProject(config)
    PG->>FS: create directory structure
    PG->>FS: copy template files
    PG->>FS: create package.json
    PG->>FS: create .gitignore
    PG->>FS: create .npmrc
    PG-->>App: generation complete
```

## 插件系统交互

### 插件集成交互流程

```mermaid
sequenceDiagram
    participant PI as PluginIntegrator
    participant PM as PluginManager
    participant CM as ConfigMerger
    participant FS as File System
    
    PI->>PM: loadPlugins(framework)
    PM->>FS: read plugin configs
    PM-->>PI: plugin definitions
    
    PI->>CM: mergeConfigs(baseConfig, pluginConfigs)
    CM->>CM: resolve conflicts
    CM->>CM: merge dependencies
    CM->>CM: merge scripts
    CM-->>PI: merged configuration
    
    PI->>FS: apply merged config
    PI-->>PI: integration complete
```