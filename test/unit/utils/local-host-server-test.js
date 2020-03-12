const { expect } = require('chai');
const http = require('http');
const sinon = require('sinon');

const CONSTANTS = require('@src/utils/constants');
const LocalServer = require('@src/utils/local-host-server');

describe('# Server test - Local host server test', () => {
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
});
