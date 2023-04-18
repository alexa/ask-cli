import { join } from "path";
import { existsSync } from "fs";
import { RUNTIME, RUN } from "../../../utils/constants";
import CliError from "../../../exceptions/cli-error";
import { AbstractRunFlow } from "./abstract-run-flow";

export class NodejsRunFlow extends AbstractRunFlow {
  static canHandle(runtime) {
    return runtime === RUNTIME.NODE;
  }

  constructor({ skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch }) {
    const skillFolderPath = join(process.cwd(), skillInvocationInfo.skillCodeFolderName);
    const script = join(skillFolderPath, RUN.NODE.SCRIPT_LOCATION);
    if (!existsSync(script)) {
      throw new CliError(
        "ask-sdk-local-debug cannot be found. Please install ask-sdk-local-debug to your skill code project. " +
        "Refer https://www.npmjs.com/package/ask-sdk-local-debug for more info.",
      );
    }
    const execMap = waitForAttach
      ? {
        js: `node --inspect-brk=${debugPort}`,
      }
      : undefined;
    super({
      execMap,
      script,
      args: [
        "--accessToken",
        `"${token}"`,
        "--skillId",
        skillId,
        "--handlerName",
        skillInvocationInfo.handlerName,
        "--skillEntryFile",
        join(skillFolderPath, `${skillInvocationInfo.skillFileName}.js`),
        "--region",
        runRegion,
      ],
      watch: watch ? `${skillInvocationInfo.skillCodeFolderName}` : watch,
    });
  }
}
