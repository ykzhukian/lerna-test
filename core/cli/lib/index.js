'use strict';

module.exports = core;

const pkg = require('../package.json')
const log = require('@lerna-test-cool/log')

function core() {
    checkPkgVersion()
}

function checkPkgVersion () {
    log.info(pkg.version)
}
