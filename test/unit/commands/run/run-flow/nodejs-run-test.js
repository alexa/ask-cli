const {expect} = require("chai");
const path = require("path");
const fs = require("fs");
const sinon = require("sinon");
const NodejsRunFlow = require("../../../../../lib/commands/run/run-flow/nodejs-run");
const CONSTANTS = require("../../../../../lib/utils/constants");

describe("Node run flow test", () => {
  const skillInvocationInfo = {
    skillCodeFolderName: "fooFolder",
    handlerName: "fooHandler",
    skillFileName: "fooFileName",
  };
  afterEach(() => {
    sinon.restore();
  });
  it("| validate nodemon config, run mode", () => {
    sinon.stub(fs, "existsSync").returns(true);
    const runFlow = new NodejsRunFlow({
      skillInvocationInfo,
      waitForAttach: false,
      debugPort: CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: CONSTANTS.ALEXA.REGION.NA,
      watch: false,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.execMap).eq(undefined);
    expect(nodemonConfig.script).eq(path.join(process.cwd(), "fooFolder", CONSTANTS.RUN.NODE.SCRIPT_LOCATION));
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--handlerName",
      "fooHandler",
      "--skillEntryFile",
      path.join(process.cwd(), "fooFolder", "fooFileName.js"),
      "--region",
      CONSTANTS.ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq(false);
  });
  it("| validate nodemon config, debug mode, watch enabled", () => {
    sinon.stub(fs, "existsSync").returns(true);
    const runFlow = new NodejsRunFlow({
      skillInvocationInfo,
      waitForAttach: true,
      debugPort: CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: CONSTANTS.ALEXA.REGION.NA,
      watch: true,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.execMap).to.deep.equal({
      js: `node --inspect-brk=${CONSTANTS.RUN.DEFAULT_DEBUG_PORT}`,
    });
    expect(nodemonConfig.script).eq(path.join(process.cwd(), "fooFolder", CONSTANTS.RUN.NODE.SCRIPT_LOCATION));
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--handlerName",
      "fooHandler",
      "--skillEntryFile",
      path.join(process.cwd(), "fooFolder", "fooFileName.js"),
      "--region",
      CONSTANTS.ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq("fooFolder");
  });
  it("| ask-sdk-local-debug has not been installed", () => {
    sinon.stub(fs, "existsSync").returns(false);
    try {
      new NodejsRunFlow({
        skillInvocationInfo,
        waitForAttach: true,
        debugPort: CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
        token: "fooToken",
        skillId: "fooSkill",
        runRegion: CONSTANTS.ALEXA.REGION.NA,
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
