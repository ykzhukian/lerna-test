#!/usr/bin/env node

const importLocal = require('import-local')
const npmlog = require('npmlog')
const pkg = require('../package.json')

// if (importLocal(__filename)) {
//   npmlog.info('cli', '正在使用本地版本')
// } else {
//   require('../lib')()
// }

const commander = require('commander')

const program = new commander.Command()

// 初始化
program
  .name(Object.keys(pkg.bin)[0])
  .usage('<command> [options]')
  .version(pkg.version)
  .option('-d, --debug', '是否开启调试模式', false)
  .option('-e, --envName <envName>', '获取环境变量名称')

// 注册命令
const add = program.command('add <name> [name2]')
add
  .description('添加')
  .option('-f, --force', '是否强制添加')
  .action((name, name2, cmdObj) => {
    console.log('do add', name, name2, cmdObj.force)
  })


// addCommand 注册命令
const server = new commander.Command('server')
server
  .command('start [port]')
  .description('开启服务')
  .action((port) => {
    console.log('server listening  on port:', port)
  })

server
  .command('stop')
  .description('停止服务')
  .action(() => {
    console.log('server stop')
  })

program.addCommand(server)


// 强制入参
program
  .arguments('<cmd> [options]')
  .description('test command', {
    cmd: 'command to run',
    options: 'options for command'
  })
  .action((cmd, option) => {
    console.log('cmd, option', cmd, option);
  })

program.helpInformation = function() {
  return '123'
}

program
  .parse(process.argv)

console.log('program.debug', program.opts());
