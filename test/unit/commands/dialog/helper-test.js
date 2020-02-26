const { expect } = require('chai');
const sinon = require('sinon');

const SmapiClient = require('@src/clients/smapi-client');
const helper = require('@src/commands/dialog/helper');
const DialogController = require('@src/controllers/dialog-controller');

describe('# Commands Dialog test - helper test', () => {
    describe('# test validateDialogArgs', () => {
        const TEST_SKILL_ID = 'skillId';
        const TEST_STAGE = 'development';
        const TEST_LOCALE = 'en-US';
        const TEST_MSG = 'test_msg';
        const dialogMode = new DialogController({
            smapiClient: new SmapiClient({ profile: 'default', doDebug: false }),
            skillId: TEST_SKILL_ID,
            stage: TEST_STAGE,
            locale: TEST_LOCALE
        });

        let manifestStub;
        let enablementStub;

        beforeEach(() => {
            manifestStub = sinon.stub(dialogMode.smapiClient.skill.manifest, 'getManifest');
            enablementStub = sinon.stub(dialogMode.smapiClient.skill, 'getSkillEnablement');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| Skill Manifest request error runs error callback', (done) => {
            // setup
            manifestStub.callsArgWith(2, TEST_MSG, null);
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(TEST_MSG);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest non 200 response runs error callback', (done) => {
            // setup
            const errorMsg = `SMAPI get-manifest request error: 400 - ${TEST_MSG}`;
            manifestStub.callsArgWith(2, null, {
                statusCode: 400,
                body: {
                    message: TEST_MSG
                }
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest response body with no api JSON field runs error callback', (done) => {
            // setup
            const errorMsg = 'Ensure "manifest.apis" object exists in the skill manifest.';
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {}
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest response body with api JSON field but no api keys runs error callback', (done) => {
            // setup
            const errorMsg = 'Dialog command only supports custom skill type.';
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {}
                    }
                }
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest response body with api JSON field not custom runs error callback', (done) => {
            // setup
            const errorMsg = 'Dialog command only supports custom skill type, but current skill is a "smartHome" type.';
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {
                            smartHome: {}
                        }
                    }
                }
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest response body with no locales JSON field runs error callback', (done) => {
            // setup
            const errorMsg = 'Ensure the "manifest.publishingInformation.locales" exists in the skill manifest before simulating your skill.';
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {
                            custom: {}
                        }
                    },
                    publishingInformation: {}
                }
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest response body does not contain locale passed into constructor runs error callback', (done) => {
            // setup
            const errorMsg = 'Locale en-US was not found for your skill. '
            + 'Ensure the locale you want to simulate exists in your publishingInformation.';
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {
                            custom: {}
                        },
                        publishingInformation: {
                            locales: {
                            }
                        }
                    }
                }
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest callback successful, Skill Enablement request error runs error callback', (done) => {
            // setup
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {
                            custom: {}
                        },
                        publishingInformation: {
                            locales: {
                                'en-US': {}
                            }
                        }
                    }
                }
            });
            enablementStub.callsArgWith(2, TEST_MSG, null);
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(TEST_MSG);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest callback successful, Skill Enablement response of >= 300 runs error callback', (done) => {
            // setup
            const errorMsg = `SMAPI get-skill-enablement request error: 400 - ${TEST_MSG}`;
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {
                            custom: {}
                        },
                        publishingInformation: {
                            locales: {
                                'en-US': {}
                            }
                        }
                    }
                }
            });
            enablementStub.callsArgWith(2, null, {
                statusCode: 400,
                body: {
                    message: TEST_MSG
                }
            });
            // call
            helper.validateDialogArgs(dialogMode, (err, response) => {
                // verify
                expect(err).equal(errorMsg);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| Skill Manifest callback successful, Skill Enablement successful', (done) => {
            // setup
            const TEST_RES = {
                statusCode: 204,
                body: {
                    message: TEST_MSG
                }
            };
            manifestStub.callsArgWith(2, null, {
                statusCode: 200,
                body: {
                    manifest: {
                        apis: {
                            custom: {}
                        },
                        publishingInformation: {
                            locales: {
                                'en-US': {}
                            }
                        }
                    }
                }
            });
            enablementStub.callsArgWith(2, null, TEST_RES);
            // call
            helper.validateDialogArgs(dialogMode, (err) => {
                // verify
                expect(err).equal(undefined);
                done();
            });
        });
    });
});
