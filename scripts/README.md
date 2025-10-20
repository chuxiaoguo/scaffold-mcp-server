# 发布脚本使用指南

本目录包含了自动化发布npm包的相关脚本。

## 脚本说明

### 1. publish.cjs - 主发布脚本
完整的自动化发布流程，包括：
- Git状态检查
- 运行测试
- 构建项目
- 版本更新
- 生成changelog
- 发布到npm
- 推送到Git仓库

**使用方法：**
```bash
# 发布patch版本 (默认)
npm run release

# 发布不同版本类型
npm run release:patch   # 1.0.0 -> 1.0.1
npm run release:minor   # 1.0.0 -> 1.1.0
npm run release:major   # 1.0.0 -> 2.0.0

# 发布beta版本
npm run release:beta
```

### 2. pre-publish-check.cjs - 发布前检查
检查项目是否准备好发布，包括：
- package.json必要字段检查
- 文件存在性检查
- Git状态检查
- npm配置检查
- 依赖安全检查
- 构建和测试配置检查

**使用方法：**
```bash
npm run pre-publish-check
```

### 3. version-manager.cjs - 版本管理
交互式版本管理和changelog生成：
- 自动分析Git提交
- 按类型分类提交信息
- 生成结构化的changelog
- 更新package.json版本

**使用方法：**
```bash
# 交互式版本管理
npm run version:manage

# 生成changelog
npm run changelog:generate
```

## 发布流程建议

1. **开发完成后**
   ```bash
   # 1. 检查项目状态
   npm run pre-publish-check
   
   # 2. 修复检查中发现的问题
   
   # 3. 提交所有更改
   git add .
   git commit -m "feat: 完成新功能开发"
   
   # 4. 执行发布
   npm run release:minor
   ```

2. **快速修复发布**
   ```bash
   # 修复bug后直接发布patch版本
   npm run release:patch
   ```

3. **重大版本发布**
   ```bash
   # 有破坏性更改时发布major版本
   npm run release:major
   ```

## 注意事项

1. **npm登录**: 发布前确保已登录npm
   ```bash
   npm login
   ```

2. **Git状态**: 发布前确保所有更改已提交

3. **测试通过**: 脚本会自动运行测试，确保测试通过

4. **版本规范**: 遵循语义化版本规范 (SemVer)

5. **Changelog**: 自动生成的changelog基于Git提交信息，建议使用规范的提交信息格式

## 提交信息规范

为了生成更好的changelog，建议使用以下提交信息格式：

- `feat: 新功能`
- `fix: 修复bug`
- `docs: 文档更新`
- `style: 代码格式化`
- `refactor: 代码重构`
- `test: 测试相关`
- `chore: 构建过程或辅助工具的变动`

## 故障排除

1. **模块导入错误**: 确保脚本使用.cjs扩展名
2. **权限错误**: 运行 `chmod +x scripts/*.cjs`
3. **npm发布失败**: 检查npm登录状态和包名是否已存在
4. **Git推送失败**: 检查远程仓库权限和网络连接