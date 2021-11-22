"use strict";

const Command = require("@lerna-test-cool/command");
const Package = require("@lerna-test-cool/package");

const userHome = require('user-home');

const semver = require("semver");
const log = require('@lerna-test-cool/log');
const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const axios = require('axios');
const path = require('path')

const cp = require('child_process');
const glob = require('glob');
const ejs = require('ejs');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';

const getTemplates = () => {
  return axios.get('https://api2.bmob.cn/1/classes/templates', {
    headers: {
      'X-Bmob-Application-Id': '8d3fb9539f14099df886a055e6216a91',
      'X-Bmob-REST-API-Key': '5d65b4e7b70b9a06a88260d51a23626c',
      'Content-Type': 'application/json',
    }
  })
}

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
      if (projectInfo) {
        log.verbose('projectInfo', projectInfo)
        // 2. 下载模板
        this.projectInfo = projectInfo;
        await this.downloadTemplate();
        // 3. 安装模板
        await this.installTemplate();
      }
    } catch (error) {
      log.error(error.message)
    }
  }

  async downloadTemplate (template) {
    // 1. 通过项目模板api获取项目模板信息
    // 2. 通过npm存储项目模板
    // 3. 模板信息存到数据库
    // 4. 实现api
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(item => item.npmName === projectTemplate);
    this.templateInfo = templateInfo;
    // Package
    const targetPath = path.resolve(userHome, '.lerna-test-cool', 'template');
    const storeDir = path.resolve(userHome, '.lerna-test-cool', 'template', 'node_modules');
    const templateNpm = new Package({
      targetPath,
      storeDir,
      name: templateInfo.npmName,
      version: templateInfo.version,
    })
    if (!await templateNpm.exists()) {
      await templateNpm.install();
    } else {
      await templateNpm.upDate();
    }
    this.templateNpm = templateNpm;
  }

  async installTemplate () {
    console.log('this.installTemplate', this.templateInfo);
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 默认安装
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        // 自定义安装
        await this.installCustomTemplate();
      }
    } else {
      throw new Error('模板信息不存在')
    }
  }

  ejsRender(ignore) {
    const dir = process.cwd();
    const projectInfo = this.projectInfo;
    return new Promise((resolve, reject) => {
      glob('**', {
        cwd: dir,
        ignore,
        nodir: true,
      }, (err, files) => {
        if (err) {
          reject(err)
        }
        Promise.all(files.map(file => {
          const filePath = path.join(dir, file);
          return new Promise((resolve1, reject1) => {
            ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
              if (err) {
                reject1(err);
              } else {
                fse.writeFileSync(filePath, result);
                resolve1(result);
              }
            })
          })
        })).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        })
      })
    })
  }

  async installNormalTemplate() {
    console.log('this.templateNpm.cacheFilePath', this.templateNpm.cacheFilePath);
    const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
    // const templatePath = path.resolve(this.templateNpm.cacheFilePath);
    const targetPath = process.cwd();
    fse.ensureDirSync(templatePath);
    fse.ensureDirSync(targetPath);
    fse.copySync(templatePath, targetPath);
    log.success('模板安装成功');
    
    const ignore = ['node_modules/**', ...this.templateInfo.ignore];
    await this.ejsRender(ignore);

    return
    // 依赖安装
    const { installCommand, startCommand } = this.templateInfo;
    if (installCommand) {
      const cmds = installCommand.split(' ');
      const cmd = cmds[0];
      const args = cmds.slice(1)
      console.log(cmd, args)
      const install = cp.spawn(cmd, args, {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      install.on("exit", (e) => {
        log.success("依赖安装成功");
      });
    }
    // 启动命令
  }

  async installCustomTemplate() {
    const rootFile = this.templateNpm.getRootFilePath();
    if (fs.existsSync(rootFile)) {
      log.notice('开始执行自定义模板');
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
      const options = {
        ...this.templateInfo,
        ...this.projectInfo,
        sourcePath: templatePath,
        targetPath: process.cwd(),
      };
      const code = `require('${rootFile}')(${JSON.stringify(options)})`;
      log.verbose('code', code);
      const install = cp.spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      install.on("exit", (e) => {
        log.success("自定义模板安装成功");
      });
    }
  }

  async prepare() {
    // 判断项目模板是否存在
    const { data } = await getTemplates()
    const template = data.results;
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在')
    }
    this.template = template;

    // 判断当前目录为空
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

        if (ifContinue) {
          return this.getProjectInfo()
        }
      } else {
        return this.getProjectInfo()
      }
    }
    if(ifContinue || this.force) {
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
    this.template = this.template.filter(template => template.tag.includes(type))
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
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择模板',
          choices: this.template.map(item => ({ value: item.npmName, name: item.name })),
        },
      ])
      projectInfo = {
        type,
        className: require('kebab-case')(project.projectName),
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
