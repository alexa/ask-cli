const fs = require('fs-extra');
const path = require('path');

const CustomBuildFlow = require('@src/builtins/build-flows/custom');
const JavaMvnBuildFlow = require('@src/builtins/build-flows/java-mvn');
const NodeJsNpmBuildFlow = require('@src/builtins/build-flows/nodejs-npm');
const PythonPipBuildFlow = require('@src/builtins/build-flows/python-pip');
const ZipOnlyBuildFlow = require('@src/builtins/build-flows/zip-only');

// order is important
const BUILD_FLOWS = [
    CustomBuildFlow,
    NodeJsNpmBuildFlow,
    JavaMvnBuildFlow,
    PythonPipBuildFlow,
    ZipOnlyBuildFlow
];

class CodeBuilder {
    /**
     * Constructor for CodeBuilder
     * @param {Object} config { src, build, doDebug }, where build = { folder, file }.
     */
    constructor(config) {
        const { src, build, doDebug } = config;
        this.src = src;
        this.build = build;
        this.doDebug = doDebug;
        this.BuildFlowClass = {};
        this._selectBuildFlowClass();
    }

    /**
     * Executes build flow
     * @param {Function} callback (error)
     */
    execute(callback) {
        try {
            this._setUpBuildFolder();
        } catch (fsErr) {
            return process.nextTick(callback(fsErr));
        }
        const options = { cwd: this.build.folder, src: this.src, buildFile: this.build.file, doDebug: this.doDebug };
        const builder = new this.BuildFlowClass(options);
        builder.execute((error) => callback(error));
    }

    _setUpBuildFolder() {
        fs.ensureDirSync(this.build.folder);
        fs.emptyDirSync(this.build.folder);
        fs.copySync(path.resolve(this.src), this.build.folder, { filter: src => !src.includes(this.build.folder) });
    }

    _selectBuildFlowClass() {
        this.BuildFlowClass = BUILD_FLOWS.find(flow => flow.canHandle({ src: this.src }));
    }
}

module.exports = CodeBuilder;
