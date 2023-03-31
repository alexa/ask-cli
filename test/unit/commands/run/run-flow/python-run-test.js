const {expect} = require("chai");
const path = require("path");
const fs = require("fs");
const sinon = require("sinon");
const childProcess = require("child_process");
const PythonRunFlow = require("../../../../../lib/commands/run/run-flow/python-run");
const CONSTANTS = require("../../../../../lib/utils/constants");

describe("Python run flow test", () => {
  const skillPackagePath = "fooPythonPath";
  const pythonDebugPath = path.join(skillPackagePath, CONSTANTS.RUN.PYTHON.SCRIPT_LOCATION);
  const skillInvocationInfo = {
    skillCodeFolderName: "fooFolder",
    handlerName: "fooHandler",
    skillFileName: "fooFileName",
  };
  beforeEach(() => {
    sinon
      .stub(childProcess, "execSync")
      .withArgs('python3 -c "import site; import json; print(json.dumps(site.getsitepackages()))"')
      .returns("")
      .withArgs("python3 -m pip install debugpy", {stdio: "inherit"})
      .returns("");
    sinon.stub(JSON, "parse").returns([skillPackagePath]);
  });
  afterEach(() => {
    sinon.restore();
  });
  it("| validate nodemon config, run mode", () => {
    sinon.stub(fs, "existsSync").withArgs(skillPackagePath).returns(true).withArgs(pythonDebugPath).returns(true);
    const runFlow = new PythonRunFlow({
      skillInvocationInfo,
      waitForAttach: false,
      debugPort: CONSTANTS.RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: CONSTANTS.ALEXA.REGION.NA,
      watch: false,
    });
    const nodemonConfig = runFlow.getExecConfig();
    expect(nodemonConfig.execMap).to.deep.equal({
      py: "python3",
    });
    expect(nodemonConfig.script).eq(pythonDebugPath);
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--skillHandler",
      "fooHandler",
      "--skillFilePath",
      path.join("fooFolder", "fooFileName.py"),
      "--region",
      CONSTANTS.ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq(false);
    expect(nodemonConfig.ext).eq("py,json,txt");
  });
  it("| validate nodemon config, debug mode, watch enabled", () => {
    sinon.stub(fs, "existsSync").withArgs(skillPackagePath).returns(true).withArgs(pythonDebugPath).returns(true);
    const runFlow = new PythonRunFlow({
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
      py: `python3 -m debugpy --listen ${CONSTANTS.RUN.DEFAULT_DEBUG_PORT} --wait-for-client`,
    });
    expect(nodemonConfig.script).eq(path.join("fooPythonPath", CONSTANTS.RUN.PYTHON.SCRIPT_LOCATION));
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--skillHandler",
      "fooHandler",
      "--skillFilePath",
      path.join("fooFolder", "fooFileName.py"),
      "--region",
      CONSTANTS.ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq("fooFolder");
    expect(nodemonConfig.ext).eq("py,json,txt");
  });
  it("| ask-sdk-local-debug has not been installed", () => {
    sinon.stub(fs, "existsSync").withArgs(skillPackagePath).returns(true).withArgs(pythonDebugPath).returns(false);
    try {
      new PythonRunFlow({
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
          "Refer https://pypi.org/project/ask-sdk-local-debug, for more info.",
      );
    }
  });
});
