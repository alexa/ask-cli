const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const httpClient = require('@src/clients/http-client');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const DeployDelegate = require('@src/controllers/skill-infrastructure-controller/deploy-delegate');
const MultiTasksView = require('@src/view/multi-tasks-view');
const jsonView = require('@src/view/json-view');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const hashUtils = require('@src/utils/hash-utils');

describe('Controller test - skill infrastructure controller test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'resources-config.json');
    const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');
    const TEST_PROFILE = 'default'; // test file uses 'default' profile
    const TEST_WORKSPACE = 'workspace';
    const TEST_CONFIGURATION = {
        profile: TEST_PROFILE,
        doDebug: false
    };
    const TEST_USER_CONFIG = {
        user: 'config'
    };

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a SkillInfrastructureController class', () => {
            const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);
            expect(skillInfraController).to.be.instanceOf(SkillInfrastructureController);
            expect(skillInfraController.profile).equal(TEST_PROFILE);
            expect(skillInfraController.doDebug).equal(false);
        });
    });

    describe('# test class method: bootstrapInfrastructures', () => {
        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| skill infrastructures infra type not set, expect error is called back', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillInfraType(TEST_PROFILE, '   ');
            // call
            skillInfraController.bootstrapInfrastructures(TEST_WORKSPACE, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('[Error]: Please set the "type" field for your skill infrastructures.');
                done();
            });
        });

        it('| loading deploy delegate error, expect error is called back', (done) => {
            // setup
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, 'error');
            // call
            skillInfraController.bootstrapInfrastructures(TEST_WORKSPACE, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| loading deploy delegate pass but bootstrap fails, expect error is called back', (done) => {
            // setup
            const bootstrapStub = sinon.stub();
            const mockDeployDelegate = {
                bootstrap: bootstrapStub,
                invoke: () => 'invoke'
            };
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, null, mockDeployDelegate);
            bootstrapStub.callsArgWith(1, 'error');
            // call
            skillInfraController.bootstrapInfrastructures(TEST_WORKSPACE, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| loading deploy delegate and its bootstrap pass, expect config is called correctly in each step', (done) => {
            // setup
            const oldUserConfig = ResourcesConfig.getInstance().getSkillInfraUserConfig(TEST_PROFILE);
            const bootstrapStub = sinon.stub();
            const mockDeployDelegate = {
                bootstrap: bootstrapStub,
                invoke: () => 'invoke'
            };
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, null, mockDeployDelegate);
            bootstrapStub.callsArgWith(1, null, { userConfig: TEST_USER_CONFIG });
            // call
            skillInfraController.bootstrapInfrastructures(TEST_WORKSPACE, (err, res) => {
                // verify
                expect(bootstrapStub.args[0][0].workspacePath).equal(TEST_WORKSPACE);
                expect(bootstrapStub.args[0][0].userConfig).equal(oldUserConfig);
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                expect(ResourcesConfig.getInstance().getSkillInfraUserConfig(TEST_PROFILE)).deep.equal(TEST_USER_CONFIG);
                done();
            });
        });
    });

    describe('# test class method: deployInfrastructure', () => {
        const TEST_DEPLOY_DELEGATE = {};
        const TEST_DEPLOY_RESULT = {
            default: {
                endpoint: {
                    url: 'TEST_URL'
                },
                lastDeployHash: 'TEST_HASH',
                deployState: {}
            }
        };
        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| prepare deploy delegate fails, expect error called back', (done) => {
            // setup
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, 'error');
            // call
            skillInfraController.deployInfrastructure((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| deploy infra to all regions fails, expect error called back', (done) => {
            // setup
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, null, TEST_DEPLOY_DELEGATE);
            sinon.stub(SkillInfrastructureController.prototype, 'deployInfraToAllRegions').callsArgWith(1, 'error');
            // call
            skillInfraController.deployInfrastructure((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| deploy to all regions passes but update skill manifest after deploy fails, expect error called back', (done) => {
            // setup
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, null, TEST_DEPLOY_DELEGATE);
            sinon.stub(SkillInfrastructureController.prototype, 'deployInfraToAllRegions').callsArgWith(1, null, TEST_DEPLOY_RESULT);
            sinon.stub(SkillInfrastructureController.prototype, 'updateSkillManifestWithDeployResult').callsArgWith(1, 'error');
            sinon.stub(fs, 'writeFileSync');
            // call
            skillInfraController.deployInfrastructure((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| update resources config and update skill manifest after deploy pass, expect no error called back', (done) => {
            // setup
            sinon.stub(DeployDelegate, 'load').callsArgWith(1, null, TEST_DEPLOY_DELEGATE);
            sinon.stub(SkillInfrastructureController.prototype, 'deployInfraToAllRegions').callsArgWith(1, null, TEST_DEPLOY_RESULT);
            sinon.stub(SkillInfrastructureController.prototype, 'updateSkillManifestWithDeployResult').callsArgWith(1, null);
            sinon.stub(fs, 'writeFileSync');
            // call
            skillInfraController.deployInfrastructure((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });
    });

    describe('# test class method: deployInfraToAllRegions', () => {
        const TEST_DD = {};
        let ddStub;
        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
            ddStub = sinon.stub();
            TEST_DD.validateDeployDelegateResponse = ddStub;
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            Manifest.dispose();
            sinon.restore();
        });

        it('| code does not have any region, expect error called back', (done) => {
            // setup
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, {});
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('[Warn]: Skip the infrastructure deployment, as the "code" field has not been set in the resources config file.');
                done();
            });
        });

        it('| skill name failed to parse, expect error called back', (done) => {
            // setup
            Manifest.getInstance().setSkillName('中文  ');
            sinon.stub(path, 'basename').returns('中文  ');
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('[Error]: Failed to parse the skill name used to decide the CloudFormation stack name. '
                    + 'Please make sure your skill name or skill project folder basename contains alphanumeric characters.');
                done();
            });
        });

        it('| start multi-tasks fails, expect error called back', (done) => {
            // setup
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, {
                default: {},
                NA: {}
            });
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, { error: 'error' });
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                expect(MultiTasksView.prototype.loadTask.callCount).equal(2);
                expect(MultiTasksView.prototype.loadTask.args[0][1]).equal('Deploy Alexa skill infrastructure for region "default"');
                expect(MultiTasksView.prototype.loadTask.args[0][2]).equal('default');
                expect(MultiTasksView.prototype.loadTask.args[1][1]).equal('Deploy Alexa skill infrastructure for region "NA"');
                expect(MultiTasksView.prototype.loadTask.args[1][2]).equal('NA');
                done();
            });
        });

        it('| start multi-tasks fails partially, expect error called back and state updated', (done) => {
            // setup
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, {
                default: {},
                NA: {}
            });
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, { error: 'error', partialResult: { NA: 'partial' } });
            sinon.stub(SkillInfrastructureController.prototype, '_updateResourcesConfig');
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                expect(SkillInfrastructureController.prototype._updateResourcesConfig.args[0][0]).deep.equal({ NA: 'partial' });
                done();
            });
        });

        it('| deploy delegate validate response fails, expect error called back', (done) => {
            // setup
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, {
                default: {},
                NA: {}
            });
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0);
            ddStub.throws(new Error('error'));
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err.message).equal('error');
                done();
            });
        });

        it('| deploy infra to all regions pass, expect no error called back', (done) => {
            // setup
            ResourcesConfig.getInstance().setCode(TEST_PROFILE, {
                default: {},
                NA: {}
            });
            sinon.stub(SkillInfrastructureController.prototype, '_deployInfraByRegion');
            sinon.stub(SkillInfrastructureController.prototype, '_updateResourcesConfig');
            sinon.stub(MultiTasksView.prototype, 'loadTask').callsArgWith(0);
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, null, {});
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).deep.equal({});
                expect(err).equal(null);
                expect(MultiTasksView.prototype.loadTask.callCount).equal(2);
                expect(MultiTasksView.prototype.loadTask.args[0][1]).equal('Deploy Alexa skill infrastructure for region "default"');
                expect(MultiTasksView.prototype.loadTask.args[0][2]).equal('default');
                expect(MultiTasksView.prototype.loadTask.args[1][1]).equal('Deploy Alexa skill infrastructure for region "NA"');
                expect(MultiTasksView.prototype.loadTask.args[1][2]).equal('NA');
                done();
            });
        });
    });

    describe('# test class method: updateSkillManifestWithDeployResult', () => {
        const TEST_DEPLOY_RESULT = {
            default: {
                endpoint: {
                    url: 'TEST_URL1'
                }
            },
            EU: {
                endpoint: {
                    url: 'TEST_URL2'
                }
            }
        };
        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
            sinon.stub(fs, 'writeFileSync');
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            Manifest.dispose();
            sinon.restore();
        });

        it('| manifest update correctly but smapi client fails, expect error called back', (done) => {
            // setup
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead').callsArgWith(2);
            sinon.stub(httpClient, 'request').callsArgWith(3, 'request error');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('request error');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                done();
            });
        });

        it('| manifest update correctly but response status code is error, expect service error called back', (done) => {
            // setup
            const TEST_SMAPI_RESPONSE = {
                statusCode: 401,
                body: { test: 'error' }
            };
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead').callsArgWith(2);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_SMAPI_RESPONSE);
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(jsonView.toString(TEST_SMAPI_RESPONSE.body));
                done();
            });
        });

        it('| manifest update correctly but response status code is error, expect service error called back', (done) => {
            // setup
            const TEST_SMAPI_RESPONSE = {
                statusCode: 202
            };
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead').callsArgWith(2);
            sinon.stub(httpClient, 'request').callsArgWith(3, null, TEST_SMAPI_RESPONSE);
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });
    });

    describe('# test class method: _deployInfraByRegion', () => {
        let ddStub;
        const TEST_REPORTER = {};
        const TEST_DD = {};
        const TEST_REGION = 'default';
        const TEST_SKILL_NAME = 'skillName';
        const TEST_HASH = 'hash';

        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(path, 'resolve').returns('base');
            sinon.stub(fs, 'statSync').returns({
                isDirectory: () => true
            });
            ddStub = sinon.stub();
            TEST_DD.invoke = ddStub;
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| get hash fails, expect error called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, 'hash error');
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('hash error');
                done();
            });
        });

        it('| deploy delegate invoke fails, expect error called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            ResourcesConfig.getInstance().setCodeLastDeployHashByRegion(TEST_PROFILE, TEST_REGION, TEST_HASH);
            ddStub.callsArgWith(2, 'invoke error');
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('invoke error');
                expect(ddStub.args[0][1].code.isCodeModified).equal(false);
                done();
            });
        });

        it('| deploy delegate invoke passes without deployState, expect invoke result called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            ddStub.callsArgWith(2, null, { invoke: 'result' });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, (err, res) => {
                // verify
                expect(res).deep.equal({
                    invoke: 'result'
                });
                expect(err).equal(null);
                done();
            });
        });

        it('| deploy delegate invoke passes, expect invoke result called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            ddStub.callsArgWith(2, null, { deployState: { s3: { invoke: 'test' } } });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, (err, res) => {
                // verify
                expect(res).deep.equal({
                    deployState: { s3: { invoke: 'test' } },
                    lastDeployHash: TEST_HASH
                });
                expect(err).equal(null);
                done();
            });
        });

        it('| deploy delegate invoke partial succeed with reasons called back, expect invoke result called back along with the message', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            ddStub.callsArgWith(2, null, { reasons: 'reasons', message: 'message', deployState: { s3: 'test' } });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).deep.equal({
                    message: 'message',
                    context: {
                        deployState: { s3: 'test' },
                        lastDeployHash: TEST_HASH
                    }
                });
                done();
            });
        });
    });

    describe('# test class method: _updateResourcesConfig', () => {
        const TEST_DEPLOY_RESULT = {
            default: {
                endpoint: {
                    url: 'TEST_URL'
                },
                lastDeployHash: 'TEST_HASH',
                deployState: {}
            }
        };

        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(fs, 'writeFileSync');
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| update resources config correctly', () => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, 'hash error');
            // call
            skillInfraController._updateResourcesConfig(TEST_DEPLOY_RESULT);
            // verify
            expect(ResourcesConfig.getInstance().getCodeLastDeployHashByRegion(TEST_PROFILE, 'default')).equal('TEST_HASH');
            expect(ResourcesConfig.getInstance().getSkillInfraDeployState(TEST_PROFILE)).deep.equal({ default: {} });
            expect(fs.writeFileSync.callCount).equal(1);
        });
    });
});
