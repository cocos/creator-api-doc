const { basename, join } = require('path');
const { statSync, readdirSync } = require('fs-extra');

const recursive = (file, handle) => {
  if (!file) return;
  const stat = statSync(file);
  const filename = basename(file);
  if (stat.isDirectory()) {
    const list = readdirSync(file);
    list.forEach((name) => {
      recursive(join(file, name), handle);
    });
  }
  // 忽略 meta 文件
  else if (filename === 'package-lock.json') {
    handle(file);
  }
};

module.exports = {
  recursive,
};
