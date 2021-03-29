import commander from "commander";
import { Decompiler } from "../decompiler/decompiler";
import path from "path";
import { SKILL_PACKAGE_DIR } from './../util/consts';

import { ASKCCommand } from "./base";

/**
 * Decompile Command - Decompiles the ASKIR files inside the project
 * and generates ACDL code for them.
 *
 * usage: askc decompile
 */
export class DecompileCommand implements ASKCCommand {
  decompiler: Decompiler;

  constructor() {
    this.decompiler = new Decompiler();
  }

  register(program: commander.Command) {
    program
      .command("decompile")
      .description("Decompile the project.")
      .action(this._action);
  }

  private _action = async (command: commander.Command) => {
    await this.decompiler.decompile({rootDir: path.join(process.cwd(), SKILL_PACKAGE_DIR), outDir: path.join(SKILL_PACKAGE_DIR, '/conversations/')});
  };
}
