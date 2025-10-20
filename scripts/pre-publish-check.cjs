#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 检查项目
class PrePublishChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.packageJson = null;
  }

  // 加载package.json
  loadPackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      this.packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      success('package.json 加载成功');
    } catch (err) {
      this.errors.push('无法读取 package.json');
      return false;
    }
    return true;
  }

  // 检查必要字段
  checkRequiredFields() {
    info('检查package.json必要字段...');
    
    const requiredFields = ['name', 'version', 'description', 'main', 'author'];
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!this.packageJson[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      this.errors.push(`package.json缺少必要字段: ${missingFields.join(', ')}`);
    } else {
      success('package.json必要字段检查通过');
    }

    // 检查可选但推荐的字段
    const recommendedFields = ['keywords', 'repository', 'license', 'homepage'];
    const missingRecommended = [];

    recommendedFields.forEach(field => {
      if (!this.packageJson[field]) {
        missingRecommended.push(field);
      }
    });

    if (missingRecommended.length > 0) {
      this.warnings.push(`建议添加字段: ${missingRecommended.join(', ')}`);
    }
  }

  // 检查版本格式
  checkVersionFormat() {
    info('检查版本格式...');
    
    const version = this.packageJson.version;
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    
    if (!semverRegex.test(version)) {
      this.errors.push(`版本格式不正确: ${version}，应该遵循语义化版本规范`);
    } else {
      success(`版本格式正确: ${version}`);
    }
  }

  // 检查文件存在性
  checkFiles() {
    info('检查重要文件...');
    
    const requiredFiles = ['README.md'];
    const recommendedFiles = ['LICENSE', 'CHANGELOG.md', '.gitignore'];
    
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.errors.push(`缺少必要文件: ${file}`);
      } else {
        success(`找到文件: ${file}`);
      }
    });

    recommendedFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.warnings.push(`建议添加文件: ${file}`);
      }
    });

    // 检查main字段指向的文件
    if (this.packageJson.main) {
      const mainFile = this.packageJson.main;
      if (!fs.existsSync(mainFile)) {
        this.errors.push(`main字段指向的文件不存在: ${mainFile}`);
      } else {
        success(`main文件存在: ${mainFile}`);
      }
    }
  }

  // 检查Git状态
  checkGitStatus() {
    info('检查Git状态...');
    
    try {
      // 检查是否在Git仓库中
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      
      // 检查是否有未提交的更改
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        this.warnings.push('存在未提交的更改');
        console.log('未提交的文件:');
        console.log(status);
      } else {
        success('Git状态干净');
      }

      // 检查远程仓库
      try {
        const remotes = execSync('git remote -v', { encoding: 'utf8' });
        if (remotes.trim()) {
          success('已配置远程仓库');
        } else {
          this.warnings.push('未配置远程仓库');
        }
      } catch {
        this.warnings.push('无法检查远程仓库');
      }

    } catch {
      this.warnings.push('不在Git仓库中或Git未安装');
    }
  }

  // 检查npm配置
  checkNpmConfig() {
    info('检查npm配置...');
    
    try {
      // 检查npm登录状态
      const whoami = execSync('npm whoami', { encoding: 'utf8', stdio: 'pipe' });
      success(`npm已登录: ${whoami.trim()}`);
    } catch {
      this.errors.push('npm未登录，请运行 npm login');
    }

    // 检查npm registry
    try {
      const registry = execSync('npm config get registry', { encoding: 'utf8' });
      info(`npm registry: ${registry.trim()}`);
      
      if (!registry.includes('npmjs.org')) {
        this.warnings.push('当前registry不是官方npm registry');
      }
    } catch {
      this.warnings.push('无法获取npm registry配置');
    }
  }

  // 检查依赖
  checkDependencies() {
    info('检查依赖...');
    
    try {
      // 检查是否有安全漏洞
      const auditResult = execSync('npm audit --audit-level=high', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      success('依赖安全检查通过');
    } catch (err) {
      this.warnings.push('发现依赖安全问题，建议运行 npm audit fix');
    }

    // 检查过时的依赖
    try {
      execSync('npm outdated', { stdio: 'ignore' });
      success('所有依赖都是最新的');
    } catch {
      this.warnings.push('存在过时的依赖，建议运行 npm outdated 查看');
    }
  }

  // 检查构建
  checkBuild() {
    info('检查构建配置...');
    
    if (this.packageJson.scripts && this.packageJson.scripts.build) {
      success('找到构建脚本');
      
      // 检查dist目录
      if (fs.existsSync('dist')) {
        success('dist目录存在');
      } else {
        this.warnings.push('dist目录不存在，可能需要先运行构建');
      }
    } else {
      this.warnings.push('未找到构建脚本');
    }
  }

  // 检查测试
  checkTests() {
    info('检查测试配置...');
    
    if (this.packageJson.scripts && this.packageJson.scripts.test) {
      success('找到测试脚本');
      
      // 检查测试文件
      const testDirs = ['test', 'tests', '__tests__', 'src/tests'];
      const hasTests = testDirs.some(dir => fs.existsSync(dir));
      
      if (hasTests) {
        success('找到测试文件');
      } else {
        this.warnings.push('未找到测试文件目录');
      }
    } else {
      this.warnings.push('未配置测试脚本');
    }
  }

  // 运行所有检查
  async runAllChecks() {
    log('\n🔍 开始发布前检查\n', 'blue');

    if (!this.loadPackageJson()) {
      return false;
    }

    this.checkRequiredFields();
    this.checkVersionFormat();
    this.checkFiles();
    this.checkGitStatus();
    this.checkNpmConfig();
    this.checkDependencies();
    this.checkBuild();
    this.checkTests();

    // 输出结果
    log('\n📋 检查结果:', 'blue');
    
    if (this.errors.length > 0) {
      log('\n❌ 错误 (必须修复):', 'red');
      this.errors.forEach(err => error(`  • ${err}`));
    }

    if (this.warnings.length > 0) {
      log('\n⚠️  警告 (建议修复):', 'yellow');
      this.warnings.forEach(warn => warning(`  • ${warn}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      success('\n🎉 所有检查通过，可以发布！');
      return true;
    } else if (this.errors.length === 0) {
      warning('\n✅ 基本检查通过，但有一些建议改进的地方');
      return true;
    } else {
      error('\n❌ 发现错误，请修复后再发布');
      return false;
    }
  }
}

// 主函数
async function main() {
  const checker = new PrePublishChecker();
  const success = await checker.runAllChecks();
  
  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = PrePublishChecker;