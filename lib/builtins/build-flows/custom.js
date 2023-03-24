const fs = require("fs-extra");
const path = require("path");

const AbstractBuildFlow = require("./abstract-build-flow");

class CustomBuildFlow extends AbstractBuildFlow {
  /**
   * If this file exists than the build flow can handle build
   */
  static get manifest() {
    return process.platform === "win32" ? "build.ps1" : "build.sh";
  }

  static get _customScriptPath() {
    return path.join(process.cwd(), "hooks", CustomBuildFlow.manifest);
  }

  /**
   * Returns true if the build flow can handle the build
   */
  static canHandle() {
    return fs.existsSync(CustomBuildFlow._customScriptPath);
  }

  /**
   * Constructor
   * @param {Object} options
   * @param {String} options.cwd working directory for build
   * @param {String} options.src source directory
   * @param {String} options.buildFile full path for zip file to generate
   * @param {Boolean} options.doDebug debug flag
   */
  constructor({cwd, src, buildFile, doDebug}) {
    super({cwd, src, buildFile, doDebug});
  }

  /**
   * Executes build
   * @param {Function} callback
   */
  execute(callback) {
    this.debug(`Executing custom hook script ${CustomBuildFlow._customScriptPath}.`);
    let command = `${CustomBuildFlow._customScriptPath} "${this.buildFile}" ${this.doDebug}`;
    if (this.isWindows) {
      const powerShellPrefix = "PowerShell.exe -Command";
      const doDebug = this.doDebug ? "$True" : "$False";
      command = `${powerShellPrefix} "& {& '${CustomBuildFlow._customScriptPath}' '${this.buildFile}' ${doDebug} }"`;
    }
    this.execCommand(command);
    callback();
  }
}

module.exports = CustomBuildFlow;
