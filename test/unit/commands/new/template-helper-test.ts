import {expect, assert} from "chai";
import {beforeEach} from "mocha";
import sinon from "sinon";
import * as httpClient from "../../../../lib/clients/http-client";
import {
  CODE_LANGUAGE_JAVA,
  CODE_LANGUAGE_NODEJS,
  CODE_LANGUAGE_PYTHON,
  MODELING_STACK_AC,
  MODELING_STACK_IM,
} from "../../../../lib/commands/new";
import {getSampleTemplatesFromS3, convertUserInputToFilterValue} from "../../../../lib/commands/new/template-helper";
import {SampleTemplate} from "../../../../lib/model/sample-template";
import {DEPLOYER_TYPE} from "../../../../lib/utils/constants";

export const TEST_SKILL_MODEL_TYPE_IM = "im";
export const TEST_SKILL_MODEL_TYPE_AC = "ac";
export const TEST_DEPLOY_TYPE_HOSTED = "hosted";
export const TEST_DEPLOY_TYPE_CFN = "cfn";
export const TEST_DEPLOY_TYPE_LAMBDA = "lambda";
export const TEST_LANGUAGE_TYPE_NODE = "node";
export const TEST_LANGUAGE_TYPE_PYTHON = "python";
export const TEST_LANGUAGE_TYPE_JAVA = "java";
export const TEST_SAMPLE_NAME_1 = "foo";
export const TEST_SAMPLE_NAME_2 = "bar";
export const TEST_SAMPLE_DESCRIPTION_1 = `${TEST_SAMPLE_NAME_1} is not ${TEST_SAMPLE_NAME_2}`;
export const TEST_SAMPLE_DESCRIPTION_2 = `${TEST_SAMPLE_NAME_2} is not ${TEST_SAMPLE_NAME_1}`;
export const TEST_SAMPLE_1_IM_HOSTED_NODE: SampleTemplate = {
  stack: TEST_SKILL_MODEL_TYPE_IM,
  deploy: TEST_DEPLOY_TYPE_HOSTED,
  lang: TEST_LANGUAGE_TYPE_NODE,
  name: TEST_SAMPLE_NAME_1,
  url: "https://github.com/alexa/foo.git",
  desc: TEST_SAMPLE_DESCRIPTION_1,
  branch: "branch1",
};
export const TEST_SAMPLE_2_AC_CFN_PYTHON: SampleTemplate = {
  stack: TEST_SKILL_MODEL_TYPE_AC,
  deploy: TEST_DEPLOY_TYPE_CFN,
  lang: TEST_LANGUAGE_TYPE_PYTHON,
  name: TEST_SAMPLE_NAME_2,
  url: "https://github.com/alexa/bar.git",
  desc: TEST_SAMPLE_DESCRIPTION_2,
};
export const TEST_SAMPLE_IM_LAMBDA_JAVA: SampleTemplate = {
  stack: TEST_SKILL_MODEL_TYPE_IM,
  deploy: TEST_DEPLOY_TYPE_LAMBDA,
  lang: TEST_LANGUAGE_TYPE_JAVA,
  name: TEST_SAMPLE_NAME_2,
  url: "https://github.com/alexa/bar.git",
  desc: TEST_SAMPLE_DESCRIPTION_2,
};
const TEST_TEMPLATES = {templates: [TEST_SAMPLE_1_IM_HOSTED_NODE, TEST_SAMPLE_2_AC_CFN_PYTHON]};

describe("Commands new test - template helper test", () => {
  describe("getSampleTemplatesFromS3", () => {
    const TEST_SAMPLE_TEMPLATE_S3_FILE_CONTENT = {
      body: TEST_TEMPLATES,
      statusCode: 200,
      headers: {},
    };
    const TEST_HTTP_RESPONSE_400_ERROR = {
      statusCode: 400,
      headers: {},
    };

    let httpRequestStub: sinon.SinonStub;
    let doDebug: boolean;

    beforeEach(() => {
      httpRequestStub = sinon.stub(httpClient, "request");
      doDebug = false;
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| fetches the sample templates from S3", async () => {
      httpRequestStub.callsArgWith(3, null, TEST_SAMPLE_TEMPLATE_S3_FILE_CONTENT);
      await getSampleTemplatesFromS3(doDebug).then((samples) => {
        expect(samples.length).to.equals(2);
        const template1 = samples.find((s) => s.name === TEST_SAMPLE_NAME_1);
        const template2 = samples.find((s) => s.name === TEST_SAMPLE_NAME_2);
        expect(template1).to.deep.equals(TEST_SAMPLE_1_IM_HOSTED_NODE);
        expect(template2).to.deep.equals(TEST_SAMPLE_2_AC_CFN_PYTHON);
      });
    });

    it("| returns simplified error when debug is enabled and http request fails", async () => {
      httpRequestStub.callsArgWith(3, TEST_HTTP_RESPONSE_400_ERROR, null);
      doDebug = true;

      await getSampleTemplatesFromS3(doDebug)
        .then(() => assert.fail("http 400 errors should reject the promise while dodebug is true"))
        .catch((e) => {
          expect(e.message).to.equals("Failed to retrieve the skill sample templates.");
        });
    });

    it("| returns longer error message explaining to enable debug if debug is not enabled and http request fails", async () => {
      httpRequestStub.callsArgWith(3,  TEST_HTTP_RESPONSE_400_ERROR, null);
      doDebug = false;

      await getSampleTemplatesFromS3(doDebug)
        .then(() => assert.fail("http 400 errors should reject the promise while dodebug is false"))
        .catch((e) => {
          expect(e.message).to.equals("Failed to retrieve the skill sample templates. Please run again with --debug to see the details.");
        });
    });

    it("| returns the error message when http request returns an error", async () => {
      httpRequestStub.callsArgWith(3, new Error("secret failures"), null);

      await getSampleTemplatesFromS3(doDebug)
        .then(() => assert.fail("http errors should reject the promise"))
        .catch((e) => {
          expect(e.message).to.contain("Failed to retrieve the skill sample templates.");
          expect(e.message).not.to.contain("secret failures");
        });
    });
  });

  describe("convertUserInputToFilterValue", () => {
    it("should convert values to correct mapping", () => {
      expect(convertUserInputToFilterValue(MODELING_STACK_IM)).to.equal("im");
      expect(convertUserInputToFilterValue(MODELING_STACK_AC)).to.equal("ac");
      expect(convertUserInputToFilterValue(CODE_LANGUAGE_NODEJS)).to.equal("node");
      expect(convertUserInputToFilterValue(CODE_LANGUAGE_PYTHON)).to.equal("python");
      expect(convertUserInputToFilterValue(CODE_LANGUAGE_JAVA)).to.equal("java");
      expect(convertUserInputToFilterValue(DEPLOYER_TYPE.LAMBDA.NAME)).to.equal("lambda");
      expect(convertUserInputToFilterValue(DEPLOYER_TYPE.CFN.NAME)).to.equal("cfn");
      expect(convertUserInputToFilterValue(DEPLOYER_TYPE.HOSTED.NAME)).to.equal("hosted");
      expect(convertUserInputToFilterValue(DEPLOYER_TYPE.SELF_HOSTED.NAME)).to.equal("self");
    });

    it("should be case insensitive", () => {
      expect(convertUserInputToFilterValue(MODELING_STACK_IM)).to.equal("im");
      expect(convertUserInputToFilterValue(MODELING_STACK_IM.toLowerCase())).to.equal("im");
      expect(convertUserInputToFilterValue(MODELING_STACK_IM.toUpperCase())).to.equal("im");
    });

    it("should fail fast and throw and error if not identified", (done) => {
      const fakeValue = "foo";
      try {
        convertUserInputToFilterValue(fakeValue);
      } catch (error: any) {
        expect(error?.message).to.equal(`Unable to convert userInput '${fakeValue}' to a sample template filter value.`);
        done();
      }
    });
  });
});
