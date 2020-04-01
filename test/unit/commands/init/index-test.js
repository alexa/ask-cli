const { expect } = require('chai');
const sinon = require('sinon');

const AuthorizationController = require('@src/controllers/authorization-controller');
const InitCommand = require('@src/commands/init');
const helper = require('@src/commands/init/helper');
const HostedSkillController = require('@src/controllers/hosted-skill-controller');
const httpClient = require('@src/clients/http-client');
const CliWarn = require('@src/exceptions/cli-warn');
const jsonView = require('@src/view/json-view');
const optionModel = require('@src/commands/option-model');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');

const ui = require('@src/commands/init/ui');

describe('Commands init test - command class test', () => {
    const TEST_PROFILE = 'default';
    const TEST_ERROR = 'init error';
    const TEST_WARN = new CliWarn('init warn');
    const TEST_SKILL_ID = 'skillId';
    const TEST_SKILL_NAME = 'TEST_SKILL_NAME';
    const TEST_SRC = 'src';
    const TEST_SKILL_META = { src: TEST_SRC };
    const TEST_SKILL_CODE = { src: TEST_SRC };
    const TEST_SKILL_INFRA = {};
    const TEST_HOSTED_SKILL_ID = 'hosted skill id';

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

    it('| validate command information is set correctly', () => {
        const instance = new InitCommand(optionModel);
        expect(instance.name()).equal('init');
        expect(instance.description()).equal('setup a new or existing Alexa skill project');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['hosted-skill-id', 'profile', 'debug']);
    });

    describe('validate command handle', () => {
        describe('command handle - pre init check', () => {
            let instance;

            beforeEach(() => {
                instance = new InitCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(errorStub.args[0][0].message).equal('error');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when pre init check fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'preInitCheck').callsArgWith(2, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when pre init check returns CliWarn, expect provide users warnings', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                sinon.stub(helper, 'preInitCheck').callsArgWith(2, TEST_WARN);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).deep.equal(TEST_WARN);
                    expect(warnStub.args[0][0]).equal(TEST_WARN.message);
                    expect(infoStub.callCount).equal(0);
                    expect(errorStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - collect ask resources', () => {
            let instance;

            beforeEach(() => {
                instance = new InitCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(helper, 'preInitCheck').callsArgWith(2);
                sinon.stub(helper, 'getSkillIdUserInput');
                sinon.stub(helper, 'getSkillMetadataUserInput');
                sinon.stub(helper, 'getSkillCodeUserInput');
                sinon.stub(helper, 'getSkillInfraUserInput');
                sinon.stub(helper, 'previewAndWriteAskResources').callsArgWith(3, TEST_ERROR);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when collect skill id fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill meta src fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill code src fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill code src is not provided, callback without continuing', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, null, null);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(helper.previewAndWriteAskResources.args[0][1]).deep.equal({
                        skillId: TEST_SKILL_ID,
                        skillMeta: {
                            src: TEST_SRC
                        }
                    });
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill infra fails, expect throw error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, null, TEST_SKILL_CODE);
                helper.getSkillInfraUserInput.callsArgWith(0, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when collect skill info all succeed, expect it passes correct user input', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.getSkillIdUserInput.callsArgWith(0, null, TEST_SKILL_ID);
                helper.getSkillMetadataUserInput.callsArgWith(0, null, TEST_SKILL_META);
                helper.getSkillCodeUserInput.callsArgWith(0, null, TEST_SKILL_CODE);
                helper.getSkillInfraUserInput.callsArgWith(0, null, TEST_SKILL_INFRA);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(helper.previewAndWriteAskResources.args[0][1]).deep.equal({
                        skillId: TEST_SKILL_ID,
                        skillMeta: TEST_SKILL_META,
                        skillCode: TEST_SKILL_CODE,
                        skillInfra: TEST_SKILL_INFRA
                    });
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - post user input logics', () => {
            let instance;

            beforeEach(() => {
                instance = new InitCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
                sinon.stub(helper, 'preInitCheck').callsArgWith(2);
                sinon.stub(helper, 'getSkillIdUserInput').callsArgWith(0, null, TEST_SKILL_ID);
                sinon.stub(helper, 'getSkillMetadataUserInput').callsArgWith(0, null, TEST_SKILL_META);
                sinon.stub(helper, 'getSkillCodeUserInput').callsArgWith(0, null, TEST_SKILL_CODE);
                sinon.stub(helper, 'getSkillInfraUserInput').callsArgWith(0, null, TEST_SKILL_INFRA);

                sinon.stub(helper, 'previewAndWriteAskResources');
                sinon.stub(helper, 'bootstrapSkillInfra');
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when preview and write fails, expect throws error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when preview and write returns CliWarn, expect display warnings', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3, TEST_WARN);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).deep.equal(TEST_WARN);
                    expect(warnStub.args[0][0]).equal(TEST_WARN.message);
                    expect(infoStub.callCount).equal(0);
                    expect(errorStub.callCount).equal(0);
                    done();
                });
            });

            it('| when post init executions fails, expect throws error', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3);
                helper.bootstrapSkillInfra.callsArgWith(3, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when all the steps succeed, expect seeing success message', (done) => {
                // setup
                const TEST_CMD = {
                    profile: TEST_PROFILE
                };
                helper.previewAndWriteAskResources.callsArgWith(3);
                helper.bootstrapSkillInfra.callsArgWith(3);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('\nSuccess! Run "ask deploy" to deploy your skill.');
                    expect(infoStub.callCount).equal(1);
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });

    describe('command handle - get skill name', () => {
        let instance;
        const TEST_CMD = {
            profile: TEST_PROFILE,
            hostedSkillId: TEST_HOSTED_SKILL_ID
        };

        beforeEach(() => {
            instance = new InitCommand(optionModel);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| get skill manifest fails, expect error thrown', (done) => {
            // setup
            sinon.stub(httpClient, 'request').callsArgWith(3, TEST_ERROR); // stub getManifest request
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_ERROR);
                done();
            });
        });

        it('| get skill manifest response with status code >= 300, expect error thrown', (done) => {
            // setup
            const GET_MANIFEST_ERROR = {
                statusCode: 403,
                body: {
                    error: TEST_ERROR
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_MANIFEST_ERROR); // stub getManifest request
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(jsonView.toString({ error: TEST_ERROR }));
                expect(errorStub.args[0][0]).equal(jsonView.toString({ error: TEST_ERROR }));
                done();
            });
        });

        it('| get skill manifest succeed without locales, expect error thrown', (done) => {
            // setup
            const TEST_NO_FOUND_ERROR = 'No skill name found.';
            const GET_MANIFEST_RESPONSE_NO_LOCALES = {
                statusCode: 200,
                headers: {},
                body: {
                    manifest: {
                        publishingInformation: {}
                    }
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_MANIFEST_RESPONSE_NO_LOCALES); // stub getManifest request
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_NO_FOUND_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_NO_FOUND_ERROR);
                done();
            });
        });
    });

    describe('command handle - confirm project folder name', () => {
        let instance;
        const TEST_CMD = {
            profile: TEST_PROFILE,
            hostedSkillId: TEST_HOSTED_SKILL_ID
        };
        const TEST_LOCALE = 'en-US';

        beforeEach(() => {
            instance = new InitCommand(optionModel);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
        });

        afterEach(() => {
            sinon.restore();
        });
        it('| get project name, ui get project folder name fails, expect error thrown', (done) => {
            // setup
            const GET_MANIFEST_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {
                    manifest: {
                        publishingInformation: {
                            locales: {
                                [TEST_LOCALE]: {
                                    name: TEST_SKILL_NAME
                                }
                            }
                        }
                    }
                }
            };
            const TEST_UI_ERROR = 'TEST_UI_ERROR';
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, TEST_UI_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_UI_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_UI_ERROR);
                done();
            });
        });
    });

    describe('command handle - clone', () => {
        let instance;
        const TEST_CMD = {
            profile: TEST_PROFILE,
            hostedSkillId: TEST_HOSTED_SKILL_ID
        };
        const TEST_LOCALE_CA = 'en-CA';

        beforeEach(() => {
            instance = new InitCommand(optionModel);
            sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
        });

        afterEach(() => {
            sinon.restore();
        });
        it('| hosted skill controller clone fails, expect error thrown', (done) => {
            // setup
            const TEST_FOLDER_NAME = 'TEST_FOLDER_NAME';
            const GET_MANIFEST_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {
                    manifest: {
                        publishingInformation: {
                            locales: {
                                [TEST_LOCALE_CA]: {
                                    name: TEST_SKILL_NAME
                                }
                            }
                        }
                    }
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, null, TEST_FOLDER_NAME);
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_ERROR);
                done();
            });
        });

        it('| download Git Hooks Template fails, expect error thrown', (done) => {
            // setup
            const TEST_FOLDER_NAME = 'TEST_FOLDER_NAME';
            const TEST_LOCALE = 'en-US';
            const GET_MANIFEST_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {
                    manifest: {
                        publishingInformation: {
                            locales: {
                                [TEST_LOCALE]: {
                                    name: TEST_SKILL_NAME
                                }
                            }
                        }
                    }
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, null, TEST_FOLDER_NAME);
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, null);
            sinon.stub(HostedSkillController.prototype, 'downloadGitHooksTemplate').callsArgWith(2, TEST_ERROR);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(TEST_ERROR);
                expect(errorStub.args[0][0]).equal(TEST_ERROR);
                done();
            });
        });

        it('| hosted skill controller clone succeed, expect project initialized', (done) => {
            // setup
            const TEST_FOLDER_NAME = 'TEST_FOLDER_NAME';
            const TEST_LOCALE = 'en-US';
            const GET_MANIFEST_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {
                    manifest: {
                        publishingInformation: {
                            locales: {
                                [TEST_LOCALE]: {
                                    name: TEST_SKILL_NAME
                                }
                            }
                        }
                    }
                }
            };
            sinon.stub(httpClient, 'request').callsArgWith(3, null, GET_MANIFEST_RESPONSE); // stub getManifest request
            sinon.stub(ui, 'getProjectFolderName').callsArgWith(1, null, TEST_FOLDER_NAME);
            sinon.stub(HostedSkillController.prototype, 'clone').callsArgWith(3, null);
            sinon.stub(HostedSkillController.prototype, 'downloadGitHooksTemplate').callsArgWith(2, null);
            // call
            instance.handle(TEST_CMD, (err) => {
                // verify
                expect(err).equal(undefined);
                expect(Messenger.getInstance().info.args[0][0]).equal(`\n${TEST_SKILL_NAME} successfully initialized.\n`);
                done();
            });
        });
    });
});
