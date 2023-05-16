import {expect} from "chai";
import sinon, {SinonStub} from "sinon";
import * as ui from "../../../../lib/commands/new/ui";
import * as templateHelper from "../../../../lib/commands/new/template-helper";
import * as view from "../../../../lib/view/prompt-view";
import urlUtils from "../../../../lib/utils/url-utils";
import * as wizardHelper from "../../../../lib/commands/new/wizard-helper";
import Messenger from "../../../../lib/view/messenger";
import {TEST_SAMPLE_1_IM_HOSTED_NODE, TEST_SAMPLE_2_AC_CFN_PYTHON} from "./template-helper-test";
import { SampleTemplatesFilter } from "../../../../lib/model/sample-template";

describe("Commands new test - wizard helper test", () => {
  const TEST_ERROR = "TEST_ERROR";
  const TEST_OPTIONS = {
    ac: undefined
  };
  const TEST_LANGUAGE_RESPONSE = "NodeJS";
  const TEST_DEPLOYMENT_TYPE = "@ask-cli/cfn-deployer";
  const TEST_HOSTED_DEPLOYMENT = "@ask-cli/hosted-skill-deployer";
  const TEST_TEMPLATE_URL = "TEST_TEMPLATE_URL";
  const TEST_SKILL_NAME = "TEST_SKILL_NAME";
  const TEST_FOLDER_NAME = "TEST_FOLDER_NAME";
  const TEST_REGION = "us-east-1";
  const TEST_TEMPLATE_SAMPLES = [TEST_SAMPLE_1_IM_HOSTED_NODE, TEST_SAMPLE_2_AC_CFN_PYTHON]
  const TEST_OPTIONS_WITH_TEMPLATE = {
    templateUrl: TEST_TEMPLATE_URL,
  };

  let infoStub: SinonStub;
  let errorStub: SinonStub;
  let warnStub: SinonStub;
  let selectSkillCodeLanguageStub: SinonStub;
  let getDeploymentTypeStub: SinonStub;
  let confirmUsingUnofficialTemplateStub: SinonStub;
  let isValidUrlStub: SinonStub;
  let isUrlOfficialTemplateStub: SinonStub;
  let getTargetTemplateNameStub: SinonStub;
  let getSkillNameStub: SinonStub;
  let getProjectFolderNameStub: SinonStub;
  let getSkillDefaultRegionStub: SinonStub;
  let getSkillLocaleStub: SinonStub;
  let getInstanceStub: SinonStub;
  let getSampleTemplatesFromS3Stub: SinonStub;

  beforeEach(() => {
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    warnStub = sinon.stub();
    getInstanceStub = sinon.stub(Messenger, "getInstance");
    getInstanceStub.returns({
      info: infoStub,
      error: errorStub,
      warn: warnStub,
    });
    selectSkillCodeLanguageStub = sinon.stub(ui, "selectSkillCodeLanguage");
    getDeploymentTypeStub = sinon.stub(ui, "getDeploymentType");
    confirmUsingUnofficialTemplateStub = sinon.stub(ui, "confirmUsingUnofficialTemplate");
    isValidUrlStub = sinon.stub(urlUtils, "isValidUrl");
    isUrlOfficialTemplateStub = sinon.stub(urlUtils, "isUrlOfficialTemplate");
    getTargetTemplateNameStub = sinon.stub(ui, "getTargetTemplateName");
    getSkillNameStub = sinon.stub(ui, "getSkillName");
    getProjectFolderNameStub = sinon.stub(view, "getProjectFolderName");
    getSkillDefaultRegionStub = sinon.stub(ui, "getSkillDefaultRegion");
    getSkillLocaleStub = sinon.stub(ui, "getSkillLocale");
    getSkillLocaleStub.yields(null, "en-US");
    getSkillLocaleStub.yields(null, "us-east-1");
    getSampleTemplatesFromS3Stub = sinon.stub(templateHelper, "getSampleTemplatesFromS3");
    getSampleTemplatesFromS3Stub.resolves(TEST_TEMPLATE_SAMPLES);

    // create UI stub default responses
    getSkillNameStub.callsArgWith(0, null, TEST_SKILL_NAME);
    getProjectFolderNameStub.callsArgWith(1, null, TEST_FOLDER_NAME);
    getDeploymentTypeStub.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
    getSkillDefaultRegionStub.yields(null, TEST_REGION);
    selectSkillCodeLanguageStub.callsArgWith(1, null, TEST_LANGUAGE_RESPONSE)
  });

  afterEach(() => {
    sinon.restore();
  });
  describe("# test wizard helper method - collectUserCreationProjectInfo", () => {
    it("| user input selectSkillCodeLanguage fails, expect throw error", (done) => {
      // setup
      getDeploymentTypeStub.yields(null, TEST_HOSTED_DEPLOYMENT);
      selectSkillCodeLanguageStub.callsArgWith(1, TEST_ERROR);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it("| user input getDeploymentType fails, expect throw error", (done) => {
      // setup
      getDeploymentTypeStub.callsArgWith(1, TEST_ERROR);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it.skip("| user input getSkillLocale fails, expect throw error", (done) => {
      // skipped because locale is hard coded until backend for hosted skills supports locales
      // setup
      getDeploymentTypeStub.yields(null, TEST_HOSTED_DEPLOYMENT);
      getSkillLocaleStub.yields(TEST_ERROR);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it("| user input getSkillDefaultRegion fails, expect throw error", (done) => {
      // setup
      getDeploymentTypeStub.yields(null, TEST_HOSTED_DEPLOYMENT);
      getSkillDefaultRegionStub.yields(TEST_ERROR);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it("| custom template with invalid url, expect throw error", (done) => {
      // setup
      const TEST_GIT_ERROR = `The provided template url ${TEST_TEMPLATE_URL} is not a valid url.`;
      isValidUrlStub.returns(false);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
        // verify
        expect(err?.message).equal(TEST_GIT_ERROR);
        done();
      });
    });

    it("| user input confirmUsingUnofficialTemplate fails, expect throw error", (done) => {
      // setup
      isValidUrlStub.returns(true);
      isUrlOfficialTemplateStub.returns(false);
      confirmUsingUnofficialTemplateStub.callsArgWith(0, TEST_ERROR);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        expect(infoStub.callCount).equal(0);
        expect(warnStub.callCount).equal(1);
        done();
      });
    });

    it("| users do not confirm using unofficial template, return without templateInfo, expect return directly", (done) => {
      // setup
      isValidUrlStub.returns(true);
      isUrlOfficialTemplateStub.returns(false);
      confirmUsingUnofficialTemplateStub.callsArgWith(0, null, false);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res).equal(undefined);
        expect(infoStub.callCount).equal(0);
        expect(warnStub.callCount).equal(1);
        done();
      });
    });

    // TODO: when host all templates at github and use http call to get template list, get following three tests back
    //         it('| new with official template, retrieve official template map fails, expect throw error', (done) => {
    //             // setup
    //             const TEST_HTTP_RESPONSE = {
    //                 statusCode: 300,
    //                 body: {}
    //             };
    //             const TEST_HTTP_ERROR = `Failed to retrieve the template list, please see the details from the error response.
    // ${JSON.stringify(TEST_HTTP_RESPONSE, null, 2)}`;
    //             httpClient.request.callsArgWith(3, null, TEST_HTTP_RESPONSE);
    //             // call
    //             wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
    //                 // verify
    //                 expect(err?.message).equal(TEST_HTTP_ERROR);
    //                 done();
    //             });
    //         });

    // it('| user input getTargetTemplateName fails, expect throw error', (done) => {
    //     // setup
    //     const TEST_HTTP_RESPONSE = {
    //         statusCode: 200,
    //         body: TEST_TEMPLATE_MAP_STRING
    //     };
    //     httpClient.request.callsArgWith(3, null, TEST_HTTP_RESPONSE);
    //     getTargetTemplateNameStub.callsArgWith(1, TEST_ERROR);
    //     // call
    //     wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
    //         // verify
    //         expect(err?.message).equal(TEST_ERROR);
    //         done();
    //     });
    // });

    // it('| user input getSkillName fails, expect throw error', (done) => {
    //     // setup
    //     const TEST_HTTP_RESPONSE = {
    //         statusCode: 200,
    //         body: JSON.stringify(TEST_TEMPLATE_MAP)
    //     };
    //     getDeploymentTypeStub.callsArgWith(1, null);
    //     httpClient.request.callsArgWith(3, null, TEST_HTTP_RESPONSE);
    //     getSkillNameStub.callsArgWith(1, TEST_ERROR);
    //     // call
    //     wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
    //         // verify
    //         expect(err?.message).equal(TEST_ERROR);
    //         done();
    //     });
    // });

    it("| user input getProjectFolderName fails, expect throw error", (done) => {
      // setup
      isValidUrlStub.returns(true);
      isUrlOfficialTemplateStub.returns(true);
      getProjectFolderNameStub.callsArgWith(1, TEST_ERROR);

      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
        // verify
        expect(err).equal(TEST_ERROR);
        done();
      });
    });

    it("| collectUserCreationProjectInfo Hosted selections should not prompt for template sample selection", (done) => {
      // setup
      getDeploymentTypeStub.callsArgWith(1, null, TEST_HOSTED_DEPLOYMENT);

      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res?.deploymentType).equal(TEST_HOSTED_DEPLOYMENT);
        expect(getTargetTemplateNameStub).not.called;
        expect(res?.language).equal(TEST_LANGUAGE_RESPONSE);
        expect(res?.projectFolderName).equal(TEST_FOLDER_NAME);
        expect(res?.skillName).equal(TEST_SKILL_NAME);
        expect(res?.templateInfo).to.be.undefined;
        done();
      });
    });

    it("| collectUserCreationProjectInfo called with 'ac' cmd option should filter templates to 'ac'", (done) => {
      // setup
      getDeploymentTypeStub.callsArgWith(1, null, TEST_HOSTED_DEPLOYMENT);

      sinon.stub(TEST_OPTIONS, "ac").value(true);
      const filterStub = sinon.spy(SampleTemplatesFilter.prototype, "filter");
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, () => {
        // verify
        expect(filterStub.calledWith("stack", "ac")).to.be.true;
        done();
      });
    });

    it("| collectUserCreationProjectInfo called without 'ac' cmd option should filter templates to 'im'", (done) => {
      // setup
      getDeploymentTypeStub.callsArgWith(1, null, TEST_HOSTED_DEPLOYMENT);

      sinon.stub(TEST_OPTIONS, "ac").value(undefined);
      const filterStub = sinon.spy(SampleTemplatesFilter.prototype, "filter");
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, () => {
        // verify
        expect(filterStub.calledWith("stack", "im")).to.be.true;
        done();
      });
    });


    it("| collectUserCreationProjectInfo succeed, expect userInput return", (done) => {
      // setup

      getTargetTemplateNameStub.yields(null, TEST_SAMPLE_1_IM_HOSTED_NODE);
      // call
      wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err, res) => {
        // verify
        expect(err).equal(null);
        expect(res?.deploymentType).equal(TEST_DEPLOYMENT_TYPE);
        expect(res?.language).equal(TEST_LANGUAGE_RESPONSE);
        expect(res?.projectFolderName).equal(TEST_FOLDER_NAME);
        expect(res?.skillName).equal(TEST_SKILL_NAME);
        expect(res?.templateInfo?.templateBranch).equal(TEST_SAMPLE_1_IM_HOSTED_NODE.branch);
        expect(res?.templateInfo?.templateUrl).equal(TEST_SAMPLE_1_IM_HOSTED_NODE.url);
        expect(res?.templateInfo?.templateName).equal(TEST_SAMPLE_1_IM_HOSTED_NODE.name);
        done();
      });
    });
  });
});
