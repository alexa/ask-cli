const fs = require('fs-extra');
const path = require('path');

const AbstractBuildFlow = require('./abstract-build-flow');

class NodeJsNpmBuildFlow extends AbstractBuildFlow {
    /**
     * If this file exists than the build flow can handle build
     */
    static get manifest() { return 'package.json'; }

    /**
     * Returns true if the build flow can handle the build
     */
    static canHandle({ src }) {
        return fs.existsSync(path.join(src, NodeJsNpmBuildFlow.manifest));
    }

    /**
     * Constructor
     * @param {Object} options
     * @param {String} options.cwd working directory for build
     * @param {String} options.src source directory
     * @param {String} options.buildFile full path for zip file to generate
     * @param {Boolean} options.doDebug debug flag
     */
    constructor({ cwd, src, buildFile, doDebug }) {
        super({ cwd, src, buildFile, doDebug });
    }

    /**
     * Executes build
     * @param {Function} callback
     */
    execute(callback) {
        const quiteFlag = this.doDebug ? '' : ' --quite';
        this.debug(`Installing NodeJS dependencies based on the ${NodeJsNpmBuildFlow.manifest}.`);
        this.execCommand(`npm install --production${quiteFlag}`);
        this.createZip(callback);
    }
}

module.exports = NodeJsNpmBuildFlow;
