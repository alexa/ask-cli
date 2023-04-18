import { expect } from "chai";
import { JavaRunFlow } from "../../../../../lib/commands/run/run-flow/java-run";
import { RUN, ALEXA } from "../../../../../lib/utils/constants";

describe("Java run flow test", () => {
  const skillInvocationInfo = {
    skillCodeFolderName: "fooFolder",
    handlerName: "fooHandler",
  };
  it("| validate nodemon config, run mode", () => {
    const runFlow = new JavaRunFlow({
      skillInvocationInfo,
      waitForAttach: false,
      debugPort: RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: ALEXA.REGION.NA,
      watch: false,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.exec).eq(
      "cd fooFolder;" +
        " mvn exec:exec -Dexec.executable=java " +
        '-Dexec.args="-classpath %classpath com.amazon.ask.localdebug.LocalDebuggerInvoker ' +
        '--accessToken fooToken --skillId fooSkill --skillStreamHandlerClass fooHandler --region NA"',
    );
    expect(nodemonConfig.ext).eq("java, xml");
    expect(nodemonConfig.watch).eq(false);
  });
  it("| validate nodemon config, debug mode, watch enabled", () => {
    const runFlow = new JavaRunFlow({
      skillInvocationInfo,
      waitForAttach: true,
      debugPort: RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: ALEXA.REGION.NA,
      watch: true,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.exec).eq(
      "cd fooFolder; " +
        "mvn exec:exec -Dexec.executable=java " +
        '-Dexec.args="-classpath %classpath -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5000 ' +
        "com.amazon.ask.localdebug.LocalDebuggerInvoker --accessToken fooToken --skillId fooSkill " +
        '--region NA --skillStreamHandlerClass fooHandler"',
    );
    expect(nodemonConfig.ext).eq("java, xml");
    expect(nodemonConfig.watch).eq("fooFolder");
  });
});
