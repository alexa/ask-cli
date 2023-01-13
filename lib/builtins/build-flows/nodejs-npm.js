const fs = require('fs-extra');
const path = require('path');

const AbstractBuildFlow = require('./abstract-build-flow');

class NodeJsNpmBuildFlow extends AbstractBuildFlow {
    /**
     * If this file exists than the build flow can handle build
     */
    static get manifest() { return 'package.json'; }

    static get _lockFiles() { return ['package-lock.json', 'npm-shrinkwrap.json']; }

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
    constructor({ cwd, src, buildFile, doDebug, noNPMInstall }) {
        super({ cwd, src, buildFile, doDebug });
        this.noNPMInstall = noNPMInstall;
    }

    /**
     * Executes build
     * @param {Function} callback
     */
    execute(callback) {
        const installCmd = this._hasLockFile() ? 'ci' : 'install';
        const quietFlag = this.doDebug ? '' : ' --quiet';

        if (this.noNPMInstall) {
            this.debug('noNPMInstall flag is true. Skipping npm install.');
        } else {
            this.env.NODE_ENV = 'production';
            this.debug(`Installing NodeJS dependencies based on the ${NodeJsNpmBuildFlow.manifest}.`);
            this.execCommand(`npm ${installCmd}${quietFlag}`);
        }

        this.createZip(callback);
    }

    _hasLockFile() {
        return NodeJsNpmBuildFlow._lockFiles.some(file => fs.existsSync(path.join(this.src, file)));
    }
}

module.exports = NodeJsNpmBuildFlow;
