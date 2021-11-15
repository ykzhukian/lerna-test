"use strict";

const Command = require("@lerna-test-cool/command");
const semver = require("semver");
const log = require('@lerna-test-cool/log');
const inquirer = require('inquirer');
// const { fetchTemplate } = require('@lerna-test-cool/utils');
const fs = require('fs');
const fse = require('fs-extra');
const TYPE_PROJECT = 1;
const TYPE_COMPONENT = 2;

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }
 async exec() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare();
      // 2. 下载模板
      // 3. 安装模板
    } catch (error) {
      log.error(error.message)
    }
  }
  async prepare() {
    const localPath = process.cwd();
    let ifContinue = false
    if(!this.force){
      if(!this.isDirEmpty(localPath)){
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          message: '当前目录不为空，是否要清空?',
          name: 'ifContinue',
          default: false
        })).ifContinue
      } else {
        const projectInfo = await this.getProjectInfo()
        console.log('projectInfo', projectInfo);
      }
    }
    if(ifContinue || this.force){
      const { deleteConfirm } = await inquirer.prompt({
        type: 'confirm',
        message: '当前目录不为空，确认清空吗?',
        name: 'deleteConfirm',
        default: false
      })
      if(deleteConfirm) {
        fse.emptyDirSync(localPath)
      }
    }
    // 1.判断当前目录是否为空
    // 2.是否强制更新
    // 3.选择项目类型（项目或组件）
    // 4.获取项目基本信息
  }

  async downloadTemplate (template) {
    
  }

  async getProjectInfo () {
    const { type } = await inquirer.prompt({
      type:'list',
      name: 'type',
      message: '请选择要创建项目类型',
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    log.verbose(type)
    let projectInfo = {}
    if(type === TYPE_PROJECT) {
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: '',
          validate: function (v) {
            const done = this.async();
            // Do async stuff
            setTimeout(function() {
              if (! /^[a-zA-Z]+([-][a-zA-Z0-9]*|[_][a-zA-Z0-9]*|[a-zA-Z0-9])$/.test(v)) {
                // Pass the return value in the done callback
                done('请输入合法的项目名');
                return;
              }
              // Pass the return value in the done callback
              done(null, true);
            }, 0);
          },
          filter: (v) => {
            return v
          }
        },
        {
          type: 'input',
          name: 'version',
          message: '请输入项目版本',
          default: '1.0.0',
          validate: function (v) {
            return !!semver.valid(v)
          },
          filter: (v) => {
            if(!!semver.valid(v)){
              return semver.valid(v)
            }else{
              return v
            }
          }
        },
      ])
      projectInfo = {
        type,
        ...project
      }
      return projectInfo
    } else if (type === TYPE_COMPONENT) {

    }
  }

  isDirEmpty (path) {
    let fileList = fs.readdirSync(path);
    fileList = fileList.filter(file => (
        !file.startsWith('.') && !['node_modules'].includes(file)
    ))
    return !fileList || fileList.length <= 0
  }
}

function init(args) {
  return new InitCommand(args);
}

module.exports = init;
