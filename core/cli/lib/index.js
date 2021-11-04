"use strict";

const path = require("path");
const commander = require("commander");
const dotenv = require("dotenv");
const semver = require("semver");
const colors = require("colors");
const rootCheck = require("root-check");
const userHome = require("user-home");
// pathExists使用4.0.0  5.0.0是ES模块
const pathExists = require("path-exists").sync;
const pkg = require("../package.json");
const constant = require("./const");
const log = require("@lerna-test-cool/log");
const { getNpmSemverVersion } = require("@lerna-test-cool/get-npm-info");
const exec = require('@lerna-test-cool/exec');

let args;
const program = new commander.Command();

function core() {
  try {
    // 检查工作
    prepare();
    // 命令注册
    registerCommand();
  } catch (e) {
    log.error(e.message);
    if (program.debug) {
      console.log(e);
    }
  }
}

// 初始化命令行参数显示
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .usage("<command> [options]")
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "")
    .option("-d, --debug", "是否开启调试模式?", false);

  // 注册命令
  program
    .command("init [projectName]")
    .description("初始化")
    .option("-f, --force", "是否强制初始化项目")
    .action(exec);

  program.on("option:debug", () => {
    // commander7.0后从opts方法里获取参数
    // https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md
    const debug = program.opts().debug;
    if (debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 对未知命令监听
  program.on("command:*", (obj) => {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    log.error(`未知命令：${obj.join(",")}`);
    if (availableCommands.length > 0) {
      log.info(`可用命令：${availableCommands.join(",")}`);
    }
  });

  program.on("option:targetPath", () => {
    // commander7.0后从opts方法里获取参数
    // https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md
    //  process.env.CLI_TARGET_PATH = program.targetPath
    process.env.CLI_TARGET_PATH = program.opts().targetPath;
  });

  program.parse(process.argv);
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

async function prepare() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
}

// 检查当前包的版本，与npm上版本比较
async function checkGlobalUpdate() {
  // 获取当前版本号和模块名
  const { version: currentVersion, name: npmName } = pkg;
  // 调用NPM API
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        "请升级版本，当前版本：",
        currentVersion,
        "最新版本：",
        lastVersion
      )
    );
  }
}

// 读取环境变量
function checkEnv() {
  const dotenvPath = path.resolve(__dirname, '../../../', ".env");
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
}

// 创建默认的环境变量配置
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"));
  }
}

// 检查是否是root用户
function checkRoot() {
  rootCheck();
}

// 检查node版本
function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`请安装${lowestVersion}版本及以上node`));
  }
}

// 打印当前版本
function checkPkgVersion() {
  log.info("pkg.version", pkg.version);
}

module.exports = core;
