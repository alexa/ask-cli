const nodemon = require("nodemon");

class AbstractRunFlow {
  constructor(execConfig) {
    this.execConfig = execConfig;
  }

  execCommand() {
    nodemon(this.execConfig);
  }

  getExecConfig() {
    return this.execConfig;
  }
}

module.exports = AbstractRunFlow;
