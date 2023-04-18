import { expect } from "chai";
import { join } from "path";
import fs from "fs";
import { stub, restore } from "sinon";
import childProcess from "child_process";
import { PythonRunFlow } from "../../../../../lib/commands/run/run-flow/python-run";
import { RUN, ALEXA } from "../../../../../lib/utils/constants";

describe("Python run flow test", () => {
  const skillPackagePath = "fooPythonPath";
  const pythonDebugPath = join(skillPackagePath, RUN.PYTHON.SCRIPT_LOCATION);
  const skillInvocationInfo = {
    skillCodeFolderName: "fooFolder",
    handlerName: "fooHandler",
    skillFileName: "fooFileName",
  };
  beforeEach(() => {
    stub(childProcess, "execSync")
      .withArgs('python3 -c "import site; import json; print(json.dumps(site.getsitepackages()))"')
      .returns("")
      .withArgs("python3 -m pip install debugpy", {stdio: "inherit"})
      .returns("");
    stub(JSON, "parse").returns([skillPackagePath]);
  });
  afterEach(() => {
    restore();
  });
  it("| validate nodemon config, run mode", () => {
    stub(fs, "existsSync").withArgs(skillPackagePath).returns(true).withArgs(pythonDebugPath).returns(true);
    const runFlow = new PythonRunFlow({
      skillInvocationInfo,
      waitForAttach: false,
      debugPort: RUN.DEFAULT_DEBUG_PORT,
      token: "fooToken",
      skillId: "fooSkill",
      runRegion: ALEXA.REGION.NA,
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
      join("fooFolder", "fooFileName.py"),
      "--region",
      ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq(false);
    expect(nodemonConfig.ext).eq("py,json,txt");
  });
  it("| validate nodemon config, debug mode, watch enabled", () => {
    stub(fs, "existsSync").withArgs(skillPackagePath).returns(true).withArgs(pythonDebugPath).returns(true);
    const runFlow = new PythonRunFlow({
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
      py: `python3 -m debugpy --listen ${RUN.DEFAULT_DEBUG_PORT} --wait-for-client`,
    });
    expect(nodemonConfig.script).eq(join("fooPythonPath", RUN.PYTHON.SCRIPT_LOCATION));
    expect(nodemonConfig.args).to.deep.equal([
      "--accessToken",
      '"fooToken"',
      "--skillId",
      "fooSkill",
      "--skillHandler",
      "fooHandler",
      "--skillFilePath",
      join("fooFolder", "fooFileName.py"),
      "--region",
      ALEXA.REGION.NA,
    ]);
    expect(nodemonConfig.watch).eq("fooFolder");
    expect(nodemonConfig.ext).eq("py,json,txt");
  });
  it("| ask-sdk-local-debug has not been installed", () => {
    stub(fs, "existsSync").withArgs(skillPackagePath).returns(true).withArgs(pythonDebugPath).returns(false);
    try {
      new PythonRunFlow({
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
          "Refer https://pypi.org/project/ask-sdk-local-debug, for more info.",
      );
    }
  });
});
