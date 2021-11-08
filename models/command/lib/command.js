// models/command
"use strict";
const semver = require("semver");
const colors = require("colors");
const log = require("@lerna-test-cool/log");

const LOWEST_NODE_VERSION = "v12.0.0";

class Command {
  constructor(argv) {
    console.log("this is Command");
    if (!argv) {
      throw Error("参数不能为空！");
    }
    if (!Array.isArray(argv)) {
      throw Error("参数必须为数组！");
    }
    if (argv.length < 1) {
      throw Error("参数列表不得为空");
    }
    this._argv = argv;
    let runner = new Promise(() => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch((error) => log.error(error.message));
    });
  }

  // 检查node版本
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`请安装${lowestVersion}版本及以上node`));
    }
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv[this._argv.slice(0, this._argv.length - 1)];
  }

  init() {
    throw Error("init方法必须实现！");
  }
  exec() {
    throw Error("exec方法必须实现！");
  }
}

module.exports = Command;