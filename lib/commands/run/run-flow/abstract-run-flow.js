import nodemon from "nodemon";
import Messenger from "../../../view/messenger";

export class AbstractRunFlow {
  constructor(execConfig) {
    this.execConfig = execConfig;
  }

  execCommand() {
    return new Promise(() => {
      nodemon({verbose: true, ...this.execConfig})
        .on('error', (error) => {
          reject(`Debugging session returned error code: ${(error) ? error.code : "undefined"}`);
        });
    });
  }

  getExecConfig() {
    return this.execConfig;
  }
}
