const pck = require('./package.json');

const plugins = [
  [ require.resolve('babel-plugin-module-resolver'), { alias: pck._moduleAliases } ]
];

module.exports = { plugins, retainLines: true };
