import { expect } from "chai";
import fs from "fs";
import { restore, stub } from "sinon";
import { getHostedSkillInvocationInfo, getNonHostedSkillInvocationInfo, getNormalisedRuntime, selectRunFlowClass, getSkillCodeFolderName, getSkillFlowInstance } from "../../../../lib/commands/run/helper";
import { RUNTIME, FILE_PATH, ALEXA, RUN } from "../../../../lib/utils/constants";
import {NodejsRunFlow} from "../../../../lib/commands/run/run-flow/nodejs-run";
import {PythonRunFlow} from "../../../../lib/commands/run/run-flow/python-run";
import {JavaRunFlow} from "../../../../lib/commands/run/run-flow/java-run";
import ResourcesConfig from "../../../../lib/model/resources-config";

describe("Commands Run - helper test", () => {
  describe("getHostedSkillInvocationInfo test", () => {
    it("| validate Node hosted skill invocation info", () => {
      const hostedSkillInvocationInfo = getHostedSkillInvocationInfo(RUNTIME.NODE);
      expect(hostedSkillInvocationInfo.skillCodeFolderName).eq("lambda");
      expect(hostedSkillInvocationInfo.handlerName).eq("handler");
      expect(hostedSkillInvocationInfo.skillFileName).eq("index");
    });

    it("| validate Python hosted skill invocation info", () => {
      const hostedSkillInvocationInfo = getHostedSkillInvocationInfo(RUNTIME.PYTHON);
      expect(hostedSkillInvocationInfo.skillCodeFolderName).eq("lambda");
      expect(hostedSkillInvocationInfo.handlerName).eq("lambda_handler");
      expect(hostedSkillInvocationInfo.skillFileName).eq("lambda_function");
    });

    it("| Invalid hosted skill runtime info", () => {
      const hostedSkillInvocationInfo = getHostedSkillInvocationInfo(RUNTIME.JAVA);
      expect(hostedSkillInvocationInfo).eq(undefined);
    });
  });

  describe("getNonHostedSkillInvocationInfo test", () => {
    it("| validate Node non hosted skill invocation info", () => {
      const nonHostedSkillInvocationInfo = getNonHostedSkillInvocationInfo(
        RUNTIME.NODE,
        "fooFileName.fooHandler",
        "fooSkillCodeFolderName",
      );
      expect(nonHostedSkillInvocationInfo.handlerName).eq("fooHandler");
      expect(nonHostedSkillInvocationInfo.skillFileName).eq("fooFileName");
      expect(nonHostedSkillInvocationInfo.skillCodeFolderName).eq("fooSkillCodeFolderName");
    });
    it("| validate Python non hosted skill invocation info", () => {
      const nonHostedSkillInvocationInfo = getNonHostedSkillInvocationInfo(
        RUNTIME.PYTHON,
        "fooFileName.fooHandler",
        "fooSkillCodeFolderName",
      );
      expect(nonHostedSkillInvocationInfo.handlerName).eq("fooHandler");
      expect(nonHostedSkillInvocationInfo.skillFileName).eq("fooFileName");
      expect(nonHostedSkillInvocationInfo.skillCodeFolderName).eq("fooSkillCodeFolderName");
    });
    it("| validate Java non hosted skill invocation info", () => {
      const nonHostedSkillInvocationInfo = getNonHostedSkillInvocationInfo(
        RUNTIME.JAVA,
        "fooHandler",
        "fooSkillCodeFolderName",
      );
      expect(nonHostedSkillInvocationInfo.handlerName).eq("fooHandler");
      expect(nonHostedSkillInvocationInfo.skillCodeFolderName).eq("fooSkillCodeFolderName");
    });
    it("| empty runtime", () => {
      expect(() => getNonHostedSkillInvocationInfo("", "", "")).to.throw(
        "Missing runtime info in " + `resource file ${FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`,
      );
    });
    it("| empty handler", () => {
      expect(() => getNonHostedSkillInvocationInfo(RUNTIME.JAVA, "", "")).to.throw(
        "Missing handler info in " + `resource file ${FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`,
      );
    });
  });

  describe("getNormalisedRuntime test", () => {
    it("| normalised runtime for nodejs", () => {
      expect(getNormalisedRuntime("nodejs12.x")).eq(RUNTIME.NODE);
    });
    it("| normalised runtime for python", () => {
      expect(getNormalisedRuntime("python3.8")).eq(RUNTIME.PYTHON);
    });
    it("| normalised runtime for java", () => {
      expect(getNormalisedRuntime("java11")).eq(RUNTIME.JAVA);
    });
    it("| unsupported runtime", () => {
      expect(() => getNormalisedRuntime("foo")).to.throw("Runtime - foo is not supported");
    });
  });

  describe("selectRunFlowClass test", () => {
    it("| java run flow test", () => {
      expect(selectRunFlowClass(RUNTIME.JAVA)).eq(JavaRunFlow);
    });
    it("| python run flow test", () => {
      expect(selectRunFlowClass(RUNTIME.PYTHON)).eq(PythonRunFlow);
    });
    it("| nodejs run flow test", () => {
      expect(selectRunFlowClass(RUNTIME.NODE)).eq(NodejsRunFlow);
    });
    it("| unsupported run flow test", () => {
      expect(selectRunFlowClass("foo")).eq(undefined);
    });
  });

  describe("getSkillCodeFolderName test", () => {
    afterEach(() => {
      restore();
    });

    it("| skill code folder value exists for user provided region in resources file", () => {
      stub(ResourcesConfig, "getInstance").returns({
        getCodeSrcByRegion: stub().returns("fooFolder"),
      });
      stub(fs, "existsSync").returns(true);
      expect(getSkillCodeFolderName("foo", ALEXA.REGION.NA)).eq("fooFolder");
    });

    it("| skill code folder value does not for user provided region, default exists in resources file", () => {
      stub(ResourcesConfig, "getInstance").returns({
        getCodeSrcByRegion: stub()
          .withArgs("foo", ALEXA.REGION.NA)
          .returns("")
          .withArgs("foo", ALEXA.REGION.DEFAULT)
          .returns("fooFolder"),
      });
      stub(fs, "existsSync").returns(true);
      expect(getSkillCodeFolderName("foo", ALEXA.REGION.NA)).eq("fooFolder");
    });

    it("| skill code folder value does not exist for user provided region or default in resources file", () => {
      stub(ResourcesConfig, "getInstance").returns({
        getCodeSrcByRegion: stub().returns(""),
      });
      stub(fs, "existsSync").returns(true);
      expect(() => getSkillCodeFolderName("foo", ALEXA.REGION.NA)).to.throw(
        'Invalid code setting in region NA. "src" must be set if you want to run the skill code with skill package.',
      );
    });

    it("| skill code folder does not exist", () => {
      stub(ResourcesConfig, "getInstance").returns({
        getCodeSrcByRegion: stub().returns("fooFolder"),
      });
      stub(fs, "existsSync").returns(false);
      expect(() => getSkillCodeFolderName("foo", ALEXA.REGION.NA)).to.throw(
        "Invalid code setting in region NA. File doesn't exist for code src: fooFolder.",
      );
    });
  });

  describe("getSkillFlowInstance test", () => {
    it("| create skill flow instance test, error case", () => {
      expect(() =>
        getSkillFlowInstance(
            RUNTIME.NODE,
            {skillCodeFolderName: "fooSkillCodeFolderName"},
            true,
            RUN.DEFAULT_DEBUG_PORT,
            "fooToken",
            "fooSkillId",
            ALEXA.REGION.NA,
            false,
          )
          .to.throw(
            "ask-sdk-local-debug cannot be found. Please install " +
              "ask-sdk-local-debug to your skill code project. Refer https://www.npmjs.com/package/ask-sdk-local-debug for more info",
          ),
      );
    });
  });
});
