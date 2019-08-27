'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const oauth2 = require('simple-oauth2');
const oauthWrapper = require('../../../lib/utils/oauth-wrapper');
const CONSTANTS = require('../../../lib/utils/constants');

describe('oauth-wrapper unit test', () => {
    describe('# createOAuth', () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            sandbox.stub(console, 'warn');
            sandbox.stub(oauth2, 'create');
        });
        afterEach(() => {
            sandbox.restore();
        });

        it('| should take input credentials and generate oauth2 instance', () => {
            const TEST_ID = '123';
            const TEST_SECRET = '321';
            oauthWrapper.createOAuth(TEST_ID, TEST_SECRET);
            let oauthInput = oauth2.create.getCall(0).args[0];
            expect(oauthInput.client.id).to.equal(TEST_ID);
            expect(oauthInput.client.secret).to.equal(TEST_SECRET);
        });

        it('| should use CLI credentials when input parameters are omitted', () => {
            oauthWrapper.createOAuth();
            let oauthInput = oauth2.create.getCall(0).args[0];
            expect(oauthInput.client.id).to.equal(CONSTANTS.LWA.CLI_DEFAULT_CREDENTIALS.CLIENT_ID);
            expect(oauthInput.client.secret).to.equal(CONSTANTS.LWA.CLI_DEFAULT_CREDENTIALS.CLIENT_SECRET);
        });
    });
});
