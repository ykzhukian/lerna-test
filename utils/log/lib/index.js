'use strict';

// module.exports = index;

const log = require('npmlog')

log.level = process.env.LOG_LEVEL || 'info'
log.heading = 'lerna-test'
log.headingStyle = { fg: 'black', bg: 'yellow' }
log.addLevel('success', 2000, { fg: 'green', bold: true })


// function index() {
//     log.success('cli', 'test')
// }

module.exports = log;
