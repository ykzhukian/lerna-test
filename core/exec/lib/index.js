"use strict";

const path = require("path");
const Package = require("@lerna-test-cool/package");
const log = require("@lerna-test-cool/log");

// 命令对应的包的 map
const SETTINGS = {
  init: "@lerna-test-cool/utils",
  init1: "@lerna-test-cool/init1",
  // ...
};

const CATCH_DIR = "dependencies";

async function exec() {
  const homePath = process.env.CLI_HOME_PATH;
  // 用于调试的路径
  let targetPath = process.env.CLI_TARGET_PATH;
  let storeDir = "";
  let pkg;
  // arguments
  // 第一位是 projectName  第二项是关于子command的option  第三项是子command实例
  // 视频上是从command实例上拿option
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  log.verbose(cmdName);
  const packageName = SETTINGS[cmdName];
  // const packageVersion = "0.1.4";
  // const packageVersion = '*'
  const packageVersion = 'latest'

  if (!targetPath) {
    targetPath = path.resolve(homePath, CATCH_DIR);
    storeDir = path.resolve(homePath, "node_modules");
    log.verbose("targetPath", targetPath);
    log.verbose("storeDir", storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      name: packageName,
      version: packageVersion,
    });
    if (await pkg.exists()) {
      // 更新包
      await pkg.upDate();
    } else {
      // 安装包
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      name: packageName,
      version: packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    require(rootFile).apply(null, arguments);
  }
}

module.exports = exec;
