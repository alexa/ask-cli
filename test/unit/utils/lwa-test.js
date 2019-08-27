'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const lwa = require('../../../lib/utils/lwa');
const portscanner = require('portscanner');
const oauthWrapper = require('../../../lib/utils/oauth-wrapper');
const http = require('http');

describe('Utils: lwa testing', () => {
    describe('# _requestTokens', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('| should callback with validate tokens', () => {
            const TOKEN = 'valid token';
            let OAuth = {};
            OAuth.authorizationCode = {};
            OAuth.authorizationCode.getToken = (tokenConfig, callback) => {
                if (tokenConfig) {
                    callback(null, 'authCode');
                }
            };
            OAuth.accessToken = {};
            OAuth.accessToken.create = () => {
                let response = {};
                response.token = TOKEN;
                return response;
            };

            lwa._requestTokens('authCode', 'fake_url', OAuth, (error, result) => {
                expect(error).to.be.null;
                expect(result).to.equal(TOKEN);
            });

        });

        it('| should error out', () => {
            let OAuth = {};
            OAuth.authorizationCode = {};
            OAuth.authorizationCode.getToken = (tokenConfig, callback) => {
                if (tokenConfig) {
                    callback('error');
                }
            };
            lwa._requestTokens('authCode', 'fake_url', OAuth, (error, result) => {
                expect(error).to.include('Cannot obtain access token. ');
                expect(result).to.be.undefined;
            });
        })
    });

    describe('# accessTokenGenerator', () => {
        let sandbox;

        beforeEach(() => {
            let OAuth = {};
            OAuth.authorizationCode = {};
            OAuth.authorizationCode.authorizeURL = (tokenConfig) => {
                if (tokenConfig) {
                    return 'localhost';
                }
            };

            sandbox = sinon.sandbox.create();
            sandbox.stub(oauthWrapper, 'createOAuth').returns(OAuth);
            sandbox.stub(lwa, '_getAuthCode');
            sandbox.stub(lwa, '_requestTokens');
            sandbox.stub(lwa, '_listenResponseFromLWA');
            sandbox.stub(portscanner, 'checkPortStatus');
            sandbox.stub(console, 'warn');
            sandbox.stub(console, 'info');
            sandbox.stub(console, 'log');
        });

        afterEach(() => {
            sandbox.restore();
        });


        it('| should go through non-browser route to fetch the tokens', () => {

            lwa.accessTokenGenerator('credentials', 'scopes', 'state', false, () => {
            });
            expect(console.log.called).to.be.true;
        });

        it('| should go through browser route and callback with an error', (done) => {
            portscanner.checkPortStatus.callsArgWith(1, 'error');
            lwa.accessTokenGenerator('credentials', 'scopes', 'state', true, (error) => {
                expect(error).to.equal('error');
                expect(lwa._listenResponseFromLWA.calledOnce).to.be.false;
                done();
            });

        });

        it('| should use browser but find the port was open', () => {
            portscanner.checkPortStatus.callsArgWith(1, null, 'open');
            lwa.accessTokenGenerator('credentials', 'scopes', 'state', true, () => {});
            expect(lwa._listenResponseFromLWA.calledOnce).to.be.false;
            expect(console.warn.calledOnce).to.be.true;
            expect(console.info.calledOnce).to.be.true;
        });

        it('| should go through browser but find the port was closed', () => {
            portscanner.checkPortStatus.callsArgWith(1, null, 'closed');
            lwa.accessTokenGenerator('credentials', 'scopes', 'state', true, () => {});
            expect(console.log.called).to.be.true;
            expect(console.warn.calledOnce).to.be.false;
            expect(console.info.calledOnce).to.be.false;

        });
    });

    describe('# _listenResponseFromLWA', () => {
        let sandbox;

        beforeEach(() => {
            let server = {};
            server.on = (input, callback) => {};
            server.listen = (input, callback) => {};

            sandbox = sinon.sandbox.create();
            sandbox.stub(http, 'createServer').returns(server);
        });

        afterEach(() => {
            sandbox.restore();
        });


        it('| should create a server', () => {
            lwa._listenResponseFromLWA(9090, ()=> {});
            expect(http.createServer.calledOnce).to.be.true;
        });
    });
});
