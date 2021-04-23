import { execSync } from "child_process";
import path from "path";
import fs from "fs-extra";
import { DecompilerInput, DecompilerOutput, DecompilerResponse } from "../types";
import { ASK_DECOMPILER, ACDL_PATH, BUILD, TEN_MEGA_BYTES } from "../util/consts";
import { logger } from '../util/logger';
import { verifyJava } from '../util/verifyJava';

import { printLogs } from '../util/printLogs';

export class Decompiler {
    async decompile(decompilerInput: DecompilerInput): Promise<DecompilerOutput> {
        try {
            verifyJava();

            logger.info('************ Decompiling skill package ************');
            logger.info(`Skill package directory: ${decompilerInput.rootDir}`);
            // if the exported conversations/ is empty, no decompilation
            if (!fs.existsSync(decompilerInput.outDir) || fs.readdirSync(decompilerInput.outDir).length === 0) {
                logger.error(`no such directory or the directory is empty: ${decompilerInput.outDir}`);
                return {};
            }
            const command = `java -jar ${path.join(__dirname, "../../lib/compiler-1.0.jar")} ${decompilerInput.rootDir} decompile`;
            const decompilerResponse : DecompilerResponse = JSON.parse(execSync(command, { encoding: 'utf8' , maxBuffer: TEN_MEGA_BYTES }));
            if (decompilerResponse.status === 'PASSED') {
                // creates build/ folder if doesn't exist
                fs.mkdirSync(path.join(decompilerInput.rootDir, `${BUILD}`), { recursive: true });
                // copy askir files from conversations/ to build/ if there is any
                const irFiles = fs.readdirSync(path.join(decompilerInput.rootDir, `${ACDL_PATH}`));
                if (irFiles) {
                    this._copyASKIRFiles(irFiles, decompilerInput.rootDir);
                }
                this._saveACDLFiles(decompilerResponse.files, decompilerInput.outDir);
            }

            printLogs(decompilerResponse.logs);
            return {};
        } catch (error) {
            throw new Error(`${ASK_DECOMPILER} ${error}`);
        }
    }

    /*
     copy the askir(.json) files from conversations/ to build/
    */
    private _copyASKIRFiles = (irFiles: string[], rootDir: string) => {
        try {
            for (const irFile of irFiles) {
                fs.copyFileSync(path.join(rootDir, `${ACDL_PATH}`, irFile), path.join(rootDir, `${BUILD}`, irFile));
            }
        } catch (error) {
            throw new Error(`${ASK_DECOMPILER} ${error}`);
        }
    }

    // create decompiled package which will be edited by devs
    private _saveACDLFiles = (acdlFiles: { name: string; content: string }[], outputDirectory: string) => {
        // Following steps need to occur in sync and in-order

        // deletes conversations/ folder
        fs.removeSync(outputDirectory);
        // creates conversations/ folder
        fs.mkdirSync(outputDirectory, { recursive : true });

        // saving acdl files - would rewrite if the file already exist with same name
        acdlFiles.forEach(({ name, content }) => {
            fs.writeFile(path.join(outputDirectory, `${name}.acdl`), content, (err: Error) => {
                if (err) throw new Error("Error occurred while saving acdl files" + err);
            });
        });
    }
}