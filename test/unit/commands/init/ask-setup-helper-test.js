const { assert, expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const jsonfile = require('jsonfile');
const oauthWrapper = require('@src/utils/oauth-wrapper');
const profileHelper = require('@src/utils/profile-helper');
const askSetupHelper = require('@src/commands/init/ask-setup-helper');
const apiWrapper = require('@src/api/api-wrapper');
const tools = require('@src/utils/tools');
const jsonRead = require('@src/utils/json-read');
const messages = require('@src/commands/init/messages');
const ui = require('@src/commands/init/ui');
const jsonUtility = require('@src/utils/json-utility');

describe('Command: Init - ASK setup helper test', () => {
    describe('# set up ask config', () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            sandbox.stub(oauthWrapper, 'writeToken');
        });

        it('| token writing successful', () => {
            // call
            askSetupHelper.setupAskConfig({}, 'askPRofile', (error) => {
                // verify
                assert.isUndefined(error);
            });
        });

        it('| error while writing tokens', () => {
            // setup
            const ERROR = 'error while writing tokens';
            oauthWrapper.writeToken.withArgs(sinon.match.any, sinon.match.string).throws(ERROR);

            // call
            askSetupHelper.setupAskConfig({}, 'askPRofile', (error) => {
                // verify
                assert.isDefined(error);
                expect(error).equal(`Failed to update the cli_config file with the retrieved token. ${ERROR}`);
            });
        });

        afterEach(() => {
            sandbox.restore();
        });
    });

    describe('# Verify first time profile creation', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync');
            sinon.stub(fs, 'mkdirSync');
            sinon.stub(profileHelper, 'getListProfile');
            sinon.stub(jsonfile, 'writeFileSync');
        });

        it('| ask config exists with valid profile', () => {
            // setup
            fs.existsSync.withArgs(sinon.match.string).returns(true);
            profileHelper.getListProfile.returns(['ask']);

            // call and verify
            assert.isFalse(askSetupHelper.isFirstTimeCreation());
        });

        it('| ask config does not exist', () => {
            // setup
            fs.existsSync.withArgs(sinon.match.string).returns(false);
            profileHelper.getListProfile.returns([]);

            // call and verify
            assert.isTrue(askSetupHelper.isFirstTimeCreation());
        });

        it('| ask config exists but no profiles', () => {
            // setup
            fs.existsSync.withArgs(sinon.match.string).returns(true);
            profileHelper.getListProfile.returns([]);

            // call and verify
            assert.isTrue(askSetupHelper.isFirstTimeCreation());
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# set vendor ID', () => {
        beforeEach(() => {
            sinon.stub(apiWrapper, 'callListVendor');
            sinon.stub(tools, 'convertDataToJsonObject');
            sinon.stub(jsonRead, 'readFile');
        });

        it('| no config file found', () => {
            // setup
            apiWrapper.callListVendor.callsArgOnWith(2, {}, {});
            jsonRead.readFile.withArgs(sinon.match.string).returns('');

            // call
            askSetupHelper.setVendorId('askProfile', false, (err) => {
                // verify
                expect(err).equal(messages.ASK_CONFIG_NOT_FOUND_ERROR);
            });
        });

        it('| invalid vendor info', () => {
            // setup
            apiWrapper.callListVendor.callsArgOnWith(2, {}, {});
            jsonRead.readFile.withArgs(sinon.match.string).returns('path/to/homeconfig');
            tools.convertDataToJsonObject.withArgs(sinon.match.any).returns({ });

            // call
            askSetupHelper.setVendorId('askProfile', false, (err) => {
                // verify
                expect(err).equal(messages.VENDOR_INFO_FETCH_ERROR);
            });
        });

        it('| zero vendor IDs', () => {
            // setup
            apiWrapper.callListVendor.callsArgOnWith(2, {}, {});
            jsonRead.readFile.withArgs(sinon.match.string).returns('path/to/homeconfig');
            tools.convertDataToJsonObject.withArgs(sinon.match.any).returns({ vendors: [] });

            // call
            askSetupHelper.setVendorId('askProfile', false, (err) => {
                // verify
                expect(err).equal('There is no vendor ID for your account.');
            });
        });

        it('| single vendor ID', () => {
            // setup
            sinon.stub(jsonUtility, 'writeToProperty');
            apiWrapper.callListVendor.callsArgOnWith(2, {}, {});
            jsonRead.readFile.withArgs(sinon.match.string).returns('path/to/homeconfig');
            tools.convertDataToJsonObject.withArgs(sinon.match.any).returns({ vendors: [{ id: 'KGHFT576JH' }] });

            // call
            askSetupHelper.setVendorId('askProfile', false, (err, response) => {
                // verify
                expect(err).to.be.null;
                expect(response).equal('KGHFT576JH');
            });
        });

        it('| multiple vendor IDs', () => {
            // setup
            sinon.stub(ui, 'chooseVendorId');
            sinon.stub(jsonUtility, 'writeToProperty');
            ui.chooseVendorId.callsArgOnWith(2, {}, 'KGHFT576JH');
            apiWrapper.callListVendor.callsArgOnWith(2, {}, {});
            jsonRead.readFile.withArgs(sinon.match.string).returns('path/to/homeconfig');
            tools.convertDataToJsonObject.withArgs(sinon.match.any).returns({ vendors: [{ id: 'KGHFT576JH' }, { id: 'KGHFT586JH' }] });

            // call
            askSetupHelper.setVendorId('askProfile', false, (error, response) => {
                // verify
                expect(error).to.be.null;
                expect(response).equal('KGHFT576JH');
            });
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
