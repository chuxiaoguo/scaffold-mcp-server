#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
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

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 版本管理器
class VersionManager {
  constructor() {
    this.packagePath = path.join(process.cwd(), 'package.json');
    this.changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    this.packageJson = null;
  }

  // 加载package.json
  loadPackageJson() {
    try {
      this.packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      return true;
    } catch (err) {
      error('无法读取 package.json');
      return false;
    }
  }

  // 获取当前版本
  getCurrentVersion() {
    return this.packageJson.version;
  }

  // 计算新版本
  calculateNewVersion(versionType, currentVersion) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (versionType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error(`不支持的版本类型: ${versionType}`);
    }
  }

  // 更新package.json版本
  updatePackageVersion(newVersion) {
    this.packageJson.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(this.packageJson, null, 2) + '\n');
    success(`版本已更新到 ${newVersion}`);
  }

  // 获取Git提交信息
  getGitCommits(since = null) {
    try {
      let command = 'git log --oneline --no-merges';
      if (since) {
        command += ` ${since}..HEAD`;
      } else {
        command += ' -20'; // 最近20个提交
      }
      
      const output = execSync(command, { encoding: 'utf8' });
      return output.split('\n').filter(line => line.trim());
    } catch (err) {
      warning('无法获取Git提交信息');
      return [];
    }
  }

  // 分类提交信息
  categorizeCommits(commits) {
    const categories = {
      features: [],
      fixes: [],
      docs: [],
      style: [],
      refactor: [],
      test: [],
      chore: [],
      breaking: [],
      other: []
    };

    commits.forEach(commit => {
      const message = commit.toLowerCase();
      
      if (message.includes('breaking') || message.includes('!:')) {
        categories.breaking.push(commit);
      } else if (message.startsWith('feat') || message.includes('feature')) {
        categories.features.push(commit);
      } else if (message.startsWith('fix') || message.includes('bug')) {
        categories.fixes.push(commit);
      } else if (message.startsWith('docs') || message.includes('documentation')) {
        categories.docs.push(commit);
      } else if (message.startsWith('style') || message.includes('formatting')) {
        categories.style.push(commit);
      } else if (message.startsWith('refactor')) {
        categories.refactor.push(commit);
      } else if (message.startsWith('test')) {
        categories.test.push(commit);
      } else if (message.startsWith('chore')) {
        categories.chore.push(commit);
      } else {
        categories.other.push(commit);
      }
    });

    return categories;
  }

  // 生成changelog条目
  generateChangelogEntry(version, categories) {
    const date = new Date().toISOString().split('T')[0];
    let entry = `## [${version}] - ${date}\n\n`;

    if (categories.breaking.length > 0) {
      entry += '### ⚠️ BREAKING CHANGES\n\n';
      categories.breaking.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`; // 移除commit hash
      });
      entry += '\n';
    }

    if (categories.features.length > 0) {
      entry += '### ✨ Features\n\n';
      categories.features.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    if (categories.fixes.length > 0) {
      entry += '### 🐛 Bug Fixes\n\n';
      categories.fixes.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    if (categories.docs.length > 0) {
      entry += '### 📚 Documentation\n\n';
      categories.docs.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    if (categories.refactor.length > 0) {
      entry += '### ♻️ Code Refactoring\n\n';
      categories.refactor.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    if (categories.test.length > 0) {
      entry += '### 🧪 Tests\n\n';
      categories.test.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    if (categories.chore.length > 0) {
      entry += '### 🔧 Chore\n\n';
      categories.chore.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    if (categories.other.length > 0) {
      entry += '### 📦 Other Changes\n\n';
      categories.other.forEach(commit => {
        entry += `- ${commit.substring(8)}\n`;
      });
      entry += '\n';
    }

    return entry;
  }

  // 更新changelog
  updateChangelog(newEntry) {
    let changelog = '';
    
    if (fs.existsSync(this.changelogPath)) {
      changelog = fs.readFileSync(this.changelogPath, 'utf8');
    } else {
      changelog = '# Changelog\n\n所有重要的项目更改都会记录在此文件中。\n\n';
    }

    // 在第一个版本条目之前插入新条目
    const lines = changelog.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('## ['));
    
    if (insertIndex !== -1) {
      lines.splice(insertIndex, 0, ...newEntry.split('\n'), '');
    } else {
      lines.push('', ...newEntry.split('\n'));
    }

    fs.writeFileSync(this.changelogPath, lines.join('\n'));
    success('CHANGELOG.md 已更新');
  }

  // 获取最后一个版本标签
  getLastVersionTag() {
    try {
      const tags = execSync('git tag -l --sort=-version:refname', { encoding: 'utf8' });
      const versionTags = tags.split('\n').filter(tag => tag.match(/^v?\d+\.\d+\.\d+/));
      return versionTags[0] || null;
    } catch {
      return null;
    }
  }

  // 交互式选择版本类型
  async selectVersionType() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('\n请选择版本更新类型:');
      console.log('1. patch (1.0.0 -> 1.0.1) - 修复bug');
      console.log('2. minor (1.0.0 -> 1.1.0) - 新功能');
      console.log('3. major (1.0.0 -> 2.0.0) - 破坏性更改');
      
      rl.question('\n请输入选择 (1-3): ', (answer) => {
        rl.close();
        
        switch (answer) {
          case '1':
            resolve('patch');
            break;
          case '2':
            resolve('minor');
            break;
          case '3':
            resolve('major');
            break;
          default:
            warning('无效选择，默认使用 patch');
            resolve('patch');
        }
      });
    });
  }

  // 预览changelog
  async previewChangelog(version, entry) {
    console.log('\n📋 Changelog 预览:');
    console.log('─'.repeat(50));
    console.log(entry);
    console.log('─'.repeat(50));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n是否继续? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  // 主要的版本管理流程
  async manageVersion(versionType = null) {
    log('\n📦 版本管理器\n', 'magenta');

    if (!this.loadPackageJson()) {
      return false;
    }

    const currentVersion = this.getCurrentVersion();
    info(`当前版本: ${currentVersion}`);

    // 如果没有指定版本类型，交互式选择
    if (!versionType) {
      versionType = await this.selectVersionType();
    }

    const newVersion = this.calculateNewVersion(versionType, currentVersion);
    info(`新版本: ${newVersion}`);

    // 获取提交信息
    const lastTag = this.getLastVersionTag();
    const commits = this.getGitCommits(lastTag);
    
    if (commits.length === 0) {
      warning('没有找到新的提交');
      return false;
    }

    info(`找到 ${commits.length} 个提交`);

    // 分类提交
    const categories = this.categorizeCommits(commits);

    // 生成changelog条目
    const changelogEntry = this.generateChangelogEntry(newVersion, categories);

    // 预览changelog
    const shouldContinue = await this.previewChangelog(newVersion, changelogEntry);
    if (!shouldContinue) {
      warning('操作已取消');
      return false;
    }

    // 更新版本和changelog
    this.updatePackageVersion(newVersion);
    this.updateChangelog(changelogEntry);

    success(`版本管理完成: ${currentVersion} -> ${newVersion}`);
    return true;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0]; // patch, minor, major

  const manager = new VersionManager();
  const success = await manager.manageVersion(versionType);
  
  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = VersionManager;