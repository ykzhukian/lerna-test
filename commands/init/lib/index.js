// commands/init
"use strict";

const Command = require("@lerna-test-cool/command");

class InitCommand extends Command {}

function init(args) {
  return new InitCommand(args);
}

module.exports = init;
