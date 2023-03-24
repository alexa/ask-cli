const path = require("path");
const fs = require("fs");
const CONSTANTS = require("../../../utils/constants");
const CliError = require("../../../exceptions/cli-error");
const AbstractRunFlow = require("./abstract-run-flow");

class NodejsRunFlow extends AbstractRunFlow {
  static canHandle(runtime) {
    return runtime === CONSTANTS.RUNTIME.NODE;
  }

  constructor({skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch}) {
    const skillFolderPath = path.join(process.cwd(), skillInvocationInfo.skillCodeFolderName);
    const script = path.join(skillFolderPath, CONSTANTS.RUN.NODE.SCRIPT_LOCATION);
    if (!fs.existsSync(script)) {
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
        path.join(skillFolderPath, `${skillInvocationInfo.skillFileName}.js`),
        "--region",
        runRegion,
      ],
      watch: watch ? `${skillInvocationInfo.skillCodeFolderName}` : watch,
    });
  }
}

module.exports = NodejsRunFlow;
