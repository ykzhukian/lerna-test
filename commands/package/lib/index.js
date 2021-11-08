// models/package
"use strict";
const { isObject } = require("@lerna-test-cool/utils");
// package
const path = require("path");
// 注意安装5.0.0版本 6.0.1 是ES模块
const pkgDir = require('pkg-dir').sync
const formatPath = require('@lerna-test-cool/format-path')
const pathExists = require('path-exists')
const fse = require("fs-extra");
const npminstall = require("npminstall");
const { getNpmLatestVersion, getDefaultRegistry } = require('@lerna-test-cool/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package类的options参数不能为空!");
    }

    if (!isObject(options)) {
      throw new Error("Package类的options参数必须为对象!");
    }

    console.log("this is package");
    // package路径
    this.targetPath = options.targetPath;
    // package缓存路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.name;
    // package的版本
    this.packageVersion = options.version;

    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  // 缓存文件的前缀
  async prepare() {
    // 缓存目录生成
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
  }

  // 返回当前命令需要安装的版本缓存路径
  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
  }

  // 判断当前Package是否存在，有缓存则检查缓存内是否存在这个包，没有则查看是否有直接指向对应的包的地址；外层虽然对 targetPath做了判断，但是Package是公共类，其他地方也会调用，所以需要判断targetPath。
  async exists() {
    console.log('exists')
    if (this.storeDir) {
      await this.prepare()
      return pathExists(this.cacheFilePath)
    }
    // 当引用本地的包时 没有缓存地址 直接检查本地包
    else {
      console.log('exists', this.targetPath)
      return pathExists(this.targetPath)
    }
  }

  // 安装Package
  async install() {
    console.log('install')
    await this.prepare()
    await npminstall({
      root: this.targetPath,// 安装的包需要放的位置
      storeDir: this.storeDir,// 包的缓存
      registry: getDefaultRegistry(),// 下载域名
      pkgs: [
        {
          name: this.packageName, version: this.packageVersion
        }
      ]// 需要安装的包的信息
    }).catch((e) => {
      console.log(e)
    })
  }

  // 升级Package
  async upDate() {
    console.log("upDate");
  }

  _getRootFilePath(targetPath) {
    // 1. 获取package.json所在目录
    // 3. 寻找main 或 lib
    // 4. 路径的兼容[macOS/windows]
    const dir = pkgDir(targetPath)
    if (dir) {
      // 2. 读取package.json
      const pkgFile = require(path.resolve(dir, 'package.json'))
      if (pkgFile && (pkgFile.main)) {
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
    return null
  }

  // 获取入口文件
  getRootFilePath() {
    // 使用缓存
    if (this.storeDir) {
      return this._getRootFilePath(this.cacheFilePath)
    } else {
      return this._getRootFilePath(this.targetPath)
    }
  }
}

module.exports = Package;
