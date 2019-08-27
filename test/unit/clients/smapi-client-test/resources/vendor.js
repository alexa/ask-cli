'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const oauthWrapper = require('@src/utils/oauth-wrapper');
const CONSTANTS = require('@src/utils/constants');

const noop = () => {};

module.exports = (smapiClient) => {

    describe('# smapi client vendor APIs', () => {
        beforeEach(() => {
            sinon.stub(oauthWrapper, 'tokenRefreshAndRead');
        });

        [
            {
                testCase: 'list-vendors',
                apiFunc: smapiClient.vendor.listVendors,
                parameters: [noop],
                expectedOptions: {
                    url: `${CONSTANTS.SMAPI.ENDPOINT}/v1/vendors`,
                    method: CONSTANTS.HTTP_REQUEST.VERB.GET,
                    headers: {},
                    body: null,
                    json: false
                }
            }
        ].forEach(({ testCase, apiFunc, parameters, expectedOptions }) => {
            it (`| call ${testCase} successfully`, (done) => {
                // setup
                oauthWrapper.tokenRefreshAndRead.callsFake(noop);
                // call
                apiFunc(...parameters);
                // verify
                expect(oauthWrapper.tokenRefreshAndRead.called).equal(true);
                expect(oauthWrapper.tokenRefreshAndRead.args[0][0]).deep.equal(expectedOptions);
                done();
            });
        });

        afterEach(() => {
            oauthWrapper.tokenRefreshAndRead.restore();
        });
    });
};
