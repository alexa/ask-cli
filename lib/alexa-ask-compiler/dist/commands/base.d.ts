import commander from "commander";
/**
 * ASKC command interface.
 */
export interface ASKCCommand {
    /**
     * Registers the command in to commander.
     *
     * @param program Command
     */
    register(program: commander.Command): any;
}
//# sourceMappingURL=base.d.ts.map