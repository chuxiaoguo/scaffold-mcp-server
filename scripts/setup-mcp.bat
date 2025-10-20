@echo off
setlocal enabledelayedexpansion

:: Scaffold MCP Server Windows 配置脚本

echo.
echo 🚀 Scaffold MCP Server 配置工具 (Windows)
echo ==================================================

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

:: 检查 Node.js
echo 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js ^>= 16.0.0
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 版本检查通过: %NODE_VERSION%

:: 构建项目
echo.
echo 📦 构建 MCP 服务器...
cd /d "%PROJECT_DIR%"

if not exist "package.json" (
    echo ❌ 未找到 package.json 文件
    pause
    exit /b 1
)

call npm install
call npm run build

if not exist "dist\index.js" (
    echo ❌ 构建失败，未找到 dist\index.js
    pause
    exit /b 1
)

echo ✅ 项目构建完成

:: 显示选择菜单
:menu
echo.
echo 选择要配置的工具：
echo 1) 全部配置
echo 2) 仅 Cursor
echo 3) 仅 Claude Desktop
echo 4) 仅 VS Code Cline
echo 5) 仅构建项目
echo 6) 退出

set /p choice="请输入选择 (1-6): "

if "%choice%"=="1" goto setup_all
if "%choice%"=="2" goto setup_cursor
if "%choice%"=="3" goto setup_claude
if "%choice%"=="4" goto setup_vscode
if "%choice%"=="5" goto test_only
if "%choice%"=="6" goto exit
echo ❌ 无效选择
goto menu

:setup_all
call :setup_cursor_func
call :setup_claude_func
call :setup_vscode_func
call :test_mcp
goto success

:setup_cursor
call :setup_cursor_func
call :test_mcp
goto success

:setup_claude
call :setup_claude_func
call :test_mcp
goto success

:setup_vscode
call :setup_vscode_func
call :test_mcp
goto success

:test_only
call :test_mcp
goto success

:: 配置 Cursor
:setup_cursor_func
echo.
echo 🎯 配置 Cursor...
set "CONFIG_DIR=%USERPROFILE%\.cursor"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
set "CONFIG_FILE=%CONFIG_DIR%\mcp_servers.json"

(
echo {
echo   "mcpServers": {
echo     "scaffold-generator": {
echo       "command": "node",
echo       "args": ["%PROJECT_DIR%\dist\index.js"],
echo       "env": {
echo         "NODE_ENV": "production"
echo       },
echo       "description": "Frontend project scaffold generator"
echo     }
echo   }
echo }
) > "%CONFIG_FILE%"

echo ✅ Cursor 配置完成: %CONFIG_FILE%
goto :eof

:: 配置 Claude Desktop
:setup_claude_func
echo.
echo 🤖 配置 Claude Desktop...
set "CONFIG_DIR=%APPDATA%\Claude"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
set "CONFIG_FILE=%CONFIG_DIR%\claude_desktop_config.json"

(
echo {
echo   "mcpServers": {
echo     "scaffold-generator": {
echo       "command": "node",
echo       "args": ["%PROJECT_DIR%\dist\index.js"],
echo       "env": {
echo         "NODE_ENV": "production"
echo       }
echo     }
echo   }
echo }
) > "%CONFIG_FILE%"

echo ✅ Claude Desktop 配置完成: %CONFIG_FILE%
goto :eof

:: 配置 VS Code Cline
:setup_vscode_func
echo.
echo 📝 配置 VS Code Cline...
set "CONFIG_DIR=%APPDATA%\Code\User"
if not exist "%CONFIG_DIR%" (
    echo ⚠️ VS Code 配置目录不存在，跳过配置
    goto :eof
)

set "CONFIG_FILE=%CONFIG_DIR%\settings.json"

:: 备份现有配置
if exist "%CONFIG_FILE%" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set mytime=%%a%%b
    copy "%CONFIG_FILE%" "%CONFIG_FILE%.backup.%mydate%_%mytime%"
    echo 📋 已备份现有配置
)

:: 创建基本配置
(
echo {
echo   "cline.mcpServers": {
echo     "scaffold-generator": {
echo       "command": "node",
echo       "args": ["%PROJECT_DIR%\dist\index.js"],
echo       "env": {
echo         "NODE_ENV": "production"
echo       }
echo     }
echo   }
echo }
) > "%CONFIG_FILE%"

echo ✅ VS Code Cline 配置完成: %CONFIG_FILE%
goto :eof

:: 测试 MCP 服务器
:test_mcp
echo.
echo 🧪 测试 MCP 服务器...
echo {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}} | node "%PROJECT_DIR%\dist\index.js" >nul 2>&1
if errorlevel 1 (
    echo ❌ MCP 服务器测试失败
    echo 请检查构建是否成功，或手动运行: node "%PROJECT_DIR%\dist\index.js"
) else (
    echo ✅ MCP 服务器测试通过
)
goto :eof

:success
echo.
echo 🎉 配置完成！
echo.
echo 📖 使用说明
echo ==================================================
echo 配置完成后，你可以在支持的工具中使用以下命令：
echo.
echo Cursor / Claude Desktop:
echo   创建一个 React TypeScript 项目
echo   生成 Vue 3 项目脚手架
echo.
echo VS Code Cline:
echo   帮我创建一个 React 项目
echo   使用 vue3-vite-typescript 模板生成项目
echo.
echo 支持的模板:
echo   - react-webpack-typescript
echo   - vue3-vite-typescript
echo   - umijs
echo   - electron-vite-vue3
echo.
echo 更多信息请查看: %PROJECT_DIR%\MCP_INTEGRATION_GUIDE.md
pause
exit /b 0

:exit
echo 👋 再见！
exit /b 0