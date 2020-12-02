const AdmZip = require('adm-zip');
const childProcess = require('child_process');
const path = require('path');

const Messenger = require('@src/view/messenger');

class AbstractBuildFlow {
    /**
     * Constructor
     * @param {Object} options
     * @param {String} options.cwd working directory for build
     * @param {String} options.src source directory
     * @param {String} options.buildFile full path for zip file to generate
     * @param {Boolean} options.doDebug debug flag
     */
    constructor({ cwd, src, buildFile, doDebug }) {
        this.cwd = cwd;
        this.src = src;
        this.buildFile = buildFile;
        this.stdio = 'inherit';
        this.doDebug = !!doDebug;
        this.isWindows = process.platform === 'win32';
        this.defaultZipFileDate = new Date(1990, 1, 1);
    }

    /**
     * Creates build zip file
     * @param {Object} options
     * @param {Object} options.filter filter to apply to exclude files from zip
     * @param {Function} callback
     */
    createZip(options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        const filter = options.filter || (() => false);

        this.debug(`Zipping source files and dependencies to ${this.buildFile}.`);
        const zip = new AdmZip();
        const zipFileName = path.basename(this.buildFile);

        // adding files
        zip.addLocalFolder(this.cwd, '', (entry) => entry !== zipFileName && !filter(entry));
        // setting create timestamp to the same value to allow consistent hash
        zip.getEntries().forEach(e => { e.header.time = this.defaultZipFileDate; });

        zip.writeZip(this.buildFile, callback);
    }

    /**
     * Modifies build zip file
     * @param {Object} options
     * @param {Object} options.entryProcessor function to apply to each zip file entry
     * @param {Function} callback
     */
    modifyZip(options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        const zip = new AdmZip(this.buildFile);

        const entryProcessor = options.entryProcessor || (() => {});

        zip.getEntries().forEach(e => {
            // setting create timestamp to the same value to allow consistent hash
            e.header.time = this.defaultZipFileDate;
            entryProcessor(e);
        });
        zip.writeZip(this.buildFile, callback);
    }

    /**
     * Executes shell command
     * @param {String} cmd command
     */
    execCommand(cmd) {
        childProcess.execSync(cmd, { cwd: this.cwd, stdio: this.stdio });
    }

    /**
     * Outputs debug message
     * @param {String} message message
     */
    debug(message) {
        if (this.doDebug) {
            Messenger.getInstance().debug(message);
        }
    }
}

module.exports = AbstractBuildFlow;
