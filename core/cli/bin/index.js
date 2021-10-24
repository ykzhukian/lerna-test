#!/usr/bin/env node

const importLocal = require('import-local')
const npmlog = require('npmlog')

if (importLocal(__filename)) {
  npmlog.info('cli', '正在使用本地版本')
} else {
  require('../lib')()
}

