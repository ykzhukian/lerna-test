"use strict";
// 如果commander包不是新的 那么是没有options这个参数的，options的内容全部混入的command
function init(projectName, options, command) {
  console.log("init", projectName, options);
}
module.exports = init;
