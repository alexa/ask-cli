import { execSync } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { RUNTIME, RUN } from "../../../utils/constants";
import CliError from "../../../exceptions/cli-error";
import { AbstractRunFlow } from "./abstract-run-flow";

export class PythonRunFlow extends AbstractRunFlow {
  static canHandle(runtime) {
    return runtime === RUNTIME.PYTHON;
  }

  constructor({ skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch }) {
    const sitePkgLocationsStr = execSync('python3 -c "import site; import json; print(json.dumps(site.getsitepackages()))"')
      .toString();
    const sitePkgLocations = JSON.parse(sitePkgLocationsStr);
    const localDebuggerPath = sitePkgLocations
      .map((location) => join(location, RUN.PYTHON.SCRIPT_LOCATION))
      .find((location) => existsSync(location));
    if (!existsSync(localDebuggerPath)) {
      throw new CliError(
        "ask-sdk-local-debug cannot be found. Please install ask-sdk-local-debug to your skill code project. " +
        "Refer https://pypi.org/project/ask-sdk-local-debug, for more info.",
      );
    }
    if (waitForAttach) {
      execSync("python3 -m pip install debugpy", { stdio: "inherit" });
    }
    const execMap = waitForAttach
      ? {
        py: `python3 -m debugpy --listen ${debugPort} --wait-for-client`,
      }
      : {
        py: "python3",
      };
    super({
      execMap,
      script: localDebuggerPath,
      args: [
        "--accessToken",
        `"${token}"`,
        "--skillId",
        skillId,
        "--skillHandler",
        skillInvocationInfo.handlerName,
        "--skillFilePath",
        join(`${skillInvocationInfo.skillCodeFolderName}`, `${skillInvocationInfo.skillFileName}.py`),
        "--region",
        runRegion,
      ],
      ext: "py,json,txt",
      watch: watch ? `${skillInvocationInfo.skillCodeFolderName}` : watch,
    });
  }
}
