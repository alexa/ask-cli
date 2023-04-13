import {expect} from "chai";
import sinon, { SinonStub } from "sinon";
import inquirer from "inquirer";
import chalk from "chalk";
import {HOSTED_SKILL} from "../../../../lib/utils/constants";
import {
  getSkillName,
  getSkillDefaultRegion,
  getSkillLocale,
  selectSkillCodeLanguage,
  getTargetTemplateName,
  confirmUsingUnofficialTemplate,
  getDeploymentType,
} from "../../../../lib/commands/new/ui";
import {SampleTemplate} from "../../../../lib/model/sample-template";
import { CODE_LANGUAGE_JAVA, CODE_LANGUAGE_NODEJS, CODE_LANGUAGE_PYTHON } from "../../../../lib/commands/new";


function validateInquirerConfig(stub: any, expectedConfig: {
  message: string,
  type: string,
  defaultName?: string,
  choices?: string[],
  pageSize?: number}) {
  const {message, type, defaultName, choices} = expectedConfig;
  expect(stub.message).equal(message);
  expect(stub.type).equal(type);
  if (defaultName) {
    expect(stub.default).equal(defaultName);
  }
  if (choices) {
    expect(stub.choices).deep.equal(choices);
  }
}

describe("Commands new - UI test", () => {
  const TEST_SKILL_NAME = "skillName";
  const TEST_LOCALE = "en-US";
  const TEST_REPO_NAME = "repo";
  const TEST_URL = `https://${TEST_REPO_NAME}.git?data=1`;
  const TEST_ERROR = "error";
  const TEST_LANGUAGE = "language";
  const TEST_TEMPLATE_NAME = "templateName";
  const TEST_TEMPLATE_NAME_2 = "templateName42";
  const TEST_TEMPLATE_DESC = "templateDescription1";
  const TEST_TEMPLATE_DESC_2 = "";
  const TEST_CONFIRMATION = "confirmation";
  const TEST_DEPLOYMENT_OPTION_NAME = "HOSTED_OPTION_NAME";
  const TEST_DEPLOYMENT_NAME = "HOSTED_NAME";
  const TEST_TEMPLATE_1: SampleTemplate = {
    url: "templateUrl1",
    desc: TEST_TEMPLATE_DESC,
    stack: "im",
    deploy: "lambda",
    lang: "node",
    name: TEST_TEMPLATE_NAME,
  };
  const TEST_TEMPALTE_2: SampleTemplate = {
    url: "templateUrl2",
    desc: TEST_TEMPLATE_DESC_2,
    stack: "ac",
    deploy: "cfn",
    lang: "python",
    name: TEST_TEMPLATE_NAME_2,
  };
  const TEST_TEMPLATES_MAP: SampleTemplate[] = [TEST_TEMPLATE_1, TEST_TEMPALTE_2];
  const TEST_DEPLOYMENT_MAP = [
    {
      OPTION_NAME: TEST_DEPLOYMENT_OPTION_NAME,
      NAME: TEST_DEPLOYMENT_NAME,
      DESCRIPTION: "HOSTED_DESCRIPTION",
    },{
      OPTION_NAME: "CFN_OPTION_NAME",
      NAME: "CFN_NAME",
      DESCRIPTION: "CFN_DESCRIPTION",
    }
  ];
  const TEST_TEMPLATE_CHOICES = [
      `${TEST_TEMPLATE_NAME}\n  ${chalk.gray(TEST_TEMPLATE_DESC)}`,
      `${TEST_TEMPLATE_NAME_2}\n  ${chalk.gray(TEST_TEMPLATE_DESC_2)}`];
  const TEST_DEPLOYMENT_CHOICES_WITH_SEP = [
    `${TEST_DEPLOYMENT_OPTION_NAME}\n  ${chalk.gray("HOSTED_DESCRIPTION")}`,
    `CFN_OPTION_NAME\n  ${chalk.gray("CFN_DESCRIPTION")}`,
  ];

  describe("# validate getSkillName", () => {
    let inquirerPrompt: SinonStub;
    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| getSkillName is set by user and inquirer throws exception", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      getSkillName(TEST_URL, (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Please type in your skill name: ",
          type: "input",
          defaultName: TEST_REPO_NAME,
        });
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });

    it("| set defaultName as the default hosted skill name and return correctly", (done) => {
      // setup
      inquirerPrompt.resolves({skillName: HOSTED_SKILL.DEFAULT_SKILL_NAME});
      // call
      getSkillName(null, (err, response) => {
        if (err) {
          console.log("unexpected failure in callback: err: " + err.message);
        }
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Please type in your skill name: ",
          type: "input",
          defaultName: HOSTED_SKILL.DEFAULT_SKILL_NAME,
        });
        expect(err).equal(null);
        expect(response).equal(HOSTED_SKILL.DEFAULT_SKILL_NAME);
        done();
      });
    });

    it("| getSkillName is set by user and return correctly", (done) => {
      // setup
      inquirerPrompt.resolves({skillName: TEST_SKILL_NAME});
      // call
      getSkillName(TEST_URL, (err, response) => {
        if (err) {
          console.log("unexpected failure in callback: err: " + err.message);
        }
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Please type in your skill name: ",
          type: "input",
          defaultName: TEST_REPO_NAME,
        });
        expect(err).equal(null);
        expect(response).equal(TEST_SKILL_NAME);
        done();
      });
    });

    it("| check the validate logic from inquirer and returns true", (done) => {
      // setup
      inquirerPrompt.resolves({skillName: TEST_SKILL_NAME});
      // call
      getSkillName(TEST_URL, () => {
        // verify
        expect(inquirerPrompt.args[0][0][0].validate("    ")).equal("Skill name can't be empty.");
        done();
      });
    });

    it("| check the validate logic from inquirer and returns error", (done) => {
      // setup
      inquirerPrompt.resolves({skillName: TEST_SKILL_NAME});
      // call
      getSkillName(TEST_URL, () => {
        // verify
        expect(inquirerPrompt.args[0][0][0].validate("input")).equal(true);
        done();
      });
    });
  });

  describe("# validate getSkillLocale", () => {
    let inquirerPrompt: SinonStub;
    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| getSkillLocale is set by user and inquirer throws exception", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      getSkillLocale((err, response) => {
        // verify
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });

    it("| getSkillLocale is set by user and return correctly", (done) => {
      // setup
      inquirerPrompt.resolves({locale: TEST_LOCALE});
      // call
      getSkillLocale((err, response) => {
        // verify
        expect(err).equal(null);
        expect(response).equal(TEST_LOCALE);
        done();
      });
    });
  });

  describe("# validate getSkillDefaultRegion", () => {
    let inquirerPrompt: SinonStub;
    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| getSkillDefaultRegion is set by user and inquirer throws exception", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      getSkillDefaultRegion((err, response) => {
        // verify
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });

    it("| getSkillDefaultRegion is set by user and return correctly", (done) => {
      // setup
      inquirerPrompt.resolves({region: "us-east-1"});
      // call
      getSkillDefaultRegion((err, response) => {
        // verify
        expect(err).equal(null);
        expect(response).equal("US_EAST_1");
        done();
      });
    });
  });

  describe("# validate selectSkillCodeLanguage", () => {
    let inquirerPrompt: SinonStub;
    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| language is retrieved correctly", (done) => {
      // setup
      inquirerPrompt.resolves({language: TEST_LANGUAGE});
      // call
      selectSkillCodeLanguage([CODE_LANGUAGE_NODEJS, CODE_LANGUAGE_PYTHON, CODE_LANGUAGE_JAVA], (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Choose the programming language you will use to code your skill: ",
          type: "list",
          choices: [CODE_LANGUAGE_NODEJS, CODE_LANGUAGE_PYTHON, CODE_LANGUAGE_JAVA],
        });
        expect(err).equal(null);
        expect(response).equal(TEST_LANGUAGE);
        done();
      });
    });

    it("| get language throws error from inquirer", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      selectSkillCodeLanguage([CODE_LANGUAGE_NODEJS, CODE_LANGUAGE_PYTHON, CODE_LANGUAGE_JAVA], (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Choose the programming language you will use to code your skill: ",
          type: "list",
          choices: [CODE_LANGUAGE_NODEJS, CODE_LANGUAGE_PYTHON, CODE_LANGUAGE_JAVA],
        });
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });
  });

  describe("# validate getTargetTemplateName", () => {
    let inquirerPrompt: SinonStub;

    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| sample template is retrieved correctly", (done) => {
      // setup
      inquirerPrompt.resolves({templateName: TEST_TEMPLATE_NAME});
      // call
      getTargetTemplateName(TEST_TEMPLATES_MAP, (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Choose a template to start with: ",
          type: "list",
          choices: TEST_TEMPLATE_CHOICES,
          pageSize: 30,
        });
        expect(inquirerPrompt.args[0][0][0].filter("a\nb")).equal("a");
        expect(err).equal(null);
        expect(response).equal(TEST_TEMPLATE_1);
        done();
      });
    });

    it("| get template name throws error from inquirer", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      getTargetTemplateName(TEST_TEMPLATES_MAP, (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Choose a template to start with: ",
          type: "list",
          choices: TEST_TEMPLATE_CHOICES,
          pageSize: 30,
        });
        expect(inquirerPrompt.args[0][0][0].filter("a\nb")).equal("a");
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });
  });

  describe("# validate confirmUsingUnofficialTemplate", () => {
    let inquirerPrompt: SinonStub;

    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| confirmation entered by user is retrieved correctly", (done) => {
      // setup
      inquirerPrompt.resolves({confirmation: TEST_CONFIRMATION});
      // call
      confirmUsingUnofficialTemplate((err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Would you like to continue download the skill template? ",
          type: "confirm",
        });
        expect(err).equal(null);
        expect(response).equal(TEST_CONFIRMATION);
        done();
      });
    });

    it("| get confirmation meets inquirer throws exception", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      confirmUsingUnofficialTemplate((err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Would you like to continue download the skill template? ",
          type: "confirm",
        });
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });
  });

  describe("# validate getDeploymentType", () => {
    let inquirerPrompt: SinonStub;

    beforeEach(() => {
      inquirerPrompt = sinon.stub(inquirer, "prompt");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| confirmation entered by user is retrieved correctly", (done) => {
      // setup
      inquirerPrompt.resolves({deployDelegate: TEST_DEPLOYMENT_OPTION_NAME});
      // call
      getDeploymentType(TEST_DEPLOYMENT_MAP, (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Choose a method to host your skill's backend resources: ",
          type: "list",
          choices: TEST_DEPLOYMENT_CHOICES_WITH_SEP,
        });
        expect(inquirerPrompt.args[0][0][0].filter("a \n \n b")).equal("a ");
        expect(err).equal(null);
        expect(response).equal(TEST_DEPLOYMENT_NAME);
        done();
      });
    });

    it("| get confirmation meets inquirer throws exception", (done) => {
      // setup
      inquirerPrompt.rejects(new Error(TEST_ERROR));
      // call
      getDeploymentType(TEST_DEPLOYMENT_MAP, (err, response) => {
        // verify
        validateInquirerConfig(inquirerPrompt.args[0][0][0], {
          message: "Choose a method to host your skill's backend resources: ",
          type: "list",
          choices: TEST_DEPLOYMENT_CHOICES_WITH_SEP,
        });
        expect(inquirerPrompt.args[0][0][0].filter("a \n \n b")).equal("a ");
        expect(err?.message).equal(TEST_ERROR);
        expect(response).equal(undefined);
        done();
      });
    });
  });
});
