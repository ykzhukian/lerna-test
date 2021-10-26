'use strict';

module.exports = core;

const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const path = require('path')

const pkg = require('../package.json')
const log = require('@lerna-test-cool/log')
const constant = require('./const')

let args

function core() {
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgs()
        log.verbose('debug mode is on...')
        checkEnv()
        checkGlobalUpdate()
    } catch (e) {
        log.error(e.message)
    }
}

function checkPkgVersion () {
    log.info(pkg.version)
}

function checkNodeVersion () {
    const currentVersion = process.version
    const lowestVersion = constant.LOWEST_NODE_VERSION
    
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`需要安装 v${lowestVersion} 以上版本的 node`))
    }
}

function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()
    // console.log('uid', process.geteuid())
}

function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在！'))
    }
}

function checkInputArgs() {
    const minimist = require('minimist')
    args = minimist(process.argv.slice(2))
    console.log('args', args);
    checkArgs()
}

function checkArgs() {
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
}

function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath,
        })
    }
    createDefaultConfig()
    log.verbose('环境变量 SOMETHING', process.env.SOMETHING)
}

function createDefaultConfig() {
    if (!process.env.SOMETHING) {
        process.env.SOMETHING = constant.SOMETHING
    }
}

async function checkGlobalUpdate() {
    // 获取当前版本号和模块名
    const { version: currentVersion, name: npmName } = pkg
    // 调用NPM API
    const { getNpmSemverVersion } = require('@lerna-test-cool/get-npm-info')
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow('请升级版本，当前版本：', currentVersion, '最新版本：', lastVersion))
    }
}
