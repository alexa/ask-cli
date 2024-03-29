const fs = require("fs-extra");
const path = require("path");

const AbstractBuildFlow = require("./abstract-build-flow");

class JavaMvnBuildFlow extends AbstractBuildFlow {
  /**
   * If this file exists than the build flow can handle build
   */
  static get manifest() {
    return "pom.xml";
  }

  /**
   * Returns true if the build flow can handle the build
   */
  static canHandle({src}) {
    return fs.existsSync(path.join(src, JavaMvnBuildFlow.manifest));
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
    this.debug(`Building skill artifacts based on the ${JavaMvnBuildFlow.manifest}.`);
    this.execCommand(
      "mvn clean org.apache.maven.plugins:maven-assembly-plugin:2.6:assembly " + "-DdescriptorId=jar-with-dependencies package",
    );
    const targetFolderPath = path.join(this.cwd, "target");
    const jarFileName = fs.readdirSync(targetFolderPath).find((fileName) => fileName.endsWith("jar-with-dependencies.jar"));
    const jarFilePath = path.join(targetFolderPath, jarFileName);
    this.debug(`Renaming the jar file ${jarFilePath} to ${this.buildFile}.`);
    fs.moveSync(jarFilePath, this.buildFile, {overwrite: true});

    this.modifyZip({entryProcessor: this._removeCommentsFromPomProperties}, callback);
  }

  _removeCommentsFromPomProperties(entry) {
    // removing comment to allow consistent hashing
    if (entry.entryName.includes("pom.properties")) {
      const data = entry
        .getData()
        .toString()
        .replace(/^#.*\n?/gm, "");
      entry.setData(data);
    }
  }
}

module.exports = JavaMvnBuildFlow;
