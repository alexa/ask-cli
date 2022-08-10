const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const SkillInfrastructureController = require('@src/controllers/skill-infrastructure-controller');
const DeployDelegate = require('@src/controllers/skill-infrastructure-controller/deploy-delegate');
const MultiTasksView = require('@src/view/multi-tasks-view');
const AuthorizationController = require('@src/controllers/authorization-controller');
const profileHelper = require('@src/utils/profile-helper');
const hashUtils = require('@src/utils/hash-utils');

describe('Controller test - skill infrastructure controller test', () => {
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'regular-proj', 'ask-resources.json');
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
        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
            TEST_DD.validateDeployDelegateResponse = sinon.stub();
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            Manifest.dispose();
            sinon.restore();
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

        it('| code does not have any region, expect error called back', (done) => {
            // setup
            sinon.stub(ResourcesConfig.prototype, 'getCodeRegions').returns([]);
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('[Warn]: Skip the infrastructure deployment, as the "code" field has not been set in the resources config file.');
                done();
            });
        });

        it('| start multi-tasks fails, expect error called back', (done) => {
            // setup
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, { error: 'error' });
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                expect(MultiTasksView.prototype.loadTask.callCount).equal(3);
                expect(MultiTasksView.prototype.loadTask.args[0][1]).equal('Deploy Alexa skill infrastructure for region "default"');
                expect(MultiTasksView.prototype.loadTask.args[0][2]).equal('default');
                expect(MultiTasksView.prototype.loadTask.args[1][1]).equal('Deploy Alexa skill infrastructure for region "NA"');
                expect(MultiTasksView.prototype.loadTask.args[1][2]).equal('NA');
                expect(MultiTasksView.prototype.loadTask.args[2][1]).equal('Deploy Alexa skill infrastructure for region "EU"');
                expect(MultiTasksView.prototype.loadTask.args[2][2]).equal('EU');
                done();
            });
        });

        it('| start multi-tasks fails partially, expect error called back and state updated', (done) => {
            // setup
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, { error: 'error', partialResult: { NA: 'partial' } });
            sinon.stub(SkillInfrastructureController.prototype, '_updateResourcesConfig');
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                expect(SkillInfrastructureController.prototype._updateResourcesConfig.args[0][1]).deep.equal({ NA: 'partial' });
                done();
            });
        });

        it('| deploy delegate validate response fails, expect error called back', (done) => {
            // setup
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0);
            TEST_DD.validateDeployDelegateResponse.throws(new Error('error'));
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
            sinon.stub(SkillInfrastructureController.prototype, '_deployInfraByRegion');
            sinon.stub(SkillInfrastructureController.prototype, '_updateResourcesConfig');
            sinon.stub(MultiTasksView.prototype, 'loadTask').callsArgWith(0);
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, null, {});
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).deep.equal({});
                expect(err).equal(null);
                expect(MultiTasksView.prototype.loadTask.callCount).equal(3);
                expect(MultiTasksView.prototype.loadTask.args[0][1]).equal('Deploy Alexa skill infrastructure for region "default"');
                expect(MultiTasksView.prototype.loadTask.args[0][2]).equal('default');
                expect(MultiTasksView.prototype.loadTask.args[1][1]).equal('Deploy Alexa skill infrastructure for region "NA"');
                expect(MultiTasksView.prototype.loadTask.args[1][2]).equal('NA');
                expect(MultiTasksView.prototype.loadTask.args[2][1]).equal('Deploy Alexa skill infrastructure for region "EU"');
                expect(MultiTasksView.prototype.loadTask.args[2][2]).equal('EU');
                done();
            });
        });

        it('| deploy infra to all regions pass with skip, expect no error called back and skipped result updated', (done) => {
            // setup
            sinon.stub(SkillInfrastructureController.prototype, '_deployInfraByRegion');
            sinon.stub(SkillInfrastructureController.prototype, '_updateResourcesConfig');
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, null, {
              default: 'success',
              NA: { isDeploySkipped: true, deployRegion: 'default' },
              EU: 'success'
            });
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).deep.equal({ default: 'success', NA: 'success', EU: 'success' });
                expect(err).equal(null);
                done();
            });
        });

        it('| deploy infra to all regions fails partially with skip, expect error called back and skipped result updated', (done) => {
            // setup
            sinon.stub(SkillInfrastructureController.prototype, '_deployInfraByRegion');
            sinon.stub(SkillInfrastructureController.prototype, '_updateResourcesConfig');
            sinon.stub(MultiTasksView.prototype, 'loadTask');
            sinon.stub(MultiTasksView.prototype, 'start').callsArgWith(0, {
                error: 'error',
                partialResult: {
                    default: 'partial',
                    NA: { isDeploySkipped: true, deployRegion: 'default' },
                    EU: 'partial'
                }
            });
            // call
            skillInfraController.deployInfraToAllRegions(TEST_DD, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                expect(SkillInfrastructureController.prototype._updateResourcesConfig.args[0][1]).deep.equal({
                  default: 'partial',
                  NA: 'partial',
                  EU: 'partial'
                });
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
            sinon.stub(fse, 'writeFileSync');
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            Manifest.dispose();
            sinon.restore();
        });

        it('| manifest update correctly but hash fails, expect error called back', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, 'hash error');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('hash error');
                expect(hashUtils.getHash.args[0][0]).equal(ResourcesConfig.getInstance().getSkillMetaSrc(TEST_PROFILE));
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                done();
            });
        });

        it('| manifest update correctly but hash is same, expect called back with nothing', (done) => {
            // setup
            ResourcesConfig.getInstance().setSkillMetaLastDeployHash(TEST_PROFILE, 'TEST_HASH');
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, 'TEST_HASH');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                done();
            });
        });

        it('| manifest update correctly but skill manifest update fails, expect update error called back', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, 'TEST_HASH');
            sinon.stub(SkillInfrastructureController.prototype, '_ensureSkillManifestGotUpdated').callsArgWith(0, 'update error');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('update error');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                done();
            });
        });

        it('| manifest update correctly, expect success message and new hash set', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, 'TEST_HASH');
            sinon.stub(SkillInfrastructureController.prototype, '_ensureSkillManifestGotUpdated').callsArgWith(0);
            const setApisEndpointByDomainRegionSpy = sinon.spy(Manifest.prototype, 'setApisEndpointByDomainRegion');
            const setEventsEndpointByRegionSpy = sinon.spy(Manifest.prototype, 'setEventsEndpointByRegion');
            const setEventsPublicationsSpy = sinon.spy(Manifest.prototype, 'setEventsPublications');
            const setEventsSubscriptionsSpy = sinon.spy(Manifest.prototype, 'setEventsSubscriptions');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                expect(setApisEndpointByDomainRegionSpy.callCount).eq(4);
                expect(setEventsEndpointByRegionSpy.callCount).eq(0);
                expect(setEventsPublicationsSpy.callCount).eq(0);
                expect(setEventsSubscriptionsSpy.callCount).eq(0);
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal('TEST_HASH');
                done();
            });
        });

        it('| manifest update correctly with events endpoint only, expect success message and new hash set', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, 'TEST_HASH');
            sinon.stub(SkillInfrastructureController.prototype, '_ensureSkillManifestGotUpdated').callsArgWith(0);
            sinon.stub(ResourcesConfig.prototype, 'getSkillEvents').returns({});
            const setApisEndpointByDomainRegionSpy = sinon.spy(Manifest.prototype, 'setApisEndpointByDomainRegion');
            const setEventsEndpointByRegionSpy = sinon.spy(Manifest.prototype, 'setEventsEndpointByRegion');
            const setEventsPublicationsSpy = sinon.spy(Manifest.prototype, 'setEventsPublications');
            const setEventsSubscriptionsSpy = sinon.spy(Manifest.prototype, 'setEventsSubscriptions');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                expect(setApisEndpointByDomainRegionSpy.callCount).eq(4);
                expect(setEventsEndpointByRegionSpy.callCount).eq(2);
                expect(setEventsPublicationsSpy.callCount).eq(0);
                expect(setEventsSubscriptionsSpy.callCount).eq(0);
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                expect(Manifest.getInstance().getEventsEndpointByRegion('default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getEventsEndpointByRegion('EU').url).equal('TEST_URL2');
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal('TEST_HASH');
                done();
            });
        });

        it('| manifest update correctly with events properties, expect success message and new hash set', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, 'TEST_HASH');
            sinon.stub(SkillInfrastructureController.prototype, '_ensureSkillManifestGotUpdated').callsArgWith(0);
            sinon.stub(ResourcesConfig.prototype, 'getSkillEvents').returns({
              publications: ["TEST_PUBLICATION"],
              subscriptions: ["TEST_SUBSCRIPTION"]
            });
            const setApisEndpointByDomainRegionSpy = sinon.spy(Manifest.prototype, 'setApisEndpointByDomainRegion');
            const setEventsEndpointByRegionSpy = sinon.spy(Manifest.prototype, 'setEventsEndpointByRegion');
            const setEventsPublicationsSpy = sinon.spy(Manifest.prototype, 'setEventsPublications');
            const setEventsSubscriptionsSpy = sinon.spy(Manifest.prototype, 'setEventsSubscriptions');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                expect(setApisEndpointByDomainRegionSpy.callCount).eq(4);
                expect(setEventsEndpointByRegionSpy.callCount).eq(2);
                expect(setEventsPublicationsSpy.callCount).eq(1);
                expect(setEventsSubscriptionsSpy.callCount).eq(1);
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                expect(Manifest.getInstance().getEventsEndpointByRegion('default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getEventsEndpointByRegion('EU').url).equal('TEST_URL2');
                expect(Manifest.getInstance().getEventsPublications()[0].eventName).equal('TEST_PUBLICATION');
                expect(Manifest.getInstance().getEventsSubscriptions()[0].eventName).equal('TEST_SUBSCRIPTION');
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal('TEST_HASH');
                done();
            });
        });

        it('| manifest update when target endpoints is not set, expect success message and new hash set', (done) => {
            // setup
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, 'TEST_HASH');
            sinon.stub(SkillInfrastructureController.prototype, '_ensureSkillManifestGotUpdated').callsArgWith(0);
            sinon.stub(ResourcesConfig.prototype, 'getTargetEndpoints').returns([]);
            const setApisEndpointByDomainRegionSpy = sinon.spy(Manifest.prototype, 'setApisEndpointByDomainRegion');
            const setEventsEndpointByRegionSpy = sinon.spy(Manifest.prototype, 'setEventsEndpointByRegion');
            const setEventsPublicationsSpy = sinon.spy(Manifest.prototype, 'setEventsPublications');
            const setEventsSubscriptionsSpy = sinon.spy(Manifest.prototype, 'setEventsSubscriptions');
            // call
            skillInfraController.updateSkillManifestWithDeployResult(TEST_DEPLOY_RESULT, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                expect(setApisEndpointByDomainRegionSpy.callCount).eq(2);
                expect(setEventsEndpointByRegionSpy.callCount).eq(0);
                expect(setEventsPublicationsSpy.callCount).eq(0);
                expect(setEventsSubscriptionsSpy.callCount).eq(0);
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'default').url).equal('TEST_URL1');
                expect(Manifest.getInstance().getApisEndpointByDomainRegion('custom', 'EU').url).equal('TEST_URL2');
                expect(ResourcesConfig.getInstance().getSkillMetaLastDeployHash(TEST_PROFILE)).equal('TEST_HASH');
                done();
            });
        });
    });

    describe('# test class method: _deployInfraByRegion', () => {
        let TEST_REPORTER, TEST_DD;
        const TEST_REGION = 'default';
        const TEST_SKILL_NAME = 'skillName';
        const TEST_DEPLOY_REGIONS = { TEST_REGION: 'deployRegion' };
        const TEST_HASH = 'hash';

        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(path, 'resolve').returns('base');
            sinon.stub(fse, 'statSync').returns({
                isDirectory: () => true
            });
            TEST_REPORTER = {};
            TEST_DD = {
                invoke: sinon.stub()
            };
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| get hash fails, expect error called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, 'hash error');
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, TEST_DEPLOY_REGIONS, (err, res) => {
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
            TEST_DD.invoke.callsArgWith(2, 'invoke error');
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, TEST_DEPLOY_REGIONS, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('invoke error');
                expect(TEST_DD.invoke.args[0][1].code.isCodeModified).equal(false);
                done();
            });
        });

        it('| deploy delegate invoke passes with isCodeDeployed true, expect invoke result called back with currentHash', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            TEST_DD.invoke.callsArgWith(2, null, {
                isCodeDeployed: true,
                isAllStepSuccess: true
            });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, TEST_DEPLOY_REGIONS, (err, res) => {
                // verify
                expect(res).deep.equal({
                    isCodeDeployed: true,
                    isAllStepSuccess: true,
                    lastDeployHash: TEST_HASH
                });
                expect(err).equal(null);
                done();
            });
        });

        it('| deploy delegate invoke passes, expect invoke result called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            TEST_DD.invoke.callsArgWith(2, null, {
                isCodeDeployed: false,
                isAllStepSuccess: true,
                resultMessage: 'success',
                deployState: {}
            });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, TEST_DEPLOY_REGIONS, (err, res) => {
                // verify
                expect(res).deep.equal({
                    isCodeDeployed: false,
                    isAllStepSuccess: true,
                    resultMessage: 'success',
                    deployState: {}
                });
                expect(err).equal(null);
                done();
            });
        });

        it('| deploy delegate invoke skipped, expect invoke result called back', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            TEST_REPORTER.skipTask = sinon.stub();
            TEST_DD.invoke.callsArgWith(2, null, {
                isDeploySkipped: true,
                resultMessage: 'skipped',
                deployRegion: 'deployRegion',
                deployState: {}
            });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, TEST_DEPLOY_REGIONS, (err, res) => {
                // verify
                expect(res).deep.equal({
                    isDeploySkipped: true,
                    resultMessage: 'skipped',
                    deployRegion: 'deployRegion',
                    deployState: {}
                });
                expect(err).equal(null);
                expect(TEST_REPORTER.skipTask.calledOnce).equal(true);
                expect(TEST_REPORTER.skipTask.args[0][0]).equal('skipped');
                done();
            });
        });

        it('| deploy delegate invoke partial succeed with reasons called back, expect invoke result called back along with the message', (done) => {
            // setup
            sinon.stub(hashUtils, 'getHash').callsArgWith(1, null, TEST_HASH);
            TEST_DD.invoke.callsArgWith(2, null, {
                isCodeDeployed: true,
                isAllStepSuccess: false,
                resultMessage: 'partial fail',
                deployState: {}
            });
            // call
            skillInfraController._deployInfraByRegion(TEST_REPORTER, TEST_DD, TEST_REGION, TEST_SKILL_NAME, TEST_DEPLOY_REGIONS, (err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).deep.equal({
                    message: 'partial fail',
                    context: {
                        isCodeDeployed: true,
                        isAllStepSuccess: false,
                        lastDeployHash: TEST_HASH,
                        resultMessage: 'partial fail',
                        deployState: {}
                    }
                });
                done();
            });
        });
    });

    describe('# test class method: _updateResourcesConfig', () => {
        let TEST_REGION_LIST, TEST_DEPLOY_RESULT;

        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        beforeEach(() => {
            TEST_REGION_LIST = ['default'];
            TEST_DEPLOY_RESULT = {
                default: {
                    endpoint: {
                        url: 'TEST_URL'
                    },
                    lastDeployHash: 'TEST_HASH',
                    deployState: {}
                }
            };
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            sinon.stub(fse, 'writeFileSync');
        });

        afterEach(() => {
            ResourcesConfig.dispose();
            sinon.restore();
        });

        it('| update resources config correctly', () => {
            // call
            skillInfraController._updateResourcesConfig(TEST_REGION_LIST, TEST_DEPLOY_RESULT);
            // verify
            expect(ResourcesConfig.getInstance().getCodeLastDeployHashByRegion(TEST_PROFILE, 'default')).equal('TEST_HASH');
            expect(ResourcesConfig.getInstance().getSkillInfraDeployState(TEST_PROFILE)).deep.equal({ default: {} });
            expect(fse.writeFileSync.callCount).equal(2);
        });

        it('| update resources config using previous state for unreported regions', () => {
            // setup
            TEST_REGION_LIST = ['default', 'NA'];
            ResourcesConfig.getInstance().setCodeLastDeployHashByRegion(TEST_PROFILE, 'NA', 'TEST_HASH');
            ResourcesConfig.getInstance().setSkillInfraDeployState(TEST_PROFILE, { default: {}, NA: {} });
            // call
            skillInfraController._updateResourcesConfig(TEST_REGION_LIST, TEST_DEPLOY_RESULT);
            // verify
            expect(ResourcesConfig.getInstance().getCodeLastDeployHashByRegion(TEST_PROFILE, 'NA')).equal('TEST_HASH');
            expect(ResourcesConfig.getInstance().getSkillInfraDeployState(TEST_PROFILE)).deep.equal({ default: {}, NA: {} });
            expect(fse.writeFileSync.callCount).equal(2);
        });

        it('| update resources config with no previous state for unreported regions', () => {
            // setup
            TEST_REGION_LIST = ['default', 'NA'];
            ResourcesConfig.getInstance().setCodeLastDeployHashByRegion(TEST_PROFILE, 'NA', undefined);
            ResourcesConfig.getInstance().setSkillInfraDeployState(TEST_PROFILE, undefined);
            // call
            skillInfraController._updateResourcesConfig(TEST_REGION_LIST, TEST_DEPLOY_RESULT);
            // verify
            expect(ResourcesConfig.getInstance().getCodeLastDeployHashByRegion(TEST_PROFILE, 'NA')).equal(undefined);
            expect(ResourcesConfig.getInstance().getSkillInfraDeployState(TEST_PROFILE)).deep.equal({ default: {}, NA: undefined });
            expect(fse.writeFileSync.callCount).equal(2);
        });


    });

    describe('# test class method: _ensureSkillManifestGotUpdated', () => {
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

        it('| deploy skill package fails, expect error called back', (done) => {
            // setup
            sinon.stub(profileHelper, 'resolveVendorId');
            sinon.stub(SkillMetadataController.prototype, 'deploySkillPackage').yields('error');
            // call
            skillInfraController._ensureSkillManifestGotUpdated((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal('error');
                done();
            });
        });

        it('| resolve vendor id fails, expect error called back', (done) => {
            // setup
            sinon.stub(profileHelper, 'resolveVendorId').throws(new Error('error'));
            // call
            skillInfraController._ensureSkillManifestGotUpdated((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err.message).equal('error');
                done();
            });
        });

        it('| deploy skill package succeeds, expect call back with no error', (done) => {
            sinon.stub(profileHelper, 'resolveVendorId');
            sinon.stub(SkillMetadataController.prototype, 'deploySkillPackage').yields();
            // call
            skillInfraController._ensureSkillManifestGotUpdated((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).equal(undefined);
                done();
            });
        });
    });

    describe('# test class method: _getAlexaDeployRegions', () => {
        const skillInfraController = new SkillInfrastructureController(TEST_CONFIGURATION);

        it('| alexaRegion is default, userConfig awsRegion is set, expect awsRegion is retrieved correctly.', (done) => {
            // setup
            const TEST_ALEXA_REGION = 'default';
            const USER_CONFIG_AWS_REGION = 'sa-east-1';
            const TEST_REGION_LIST = [TEST_ALEXA_REGION];
            const TEST_USER_CONFIG = {
                awsRegion: USER_CONFIG_AWS_REGION
            };
            // call
            const deployRegions = skillInfraController._getAlexaDeployRegions(TEST_REGION_LIST, TEST_USER_CONFIG);
            // verify
            expect(deployRegions).deep.equal({ [TEST_ALEXA_REGION]: USER_CONFIG_AWS_REGION });
            done();
        });

        it('| alexaRegion is default, userConfig awsRegion is NOT set, expect awsRegion is set based on Alexa and AWS region map.', (done) => {
            // setup
            const TEST_ALEXA_REGION = 'default';
            const MAPPING_ALEXA_DEFAULT_AWS_REGION = 'us-east-1';
            const TEST_REGION_LIST = [TEST_ALEXA_REGION];
            const TEST_USER_CONFIG = {};
            // call
            const deployRegions = skillInfraController._getAlexaDeployRegions(TEST_REGION_LIST, TEST_USER_CONFIG);
            // verify
            expect(deployRegions).deep.equal({ [TEST_ALEXA_REGION]: MAPPING_ALEXA_DEFAULT_AWS_REGION });
            done();
        });

        it('| alexaRegion is not default, userConfig regionalOverrides awsRegion is set, expect awsRegion is retrieved correctly.', (done) => {
            // setup
            const TEST_ALEXA_REGION_EU = 'EU';
            const USER_CONFIG_AWS_REGION = 'eu-west-2';
            const TEST_REGION_LIST = [TEST_ALEXA_REGION_EU];
            const TEST_USER_CONFIG = {
                regionalOverrides: {
                    EU: {
                        awsRegion: USER_CONFIG_AWS_REGION
                    }
                }
            };
            // call
            const deployRegions = skillInfraController._getAlexaDeployRegions(TEST_REGION_LIST, TEST_USER_CONFIG);
            // verify
            expect(deployRegions).deep.equal({ [TEST_ALEXA_REGION_EU]: USER_CONFIG_AWS_REGION });
            done();
        });

        it('| alexaRegion is not default, userConfig regionalOverrides awsRegion is NOT set, '
        + 'expect awsRegion is set based on Alexa and AWS region map.', (done) => {
            // setup
            const TEST_ALEXA_REGION_EU = 'EU';
            const MAPPING_ALEXA_EU_AWS_REGION = 'eu-west-1';
            const TEST_REGION_LIST = [TEST_ALEXA_REGION_EU];
            const TEST_USER_CONFIG = {};
            // call
            const deployRegions = skillInfraController._getAlexaDeployRegions(TEST_REGION_LIST, TEST_USER_CONFIG);
            // verify
            expect(deployRegions).deep.equal({ [TEST_ALEXA_REGION_EU]: MAPPING_ALEXA_EU_AWS_REGION });
            done();
        });
    });
});
