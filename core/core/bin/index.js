#!/usr/bin/env node

const importLocal = require('import-local')

if (importLocal(__filename)) {
  require('npmlog').info('cli', '正在使用本地版本')
} else {
  require('../lib')(process.argv.slice(2))
}

const utils = require('@lerna-test-cool/utils')
console.log('greeting')
utils()