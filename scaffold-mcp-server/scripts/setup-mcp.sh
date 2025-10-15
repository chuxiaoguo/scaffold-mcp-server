#!/bin/bash

# Scaffold MCP Server 自动配置脚本
# 支持 macOS 和 Linux 系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Scaffold MCP Server 配置工具${NC}"
echo "=================================================="

# 检查 Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js >= 16.0.0${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        echo -e "${RED}❌ Node.js 版本过低，当前版本: $NODE_VERSION，需要 >= $REQUIRED_VERSION${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js 版本检查通过: $NODE_VERSION${NC}"
}

# 构建项目
build_project() {
    echo -e "${YELLOW}📦 构建 MCP 服务器...${NC}"
    cd "$PROJECT_DIR"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 未找到 package.json 文件${NC}"
        exit 1
    fi
    
    npm install
    npm run build
    
    if [ ! -f "dist/index.js" ]; then
        echo -e "${RED}❌ 构建失败，未找到 dist/index.js${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 项目构建完成${NC}"
}

# 配置 Cursor
setup_cursor() {
    echo -e "${YELLOW}🎯 配置 Cursor...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CONFIG_DIR="$HOME/.cursor"
    else
        CONFIG_DIR="$HOME/.config/cursor"
    fi
    
    mkdir -p "$CONFIG_DIR"
    CONFIG_FILE="$CONFIG_DIR/mcp_servers.json"
    
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["$PROJECT_DIR/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      },
      "description": "Frontend project scaffold generator"
    }
  }
}
EOF
    
    echo -e "${GREEN}✅ Cursor 配置完成: $CONFIG_FILE${NC}"
}

# 配置 Claude Desktop
setup_claude_desktop() {
    echo -e "${YELLOW}🤖 配置 Claude Desktop...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
    else
        CONFIG_DIR="$HOME/.config/claude"
    fi
    
    mkdir -p "$CONFIG_DIR"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["$PROJECT_DIR/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
    
    echo -e "${GREEN}✅ Claude Desktop 配置完成: $CONFIG_FILE${NC}"
}

# 配置 VS Code (Cline)
setup_vscode_cline() {
    echo -e "${YELLOW}📝 配置 VS Code Cline...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CONFIG_DIR="$HOME/Library/Application Support/Code/User"
    else
        CONFIG_DIR="$HOME/.config/Code/User"
    fi
    
    if [ ! -d "$CONFIG_DIR" ]; then
        echo -e "${YELLOW}⚠️  VS Code 配置目录不存在，跳过配置${NC}"
        return
    fi
    
    CONFIG_FILE="$CONFIG_DIR/settings.json"
    
    # 备份现有配置
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${BLUE}📋 已备份现有配置${NC}"
    fi
    
    # 创建或更新配置
    if [ -f "$CONFIG_FILE" ]; then
        # 使用 jq 合并配置（如果安装了 jq）
        if command -v jq &> /dev/null; then
            TEMP_CONFIG=$(mktemp)
            jq --arg path "$PROJECT_DIR/dist/index.js" '
                .["cline.mcpServers"] = {
                    "scaffold-generator": {
                        "command": "node",
                        "args": [$path],
                        "env": {
                            "NODE_ENV": "production"
                        }
                    }
                }
            ' "$CONFIG_FILE" > "$TEMP_CONFIG"
            mv "$TEMP_CONFIG" "$CONFIG_FILE"
        else
            echo -e "${YELLOW}⚠️  jq 未安装，请手动添加 Cline MCP 配置${NC}"
            echo "配置内容："
            echo "{\"cline.mcpServers\": {\"scaffold-generator\": {\"command\": \"node\", \"args\": [\"$PROJECT_DIR/dist/index.js\"], \"env\": {\"NODE_ENV\": \"production\"}}}}"
        fi
    else
        cat > "$CONFIG_FILE" << EOF
{
  "cline.mcpServers": {
    "scaffold-generator": {
      "command": "node",
      "args": ["$PROJECT_DIR/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
    fi
    
    echo -e "${GREEN}✅ VS Code Cline 配置完成: $CONFIG_FILE${NC}"
}

# 测试配置
test_mcp_server() {
    echo -e "${YELLOW}🧪 测试 MCP 服务器...${NC}"
    
    # 创建测试输入
    TEST_INPUT='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
    
    # 测试服务器响应
    if echo "$TEST_INPUT" | timeout 10s node "$PROJECT_DIR/dist/index.js" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP 服务器测试通过${NC}"
    else
        echo -e "${RED}❌ MCP 服务器测试失败${NC}"
        echo "请检查构建是否成功，或手动运行: node $PROJECT_DIR/dist/index.js"
    fi
}

# 显示使用说明
show_usage() {
    echo -e "${BLUE}📖 使用说明${NC}"
    echo "=================================================="
    echo "配置完成后，你可以在支持的工具中使用以下命令："
    echo ""
    echo -e "${GREEN}Cursor / Claude Desktop:${NC}"
    echo "  创建一个 React TypeScript 项目"
    echo "  生成 Vue 3 项目脚手架"
    echo ""
    echo -e "${GREEN}VS Code Cline:${NC}"
    echo "  帮我创建一个 React 项目"
    echo "  使用 vue3-vite-typescript 模板生成项目"
    echo ""
    echo -e "${YELLOW}支持的模板:${NC}"
    echo "  - react-webpack-typescript"
    echo "  - vue3-vite-typescript"
    echo "  - umijs"
    echo "  - electron-vite-vue3"
    echo ""
    echo -e "${BLUE}更多信息请查看: $PROJECT_DIR/MCP_INTEGRATION_GUIDE.md${NC}"
}

# 主函数
main() {
    echo "选择要配置的工具："
    echo "1) 全部配置"
    echo "2) 仅 Cursor"
    echo "3) 仅 Claude Desktop"
    echo "4) 仅 VS Code Cline"
    echo "5) 仅构建项目"
    echo "6) 退出"
    
    read -p "请输入选择 (1-6): " choice
    
    case $choice in
        1)
            check_nodejs
            build_project
            setup_cursor
            setup_claude_desktop
            setup_vscode_cline
            test_mcp_server
            show_usage
            ;;
        2)
            check_nodejs
            build_project
            setup_cursor
            test_mcp_server
            ;;
        3)
            check_nodejs
            build_project
            setup_claude_desktop
            test_mcp_server
            ;;
        4)
            check_nodejs
            build_project
            setup_vscode_cline
            test_mcp_server
            ;;
        5)
            check_nodejs
            build_project
            test_mcp_server
            ;;
        6)
            echo -e "${BLUE}👋 再见！${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选择${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 配置完成！${NC}"
}

# 运行主函数
main