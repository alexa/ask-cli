const fs = require('fs-extra');
const path = require('path');
const shell = require('shelljs');
const zipUtils = require('@src/utils/zip-utils');

const BUILT_IN_BUILD_FLOWS = [
    {
        flow: 'nodejs-npm',
        manifest: 'package.json'
    },
    {
        flow: 'python-pip',
        manifest: 'requirements.txt'
    },
    {
        flow: 'java-mvn',
        manifest: 'pom.xml'
    }
];
const ZIP_ONLY_BUILD_FLOW = 'zip-only';
const POWERSHELL_PREFIX = 'PowerShell.exe -Command';

class CodeBuilder {
    /**
     * Constructor for CodeBuilder which decides the code build flow.
     * Currently we resolve the packageBuillder based on OS type:
     *   If running in WINDOWS osType, we only supports using Powershell script;
     *   If not in WINDOWS, we run bash script.
     *
     * @param {Object} config { src, build, doDebug }, where build = { folder, file }.
     */
    constructor(config) {
        const { src, build, doDebug } = config;
        this.src = src;
        this.build = build;
        this.doDebug = doDebug;
        this.osType = process.platform === 'win32' ? 'WINDOWS' : 'UNIX';

        this._decidePackageBuilder();
    }

    /**
     * Execute this.packageBuilder based on this.osType. We use powershell for Windows and regular terminal for non-Windows.
     * @param {Function} callback (error)
     */
    execute(callback) {
        try {
            // 1.reset build folder
            fs.ensureDirSync(this.build.folder);
            // 2.copy src code to build folder
            fs.emptyDirSync(this.build.folder);
            fs.copySync(path.resolve(this.src), this.build.folder, {
                filter: src => !src.includes(this.build.folder)
            });
        } catch (fsErr) {
            return process.nextTick(() => {
                callback(fsErr);
            });
        }
        // 3.execute packge builder script
        if (this.buildFlow !== ZIP_ONLY_BUILD_FLOW) {
            let command;
            if (this.osType === 'WINDOWS') {
                const doDebug = this.doDebug ? '$True' : '$False';
                command = `${POWERSHELL_PREFIX} "& {& '${this.packageBuilder}' '${this.build.file}' ${doDebug} }"`;
            } else {
                command = `${this.packageBuilder} "${this.build.file}" ${!!this.doDebug}`;
            }
            shell.exec(command, { async: true, cwd: this.build.folder }, (code) => {
                if (code !== 0) {
                    callback(`[Error]: Build Scripts failed with non-zero code: ${code}.`);
                } else {
                    callback();
                }
            });
        } else {
            zipUtils.createTempZip(this.src, (zipErr, zipFilePath) => {
                if (zipErr) {
                    return callback(zipErr);
                }
                fs.moveSync(zipFilePath, this.build.file, { overwrite: true });
                callback();
            });
        }
    }

    /**
     * Decide the buildFlow and actual packageBuilder for current instance / source code
     */
    _decidePackageBuilder() {
        // 1.check if user provided custom build flow script exists
        const hookScriptPath = this.osType === 'WINDOWS'
            ? path.join(process.cwd(), 'hooks', 'build.ps1') // TODO support non-powershell script for Windows
            : path.join(process.cwd(), 'hooks', 'build.sh');
        if (fs.existsSync(hookScriptPath)) {
            this.buildFlow = 'custom';
            this.packageBuilder = hookScriptPath;
            return;
        }
        // 2.infer from the src code to decide the build flow
        this.buildFlow = this._inferCodeBuildFlow();
        this.packageBuilder = this.buildFlow === ZIP_ONLY_BUILD_FLOW ? null
            : path.join(__dirname, '..', '..', 'builtins', 'build-flows', this.buildFlow, this.osType === 'WINDOWS' ? 'build.ps1' : 'build.sh');
    }

    /**
     * Infer what is the build flow for the current src by checking the existence of manifest file in the src code.
     * If no built-in build flow is found, will go by default to zip-only.
     */
    _inferCodeBuildFlow() {
        let buildFlowResult = ZIP_ONLY_BUILD_FLOW; // set default build flow to be 'zip-only'
        if (fs.statSync(this.src).isDirectory()) {
            for (const flowItem of BUILT_IN_BUILD_FLOWS) {
                const { flow, manifest } = flowItem;
                if (fs.existsSync(path.join(this.src, manifest))) {
                    buildFlowResult = flow;
                    break;
                }
            }
        }
        return buildFlowResult;
    }
}

module.exports = CodeBuilder;
module.exports.ZIP_ONLY_BUILD_FLOW = ZIP_ONLY_BUILD_FLOW;
