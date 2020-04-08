const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');
const ExportPackageCommand = require('@src/commands/smapi/appended-commands/export-package');
const helper = require('@src/commands/smapi/appended-commands/export-package/helper');
const httpClient = require('@src/clients/http-client');
const jsonView = require('@src/view/json-view');
const Messenger = require('@src/view/messenger');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const zipUtils = require('@src/utils/zip-utils');

describe('Commands export-package test - command class test', () => {
    const TEST_PROFILE = 'default';
    const TEST_DEBUG = false;

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
        const instance = new ExportPackageCommand(optionModel);
        expect(instance.name()).equal('export-package');
        expect(instance.description()).equal('download the skill package to "skill-package" folder in current directory');
        expect(instance.requiredOptions()).deep.equal(['skill-id', 'stage']);
        expect(instance.optionalOptions()).deep.equal(['profile', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_CMD = {
            profile: TEST_PROFILE,
            debug: TEST_DEBUG
        };
        const TEST_ERROR_MESSAGE = 'ERROR';
        const ERROR = new Error(TEST_ERROR_MESSAGE);
        let instance;
        beforeEach(() => {
            sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            instance = new ExportPackageCommand(optionModel);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('command handle - before export package', () => {
            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when skillPackage folder exists, expect throw error', (done) => {
                // setup
                sinon.stub(fs, 'existsSync').returns(true);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(`A ${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE} fold already exists in the current working directory.`);
                    expect(errorStub.args[0][0].message).equal(`A ${CONSTANTS.FILE_PATH.SKILL_PACKAGE.PACKAGE} `
                    + 'fold already exists in the current working directory.');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - request to export skill package', () => {
            const EXPORT_ERROR = {
                statusCode: 403,
                body: {
                    error: TEST_ERROR_MESSAGE
                }
            };
            beforeEach(() => {
                sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            });

            it('| export skill package fails, expect throw error', (done) => {
                // setup
                sinon.stub(fs, 'existsSync').returns(false);
                sinon.stub(httpClient, 'request').callsArgWith(3, ERROR); // stub smapi request
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR_MESSAGE);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| export skill package response with status code >= 300, expect throw error', (done) => {
                // setup
                sinon.stub(fs, 'existsSync').returns(false);
                sinon.stub(httpClient, 'request').callsArgWith(3, null, EXPORT_ERROR); // stub smapi request
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(jsonView.toString({ error: TEST_ERROR_MESSAGE }));
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - poll export skill package status and download file', () => {
            const EXPORT_RESPONSE = {
                statusCode: 200,
                headers: {
                    location: 'TEST_LOCATION'
                },
                body: {}
            };
            const POLL_RESPONSE = {
                statusCode: 200,
                headers: {},
                body: {
                    skill: {
                        location: 'TEST_LOCATION'
                    }
                }
            };
            beforeEach(() => {
                sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsArgWith(1);
            });

            it('| poll skill package fails, expect throw error', (done) => {
                // setup
                sinon.stub(fs, 'existsSync').returns(false);
                sinon.stub(httpClient, 'request').callsArgWith(3, null, EXPORT_RESPONSE); // stub smapi request
                sinon.stub(helper, 'pollExportStatus').callsArgWith(2, ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR_MESSAGE);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| unzipRemoteZipFile fails, expect throw error', (done) => {
                // setup
                sinon.stub(fs, 'existsSync').returns(false);
                sinon.stub(httpClient, 'request').callsArgWith(3, null, EXPORT_RESPONSE); // stub smapi request
                sinon.stub(helper, 'pollExportStatus').callsArgWith(2, null, POLL_RESPONSE);
                sinon.stub(zipUtils, 'unzipRemoteZipFile').callsArgWith(3, ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR_MESSAGE);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| unzipRemoteZipFile passes', (done) => {
                // setup
                sinon.stub(fs, 'existsSync').returns(false);
                sinon.stub(httpClient, 'request').callsArgWith(3, null, EXPORT_RESPONSE); // stub smapi request
                sinon.stub(helper, 'pollExportStatus').callsArgWith(2, null, POLL_RESPONSE);
                sinon.stub(zipUtils, 'unzipRemoteZipFile').callsArgWith(3, null);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.callCount).equal(1);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });
});
