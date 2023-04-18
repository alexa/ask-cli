import { expect } from "chai";
import { join } from "path";
import fs from "fs";
import { restore, stub } from "sinon";
import { NodejsRunFlow } from "../../../../../lib/commands/run/run-flow/nodejs-run";
import { RUN, ALEXA } from "../../../../../lib/utils/constants";

describe("Node run flow test", () => {
  const skillInvocationInfo = {
    skillCodeFolderName: "fooFolder",
    handlerName: "fooHandler",
    skillFileName: "fooFileName",
  };
  afterEach(() => {
    restore();
  });
  it("| validate nodemon config, run mode", () => {
    stub(fs, "existsSync").returns(true);
    const runFlow = new NodejsRunFlow({
      skillInvocationInfo,
      waitForAttach: false,
      debugPort: RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: ALEXA.REGION.NA,
      watch: false,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.execMap).eq(undefined);
    expect(nodemonConfig.script).eq(join(process.cwd(), "fooFolder", RUN.NODE.SCRIPT_LOCATION));
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--handlerName",
      "fooHandler",
      "--skillEntryFile",
      join(process.cwd(), "fooFolder", "fooFileName.js"),
      "--region",
      ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq(false);
  });
  it("| validate nodemon config, debug mode, watch enabled", () => {
    stub(fs, "existsSync").returns(true);
    const runFlow = new NodejsRunFlow({
      skillInvocationInfo,
      waitForAttach: true,
      debugPort: RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: ALEXA.REGION.NA,
      watch: true,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.execMap).to.deep.equal({
      js: `node --inspect-brk=${RUN.DEFAULT_DEBUG_PORT}`,
    });
    expect(nodemonConfig.script).eq(join(process.cwd(), "fooFolder", RUN.NODE.SCRIPT_LOCATION));
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--handlerName",
      "fooHandler",
      "--skillEntryFile",
      join(process.cwd(), "fooFolder", "fooFileName.js"),
      "--region",
      ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq("fooFolder");
  });
  it("| ask-sdk-local-debug has not been installed", () => {
    stub(fs, "existsSync").returns(false);
    try {
      new NodejsRunFlow({
        skillInvocationInfo,
        waitForAttach: true,
        debugPort: RUN.DEFAULT_DEBUG_PORT,
        token: "fooToken",
        skillId: "fooSkill",
        runRegion: ALEXA.REGION.NA,
        watch: true,
      });
    } catch (err) {
      expect(err.message).eq(
        "ask-sdk-local-debug cannot be found. Please install ask-sdk-local-debug to your skill code project. " +
          "Refer https://www.npmjs.com/package/ask-sdk-local-debug for more info.",
      );
    }
  });
});
