import { RUNTIME } from "../../../utils/constants";
import { AbstractRunFlow } from "./abstract-run-flow";

export class JavaRunFlow extends AbstractRunFlow {
  static canHandle(runtime) {
    return runtime === RUNTIME.JAVA;
  }

  constructor({ skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch }) {
    let execCmd =
      `cd ${skillInvocationInfo.skillCodeFolderName}; mvn exec:exec -Dexec.executable=java -Dexec.args=` +
      '"-classpath %classpath com.amazon.ask.localdebug.LocalDebuggerInvoker ' +
      `--accessToken ${token} --skillId ${skillId} --skillStreamHandlerClass ${skillInvocationInfo.handlerName} --region ${runRegion}"`;
    if (waitForAttach) {
      execCmd =
        `cd ${skillInvocationInfo.skillCodeFolderName}; mvn exec:exec -Dexec.executable=java -Dexec.args=` +
        `"-classpath %classpath -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=${debugPort} ` +
        "com.amazon.ask.localdebug.LocalDebuggerInvoker " +
        `--accessToken ${token} --skillId ${skillId} --region ${runRegion} --skillStreamHandlerClass ${skillInvocationInfo.handlerName}"`;
    }
    super({
      exec: execCmd,
      ext: "java, xml",
      watch: watch ? `${skillInvocationInfo.skillCodeFolderName}` : watch,
    });
  }
}
