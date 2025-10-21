# MCP连接故障排除指南

## 问题症状
```
McpError: MCP error -32000: Connection closed
not interactive and can't open terminal 
compinit: initialization aborted 
/Users/zcg/.bun/_bun:966: command not found: compdef
```

## 问题原因
MCP客户端通过子进程启动scaffold-mcp-server时，shell配置问题导致进程启动失败。

## 解决方案

### 方案1：修复Shell配置（推荐）
1. 备份当前配置：
```bash
cp ~/.zshrc ~/.zshrc.backup
```

2. 检查你的 `~/.zshrc` 文件：
```bash
grep -n "bun" ~/.zshrc
```

3. 自动注释掉有问题的bun配置行：
```bash
sed -i '' 's/\[ -s "\/Users\/zcg\/.bun\/_bun" \] && source "\/Users\/zcg\/.bun\/_bun"/# \[ -s "\/Users\/zcg\/.bun\/_bun" \] \&\& source "\/Users\/zcg\/.bun\/_bun"/' ~/.zshrc
```

4. 验证修改：
```bash
grep -n "bun" ~/.zshrc
```

5. 测试zsh配置：
```bash
zsh -c "source ~/.zshrc && echo 'zsh config loaded successfully'"
```

### 方案2：使用绝对路径配置
在MCP客户端配置中，不使用npx，而是使用绝对路径：

```json
{
  "mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["/path/to/global/node_modules/scaffold-mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### 方案3：使用不同的Shell
临时使用bash而不是zsh：
```json
{
  "mcpServers": {
    "scaffold-generator": {
      "command": "bash",
      "args": ["-c", "npx scaffold-mcp-server@1.1.7"],
      "env": {}
    }
  }
}
```

## 验证修复
1. 在终端中测试：
```bash
npx scaffold-mcp-server@1.1.7 --help
```

2. 如果没有错误输出，说明shell配置已修复

3. 重启MCP客户端并测试连接

## 预防措施
- 定期检查shell配置文件的完整性
- 避免在shell配置中添加可能失败的初始化脚本
- 使用条件检查确保命令存在后再执行