import commander from "commander";
import { Decompiler } from "../decompiler/decompiler";
import { ASKCCommand } from "./base";
/**
 * Decompile Command - Decompiles the ASKIR files inside the project
 * and generates ACDL code for them.
 *
 * usage: askc decompile
 */
export declare class DecompileCommand implements ASKCCommand {
    decompiler: Decompiler;
    constructor();
    register(program: commander.Command): void;
    private _action;
}
//# sourceMappingURL=decompile.d.ts.map