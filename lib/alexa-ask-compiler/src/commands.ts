#!/usr/bin/env node
import { program } from "commander";

import { DecompileCommand } from "./commands/decompile";

/**
 * List of enabled commands
 */
new DecompileCommand().register(program);

program.parse(process.argv);
