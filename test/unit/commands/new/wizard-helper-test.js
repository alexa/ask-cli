const { expect } = require('chai');
const sinon = require('sinon');

const httpClient = require('@src/clients/http-client');
const ui = require('@src/commands/new/ui');
const urlUtils = require('@src/utils/url-utils');
const wizardHelper = require('@src/commands/new/wizard-helper');
const Messenger = require('@src/view/messenger');

describe('Commands new test - wizard helper test', () => {
    const TEST_ERROR = 'TEST_ERROR';
    const TEST_OPTIONS = {};
    const TEST_LANGUAGE_RESPONSE = 'NodeJS';
    const TEST_DEPLOYMENT_TYPE = '@ask-cli/cfn-deployer';
    const TEST_HOSTED_DEPLOYMENT = '@ask-cli/hosted-skill-deployer';
    const TEST_TEMPLATE_URL = 'TEST_TEMPLATE_URL';
    const TEST_TEMPLATE_NAME = 'TEST_TEMPLATE_NAME';
    const TEST_SKILL_NAME = 'TEST_SKILL_NAME';
    const TEST_FOLDER_NAME = 'TEST_FOLDER_NAME';
    const TEST_TEMPLATE_MAP_STRING = `{"${TEST_TEMPLATE_NAME}":{"url":"${TEST_TEMPLATE_URL}"}}`;
    const TEST_TEMPLATE_MAP = {
        [TEST_TEMPLATE_NAME]: {
            url: TEST_TEMPLATE_URL
        }
    };
    const TEST_OPTIONS_WITH_TEMPLATE = {
        templateUrl: TEST_TEMPLATE_URL
    };

    let infoStub;
    let errorStub;
    let warnStub;

    beforeEach(() => {
        infoStub = sinon.stub();
        errorStub = sinon.stub();
        warnStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub,
            error: errorStub,
            warn: warnStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });
    describe('# test wizard helper method - collectUserCreationProjectInfo', () => {
        beforeEach(() => {
            sinon.stub(ui, 'selectSkillCodeLanguage');
            sinon.stub(ui, 'getDeploymentType');
            sinon.stub(ui, 'confirmUsingUnofficialTemplate');
            sinon.stub(urlUtils, 'isValidUrl');
            sinon.stub(urlUtils, 'isUrlOfficialTemplate');
            sinon.stub(httpClient, 'request');
            sinon.stub(ui, 'getTargetTemplateName');
            sinon.stub(ui, 'getSkillName');
            sinon.stub(ui, 'getProjectFolderName');
            sinon.stub(ui, 'getSkillDefaultRegion');
            sinon.stub(ui, 'getSkillLocale');
            ui.getSkillLocale.yields(null, 'en-US');
            ui.getSkillDefaultRegion.yields(0, null, 'US_EAST_1');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| user input selectSkillCodeLanguage fails, expect throw error', (done) => {
            // setup
            ui.selectSkillCodeLanguage.callsArgWith(0, TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| user input getDeploymentType fails, expect throw error', (done) => {
            // setup
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| user input getSkillLocale fails, expect throw error', (done) => {
            // setup
            ui.selectSkillCodeLanguage.yields(null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.yields(null, TEST_HOSTED_DEPLOYMENT);
            ui.getSkillLocale.yields(TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| user input getSkillDefaultRegion fails, expect throw error', (done) => {
            // setup
            ui.selectSkillCodeLanguage.yields(null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.yields(null, TEST_HOSTED_DEPLOYMENT);
            ui.getSkillDefaultRegion.yields(TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| Hosted skills do not support Java, expect throw error', (done) => {
            // setup
            const TEST_HOSTED_ERROR = 'Alexa hosted skills don\'t support Java currently.';
            ui.selectSkillCodeLanguage.callsArgWith(0, null, 'Java');
            ui.getDeploymentType.callsArgWith(1, null, TEST_HOSTED_DEPLOYMENT);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_HOSTED_ERROR);
                done();
            });
        });

        it('| Hosted skills do not support custom template, expect throw error', (done) => {
            // setup
            const TEST_HOSTED_ERROR = 'No custom template allowed for an Alexa hosted skill.';
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_HOSTED_DEPLOYMENT);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
                // verify
                expect(err).equal(TEST_HOSTED_ERROR);
                done();
            });
        });

        it('| custom template should not valid url, expect throw error', (done) => {
            // setup
            const TEST_GIT_ERROR = `The provided template url ${TEST_TEMPLATE_URL} is not a valid url.`;
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
            urlUtils.isValidUrl.returns(false);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
                // verify
                expect(err).equal(TEST_GIT_ERROR);
                done();
            });
        });

        it('| user input confirmUsingUnofficialTemplate fails, expect throw error', (done) => {
            // setup
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
            urlUtils.isValidUrl.returns(true);
            urlUtils.isUrlOfficialTemplate.returns(false);
            ui.confirmUsingUnofficialTemplate.callsArgWith(0, TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(1);
                done();
            });
        });

        it('| users do not confirm using unofficial template, return without templateInfo, expect return directly', (done) => {
            // setup
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
            urlUtils.isValidUrl.returns(true);
            urlUtils.isUrlOfficialTemplate.returns(false);
            ui.confirmUsingUnofficialTemplate.callsArgWith(0, null, false);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err, res) => {
                // verify
                expect(err).equal(undefined);
                expect(res).equal(undefined);
                expect(infoStub.callCount).equal(0);
                expect(warnStub.callCount).equal(1);
                done();
            });
        });

        it('| new with official template, retrieve official template map fails, expect throw error', (done) => {
            // setup
            const TEST_HTTP_RESPONSE = {
                statusCode: 300,
                body: {}
            };
            const TEST_HTTP_ERROR = 'Failed to retrieve the template list. Please run again with --debug to check more details.';
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
            httpClient.request.callsArgWith(3, null, TEST_HTTP_RESPONSE);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_HTTP_ERROR);
                done();
            });
        });

        it('| user input getTargetTemplateName fails, expect throw error', (done) => {
            // setup
            const TEST_HTTP_RESPONSE = {
                statusCode: 200,
                body: TEST_TEMPLATE_MAP_STRING
            };
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
            httpClient.request.callsArgWith(3, null, TEST_HTTP_RESPONSE);
            ui.getTargetTemplateName.callsArgWith(1, TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| user input getSkillName fails, expect throw error', (done) => {
            // setup
            const TEST_HTTP_RESPONSE = {
                statusCode: 200,
                body: TEST_TEMPLATE_MAP
            };
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null);
            httpClient.request.callsArgWith(3, null, TEST_HTTP_RESPONSE);
            ui.getTargetTemplateName.callsArgWith(1, null, TEST_TEMPLATE_NAME);
            ui.getSkillName.callsArgWith(1, TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| user input getProjectFolderName fails, expect throw error', (done) => {
            // setup
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_DEPLOYMENT_TYPE);
            urlUtils.isValidUrl.returns(true);
            urlUtils.isUrlOfficialTemplate.returns(true);
            ui.getSkillName.callsArgWith(1, null, TEST_SKILL_NAME);
            ui.getProjectFolderName.callsArgWith(1, TEST_ERROR);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS_WITH_TEMPLATE, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                done();
            });
        });

        it('| collectUserCreationProjectInfo succeed, expect userInput return', (done) => {
            // setup
            ui.selectSkillCodeLanguage.callsArgWith(0, null, TEST_LANGUAGE_RESPONSE);
            ui.getDeploymentType.callsArgWith(1, null, TEST_HOSTED_DEPLOYMENT);
            ui.getSkillName.callsArgWith(1, null, TEST_SKILL_NAME);
            ui.getProjectFolderName.callsArgWith(1, null, TEST_FOLDER_NAME);
            // call
            wizardHelper.collectUserCreationProjectInfo(TEST_OPTIONS, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res.deploymentType).equal(TEST_HOSTED_DEPLOYMENT);
                expect(res.language).equal(TEST_LANGUAGE_RESPONSE);
                expect(res.projectFolderName).equal(TEST_FOLDER_NAME);
                expect(res.skillName).equal(TEST_SKILL_NAME);
                done();
            });
        });
    });
});
