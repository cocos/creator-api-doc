const { recursive } = require('./util');
const { existsSync, statSync, readJSON, writeJSON } = require('fs-extra');

const enginePath = process.argv[2];

console.log(`enginePath: ${enginePath}`);

if (!enginePath) {
    process.exit(-1);
}

const FOLDER_DIR = enginePath;
const MATCH_REG =
  /^https?:\/\/registry\.npm\.taobao\.org\/((?:(?:@\w+?\/)?[^\/])*?)\//;
const lockPathList = []; // 存放package.log文件路径

// 遍历查询所有的.lock文件
const queryPackageLockFile = () => {
  recursive(FOLDER_DIR, (file) => {
    if (!file.includes('node_modules')) {
      lockPathList.push(file);
    }
  });
};

// 获取网上对应的依赖的信息
const fetchNpmPackageInfo = async (name, version) => {
  const result = await fetch(
    `https://registry.npmjs.com/${name}/${version}`,
  );
  if (result.status === 200) {
    const data = await result.json();
    if (data) return data.dist;

    return undefined;
  }

  return undefined;
};

const replacePackageLockFile = async (
  packageLockJsonFile,
  packageKey = 'packages',
) => {
  if (!existsSync(packageLockJsonFile)) return false;
  const stat = statSync(packageLockJsonFile);
  if (!stat.isFile()) return false;

  const json = await readJSON(packageLockJsonFile);

  if (!json[packageKey]) return true;
  const packageKeys = Object.keys(json[packageKey]);
  let changed = false;
  let count = 0;
  for (let i = 0, len = packageKeys.length; i < len; i++) {
    const key = packageKeys[i];
    const target = json[packageKey][key];
    if (!target.resolved) continue;

    const regList = target.resolved.match(MATCH_REG);
    if (regList && regList[1]) {
      const value = json[packageKey][key];
      const { version } = value;
      const dist = await fetchNpmPackageInfo(regList[1], version);
      if (!dist) {
        console.log(
          `【Error: 服务端未找到依赖 ${regList[1]}, 版本 ${version}】`,
        );
        continue;
      }

      if (
        !value ||
        !value['integrity'] ||
        value['integrity'] !== dist.integrity
      ) {
        json[packageKey][key]['resolved'] = dist.tarball;
        json[packageKey][key]['integrity'] = dist.integrity;
        count++;
        changed = true;
      }
    }
  }

  if (changed) {
    await writeJSON(packageLockJsonFile, json, { spaces: 2 });
    console.log(`【Info: ${packageLockJsonFile},修改${count}个依赖,】`);
  }
  return true;
};

const main = async () => {
  console.log('【Info: 扫描package-lock.json文件】');
  queryPackageLockFile();
  console.log(`【Info: 扫描完成, 总共有${lockPathList.length}个文件】`);
  console.log(lockPathList);

  for (let i = 0, len = lockPathList.length; i < len; i++) {
    // 匹配新版的package-lock.json文件
    await replacePackageLockFile(lockPathList[i]);

    // 匹配老版的package-lock.json文件
    await replacePackageLockFile(lockPathList[i], 'dependencies');
  }
};

main();
