const AbstractBuildFlow = require("./abstract-build-flow");

class ZipOnlyBuildFlow extends AbstractBuildFlow {
  /**
   * Returns true if the build flow can handle the build
   */
  static canHandle() {
    return true;
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
    this.createZip(callback);
  }
}

module.exports = ZipOnlyBuildFlow;
