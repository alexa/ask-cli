const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const DeployDelegate = require('@src/controllers/skill-infrastructure-controller/deploy-delegate');

describe('Controller test - DeployDelegate test', () => {
    const TEST_REPORTER = {};
    const TEST_BUILTIN_TYPE = '@ask-cli/cfn-deployer';
    const TEST_INSTANCE = {
        bootstrap: () => 'bootstrap',
        invoke: () => 'invoke'
    };
    const TEST_WORKSPACE = 'workspace';
    const TEST_OPTIONS = {
        workspacePath: TEST_WORKSPACE
    };

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a DeployDelegate class', () => {
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            expect(deployDelegate).to.be.instanceOf(DeployDelegate);
            expect(deployDelegate.type).equal(TEST_BUILTIN_TYPE);
            expect(deployDelegate.instance).deep.equal(TEST_INSTANCE);
        });

        it('| validate deploy delegate required instance field throws exception', () => {
            try {
                new DeployDelegate(TEST_BUILTIN_TYPE, null);
            } catch (e) {
                expect(e.message).equal('[Error]: Invalid deploy delegate. Failed to load the target module.');
            }
        });

        it('| validate deploy delegate required methods "bootstrap" throws exception', () => {
            try {
                new DeployDelegate(TEST_BUILTIN_TYPE, { invoke: () => 'invoke' });
            } catch (e) {
                expect(e.message).equal('[Error]: Invalid deploy delegate. The class of the deploy delegate must contain "bootstrap" method.');
            }
        });

        it('| validate deploy delegate required methods "invoke" throws exception', () => {
            try {
                new DeployDelegate(TEST_BUILTIN_TYPE, { bootstrap: () => 'bootstrap' });
            } catch (e) {
                expect(e.message).equal('[Error]: Invalid deploy delegate. The class of the deploy delegate must contain "invoke" method.');
            }
        });
    });

    describe('# test class method: bootstrap', () => {
        beforeEach(() => {
            sinon.stub(path, 'join');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| bootstrap not able to start because instance does not exist', (done) => {
            // setup
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            deployDelegate.instance = null;
            // call
            deployDelegate.bootstrap(TEST_OPTIONS, (err, res) => {
                // verify
                expect(err).equal('[Fatal]: Please instantiate the DeployDelegate class before using.');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| bootstrap is called successfully', (done) => {
            // setup
            const stub = sinon.stub();
            stub.callsArgWith(1, null);
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, {
                bootstrap: stub,
                invoke: () => 'invoke'
            });
            // call
            deployDelegate.bootstrap(TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(null);
                expect(stub.args[0][0]).deep.equal(TEST_OPTIONS);
                done();
            });
        });
    });

    describe('# test class method: invoke', () => {
        beforeEach(() => {
            sinon.stub(path, 'join');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| invoke not able to start because instance does not exist', (done) => {
            // setup
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            deployDelegate.instance = null;
            // call
            deployDelegate.invoke(TEST_REPORTER, TEST_OPTIONS, (err, res) => {
                // verify
                expect(err).equal('[Fatal]: Please instantiate the DeployDelegate class before using.');
                expect(res).equal(undefined);
                done();
            });
        });

        it('| invoke is called successfully', (done) => {
            // setup
            const stub = sinon.stub();
            stub.callsArgWith(2, null);
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, {
                bootstrap: () => 'bootstrap',
                invoke: stub
            });
            // call
            deployDelegate.invoke(TEST_REPORTER, TEST_OPTIONS, (err) => {
                // verify
                expect(err).equal(null);
                expect(stub.args[0][1]).deep.equal(TEST_OPTIONS);
                done();
            });
        });
    });

    describe('# test class method: validateDeployDelegateResponse', () => {
        beforeEach(() => {
            sinon.stub(path, 'join');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| deploy result is not truthy value, expect error thrown', () => {
            // setup
            const TEST_DEPLOY_RESULT = null;
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            // call
            try {
                deployDelegate.validateDeployDelegateResponse(TEST_DEPLOY_RESULT);
            } catch (e) {
                // verify
                expect(e.message).equal('[Error]: Deploy result should not be empty.');
            }
        });

        it('| deploy result misses endpoint field, expect error thrown', () => {
            // setup
            const TEST_DEPLOY_RESULT = {
                default: {}
            };
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            // call
            try {
                deployDelegate.validateDeployDelegateResponse(TEST_DEPLOY_RESULT);
            } catch (e) {
                // verify
                expect(e.message).equal('[Error]: Invalid response from deploy delegate. "endpoint" field must exist in the response.');
            }
        });

        it('| deploy result misses endpoint.uri field, expect error thrown', () => {
            // setup
            const TEST_DEPLOY_RESULT = {
                default: {
                    endpoint: {}
                }
            };
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            // call
            try {
                deployDelegate.validateDeployDelegateResponse(TEST_DEPLOY_RESULT);
            } catch (e) {
                // verify
                expect(e.message).equal('[Error]: Invalid response from deploy delegate. "uri" field must exist in the "endpoint" field in the response.');
            }
        });

        it('| deploy result misses deployState field, expect error thrown', () => {
            // setup
            const TEST_DEPLOY_RESULT = {
                default: {
                    endpoint: {
                        uri: 'uri'
                    }
                }
            };
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            // call
            try {
                deployDelegate.validateDeployDelegateResponse(TEST_DEPLOY_RESULT);
            } catch (e) {
                // verify
                expect(e.message).equal('[Error]: Invalid response from deploy delegate. "deployState" field must exist in the response.');
            }
        });

        it('| deploy result is valid, expect no error thrown', () => {
            // setup
            const TEST_DEPLOY_RESULT = {
                default: {
                    endpoint: {
                        uri: 'uri'
                    },
                    deployState: {}
                }
            };
            const deployDelegate = new DeployDelegate(TEST_BUILTIN_TYPE, TEST_INSTANCE);
            // call
            try {
                deployDelegate.validateDeployDelegateResponse(TEST_DEPLOY_RESULT);
            } catch (e) {
                // verify
                expect(e).equal(null);
            }
        });
    });

    describe('# test factory method: loadDeployDelegate', () => {
        const TEST_INVALID_TYPE = 'invalid';

        afterEach(() => {
            sinon.restore();
        });

        it('| when type is not recognized expect throws error', (done) => {
            // call
            DeployDelegate.load(TEST_INVALID_TYPE, (err, res) => {
                // verify
                expect(err).equal(`[Error]: Skill infrastructure type "${TEST_INVALID_TYPE}" is not recognized by ask-cli.`);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| when type is cli builtin type but fail to pass the validation', (done) => {
            // setup
            const stubPath = path.join(__dirname, '..', 'fixture', 'controller', 'invalid-deploy-delegate-instance');
            sinon.stub(path, 'join').returns(stubPath);
            // call
            DeployDelegate.load(TEST_BUILTIN_TYPE, (err, res) => {
                // verify
                expect(err.startsWith(`[Error]: Built-in skill infrastructure type "${TEST_BUILTIN_TYPE}" failed to load.\n`)).equal(true);
                expect(res).equal(undefined);
                done();
            });
        });

        it('| when type is cli builtin type callback with deploy delegate instance', (done) => {
            // setup
            const stubPath = path.join(__dirname, '..', 'fixture', 'controller', 'valid-deploy-delegate-instance');
            sinon.stub(path, 'join').returns(stubPath);
            DeployDelegate.load(TEST_BUILTIN_TYPE, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).to.be.instanceOf(DeployDelegate);
                done();
            });
        });
    });
});
