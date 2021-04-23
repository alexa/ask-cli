import { execSync } from "child_process";
import path from "path";
import fs from "fs-extra";

import { CompilerInput, CompilerOutput, CompilerResponse } from "../types";
import { ASK_COMPILER, TEN_MEGA_BYTES  } from "../util/consts";
import { logger } from '../util/logger';
import { verifyJava } from '../util/verifyJava';
import { printLogs } from '../util/printLogs';

export class Compiler {
  async compile(compilerInput: CompilerInput): Promise<CompilerOutput> {
    try {
      verifyJava();

      logger.info('************ Compiling skill package ************');
      logger.info(`Skill package directory: ${compilerInput.rootDir}`)

      const command = `java -jar ${path.join(__dirname, "../../lib/compiler-1.0.jar")} ${compilerInput.rootDir}`;
      const compilerResponse : CompilerResponse = JSON.parse(execSync(command, { encoding: 'utf8', maxBuffer: TEN_MEGA_BYTES }));

      if (compilerResponse.status === 'PASSED') {
          this._saveACIRFiles(compilerResponse.files, compilerInput.outDir);
      }

      printLogs(compilerResponse.logs);
      return {};
    } catch (error) {
        throw new Error(`${ASK_COMPILER} ${error}`);
    }
  }


  // save acir files
  private _saveACIRFiles = (acirFiles: { name: string; content: string }[], outputDirectory: string) => {

      fs.removeSync(outputDirectory);
      // creates build/ folder if doen't exist
      fs.mkdirSync(outputDirectory, { recursive : true });

      // saving acir files. - would rewrite if the file already exist with same name
      acirFiles.forEach(({ name, content }) => {
          fs.writeFileSync(path.join(outputDirectory, `${name}.json`), content);
      });
  }
}
