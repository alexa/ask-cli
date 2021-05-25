import fs from 'fs-extra';
import path from 'path';

import CustomBuildFlow from '@src/builtins/build-flows/custom';
import JavaMvnBuildFlow from '@src/builtins/build-flows/java-mvn';
import NodeJsNpmBuildFlow from '@src/builtins/build-flows/nodejs-npm';
import PythonPipBuildFlow from '@src/builtins/build-flows/python-pip';
import ZipOnlyBuildFlow from '@src/builtins/build-flows/zip-only';

// order is important
const BUILD_FLOWS = [
    CustomBuildFlow,
    NodeJsNpmBuildFlow,
    JavaMvnBuildFlow,
    PythonPipBuildFlow,
    ZipOnlyBuildFlow
];

interface IBuild {
    folder: string;
    file: string;
};

export interface ICodeBuilder {
    src: string;
    build: IBuild;
    doDebug: boolean;
};

export default class CodeBuilder {
    private src: string;
    private doDebug: boolean;
    private build: IBuild;

    BuildFlowClass: any;

    /**
     * Constructor for CodeBuilder
     * @param {Object} config { src, build, doDebug }, where build = { folder, file }.
     */
    constructor(config: ICodeBuilder) {
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
    execute(callback: Function) {
        try {
            this._setUpBuildFolder();
        } catch (fsErr) {
            return process.nextTick(callback(fsErr));
        }
        const options = { cwd: this.build.folder, src: this.src, buildFile: this.build.file, doDebug: this.doDebug };
        const builder = new this.BuildFlowClass(options);
        builder.execute((error?: Error) => callback(error));
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
