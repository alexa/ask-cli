const { expect } = require('chai');
const http = require('http');
const sinon = require('sinon');
const url = require('url');

const LocalServer = require('@src/controllers/authorization-controller/server');
const CONSTANTS = require('@src/utils/constants');
const messages = require('@src/controllers/authorization-controller/messages');

describe('# Server test - Local server test', () => {
    const TEST_PORT = CONSTANTS.LWA.LOCAL_PORT;
    const TEST_EVENT = 'testEvent';
    const listenStub = sinon.stub();
    const onStub = sinon.stub();
    const closeStub = sinon.stub();
    const unrefStub = sinon.stub();

    const TEST_SERVER = {
        listen: listenStub,
        on: onStub,
        close: closeStub,
        unref: unrefStub
    };

    afterEach(() => {
        sinon.restore();
    });

    it('| test server methods', () => {
        // setup
        const httpStub = sinon.stub(http, 'createServer').returns(TEST_SERVER);
        const localServer = new LocalServer(TEST_PORT);

        // call
        localServer.create(() => {});
        localServer.listen(() => {});
        localServer.registerEvent(TEST_EVENT, () => {});
        localServer.destroy();

        // verify
        expect(httpStub.callCount).eq(1);
        expect(listenStub.callCount).eq(1);
        expect(onStub.callCount).eq(1);
        expect(closeStub.callCount).eq(1);
        expect(unrefStub.callCount).eq(1);
        expect(localServer.server).to.deep.eq(TEST_SERVER);
    });

    it('| test _defaultServerCallback | valid authCode retrieved', () => {
        // setup
        const serverDestroyStub = sinon.stub(LocalServer.prototype, 'destroy');
        const requestDestroyStub = sinon.stub();
        const localServer = new LocalServer(TEST_PORT);
        const callback = (error, authCode) => {
            if (error) { return error; }
            return authCode;
        };
        const request = {
            url: '/cb?code',
            socket: {
                destroy: requestDestroyStub
            }
        };
        const requestQuery = {
            query: {
                code: 'authCode'
            }
        };
        sinon.stub(url, 'parse').returns(requestQuery);
        const endStub = sinon.stub();
        const response = {
            on: sinon.stub().callsArgWith(1),
            end: endStub
        };

        // call
        const defaultServerCallback = localServer._defaultServerCallback(callback);
        defaultServerCallback(request, response);

        // verify
        expect(serverDestroyStub.callCount).eq(1);
        expect(requestDestroyStub.callCount).eq(1);
        expect(endStub.callCount).eq(1);
        expect(endStub.args[0][0]).eq(messages.ASK_SIGN_IN_SUCCESS_MESSAGE);
    });

    it('| test _defaultServerCallback | returns error', () => {
        // setup
        const serverDestroyStub = sinon.stub(LocalServer.prototype, 'destroy');
        const requestDestroyStub = sinon.stub();
        const localServer = new LocalServer(TEST_PORT);
        const callback = (error, authCode) => {
            if (error) { return error; }
            return authCode;
        };
        const request = {
            url: '/cb?error',
            socket: {
                destroy: requestDestroyStub
            }
        };
        const requestQuery = {
            query: {
                error: 'error',
                error_description: 'errorDescription'
            }
        };
        sinon.stub(url, 'parse').returns(requestQuery);
        const endStub = sinon.stub();
        const response = {
            on: sinon.stub().callsArgWith(1),
            end: endStub
        };

        // call
        const defaultServerCallback = localServer._defaultServerCallback(callback);
        defaultServerCallback(request, response);

        // verify
        expect(serverDestroyStub.callCount).eq(1);
        expect(requestDestroyStub.callCount).eq(1);
        expect(endStub.callCount).eq(1);
        expect(endStub.args[0][0]).eq(`Error: ${requestQuery.query.error}\nError description: ${requestQuery.query.error_description}`);
    });
});
