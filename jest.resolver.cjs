const { resolve } = require('path');
const { existsSync } = require('fs');

module.exports = (request, options) => {
  // 如果请求以 .js 结尾，尝试解析为 .ts 文件
  if (request.endsWith('.js')) {
    const tsRequest = request.replace(/\.js$/, '.ts');
    const tsPath = resolve(options.basedir, tsRequest);
    
    if (existsSync(tsPath)) {
      return tsPath;
    }
  }
  
  // 默认解析
  return options.defaultResolver(request, options);
};