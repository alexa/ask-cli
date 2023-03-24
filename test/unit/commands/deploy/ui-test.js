const {expect} = require("chai");
const sinon = require("sinon");

const Messenger = require("../../../../lib/view/messenger");
const CONSTANTS = require("../../../../lib/utils/constants");
const inquirer = require("inquirer");
const ResourcesConfig = require("../../../../lib/model/resources-config");
const acUtils = require("../../../../lib/utils/ac-util");
const {confirmDeploymentIfNeeded} = require("../../../../lib/commands/deploy/ui");

describe("Commands deploy test - ui test", () => {
  const TEST_PROFILE = "default";

  let infoStub;
  let errorStub;
  let warnStub;
  let inquirerStub;
  let getLastDeployTypeStub;
  let isACSkillStub;
  let callbackStub;

  beforeEach(() => {
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    warnStub = sinon.stub();
    inquirerStub = sinon.stub(inquirer, "prompt").resolves({confirmation: true});
    sinon.stub(Messenger, "getInstance").returns({
      error: errorStub,
      warn: warnStub,
    });
    getLastDeployTypeStub = sinon.stub();
    isACSkillStub = sinon.stub(acUtils, "isAcSkill");
    callbackStub = sinon.stub();
    sinon.stub(ResourcesConfig, "getInstance").returns({
      getSkillMetaLastDeployType: getLastDeployTypeStub,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("callback is called with false when user answers no when confirming deployment", (done) => {
    // setup
    getLastDeployTypeStub.returns(undefined);
    isACSkillStub.returns(true);
    inquirerStub.resolves({confirmation: false});
    // call
    confirmDeploymentIfNeeded(TEST_PROFILE, (err, answer) => {
      // verify
      expect(inquirerStub.called).to.be.true;
      expect(err).equal(null);
      expect(answer).to.be.false;
      done();
    });
  });

  it("deployment confirmation is skipped if non AC skill", (done) => {
    // setup
    getLastDeployTypeStub.returns(CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS);
    isACSkillStub.returns(false);
    // call
    confirmDeploymentIfNeeded(TEST_PROFILE, (err, answer) => {
      // verify
      expect(inquirerStub.called).to.be.false;
      expect(err).equal(null);
      expect(answer).to.be.true;
      done();
    });
  });

  it("deployment confirmation is skipped if project is ACDL ask states last deploy type is AC", (done) => {
    // setup
    getLastDeployTypeStub.returns(CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS);
    isACSkillStub.returns(true);

    // call
    confirmDeploymentIfNeeded(TEST_PROFILE, (err, answer) => {
      // verify
      expect(inquirerStub.called).to.be.false;
      expect(err).equal(null);
      expect(answer).to.be.true;
      done();
    });
  });

  it("deployment confirmation is skipped if project is IM Skill and last deploy type is AC", (done) => {
    // setup
    getLastDeployTypeStub.returns(CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS);
    isACSkillStub.returns(false);

    // call
    confirmDeploymentIfNeeded(TEST_PROFILE, (err, answer) => {
      // verify
      expect(inquirerStub.called).to.be.false;
      expect(err).equal(null);
      expect(answer).to.be.true;
      done();
    });
  });

  it("deployment confirmation is prompted when ac skill and ask states last deploy type is unset", (done) => {
    // setup
    getLastDeployTypeStub.returns(undefined);
    isACSkillStub.returns(true);

    // call
    confirmDeploymentIfNeeded(TEST_PROFILE, (err, answer) => {
      // verify
      expect(inquirerStub.called).to.be.true;
      expect(err).equal(null);
      expect(answer).to.be.true;
      done();
    });
  });

  it("deployment confirmation is prompted when ac skill and last deploy type is interaction model", (done) => {
    // setup
    getLastDeployTypeStub.returns(CONSTANTS.DEPLOYMENT_TYPE.INTERACTION_MODEL);
    isACSkillStub.returns(true);
    // call
    confirmDeploymentIfNeeded(TEST_PROFILE, (err, answer) => {
      // verify
      expect(inquirerStub.called).to.be.true;
      expect(err).equal(null);
      expect(answer).to.be.true;
      done();
    });
  });
});
