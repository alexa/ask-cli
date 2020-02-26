const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const SpinnerView = require('@src/view/spinner-view');


describe('View test - spinner view test', () => {
    const TEST_MESSAGE = 'TEST_MESSAGE';

    describe('# inspect correctness for constructor', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| initiate as a SpinnerView class', () => {
            const spinnerView = new SpinnerView();
            expect(spinnerView).to.be.instanceof(SpinnerView);
        });

        it('| make sure SpinnerView class init with default config', () => {
            // setup
            const oraStub = sinon.stub();
            const ProxySpinnerView = proxyquire('@src/view/spinner-view', {
                ora: oraStub
            });
            // call
            new ProxySpinnerView();
            // verify
            expect(oraStub.args[0][0].color).equal('yellow');
        });

        it('| make sure SpinnerView class init with default config, when platform is not darwin', () => {
            // setup
            const oraStub = sinon.stub();
            const ProxySpinnerView = proxyquire('@src/view/spinner-view', {
                ora: oraStub
            });
            sinon.stub(process, 'platform').value('win32');
            // call
            new ProxySpinnerView();
            // verify
            expect(oraStub.args[0][0]).deep.equal({ color: 'yellow', spinner: 'balloon' });
        });

        it('| make sure SpinnerView class init custom config', () => {
            // setup
            const TEST_CUSTOM_CONFIG = {
                color: 'blue',
                spinner: 'line',
                text: 'message'
            };
            const oraStub = sinon.stub();
            const ProxySpinnerView = proxyquire('@src/view/spinner-view', {
                ora: oraStub
            });
            // call
            new ProxySpinnerView(TEST_CUSTOM_CONFIG);
            // verify
            expect(oraStub.args[0][0]).deep.equal(TEST_CUSTOM_CONFIG);
        });
    });

    describe('# test class methods', () => {
        let ProxySpinnerView;
        let startStub, stopStub, succeedStub, failStub, warnStub, infoStub, stopAndPersistStub;

        beforeEach(() => {
            startStub = sinon.stub();
            stopStub = sinon.stub();
            succeedStub = sinon.stub();
            failStub = sinon.stub();
            warnStub = sinon.stub();
            infoStub = sinon.stub();
            stopAndPersistStub = sinon.stub();
            ProxySpinnerView = proxyquire('@src/view/spinner-view', {
                ora: () => ({
                    start: startStub,
                    stop: stopStub,
                    succeed: succeedStub,
                    fail: failStub,
                    warn: warnStub,
                    info: infoStub,
                    stopAndPersist: stopAndPersistStub
                })
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| test SpinnerView class method - start spinner', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.start();
            // expect
            expect(startStub.callCount).equal(1);
            expect(startStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - start with message', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.start(TEST_MESSAGE);
            // expect
            expect(startStub.callCount).equal(1);
            expect(startStub.args[0][0]).equal(TEST_MESSAGE);
        });

        it('| test SpinnerView class method - update with message', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.update(TEST_MESSAGE);
            // expect
            expect(spinner.oraSpinner.text).equal(TEST_MESSAGE);
        });

        it('| test SpinnerView class method - terminate with succeed style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate(SpinnerView.TERMINATE_STYLE.SUCCEED);
            // expect
            expect(succeedStub.callCount).equal(1);
            expect(succeedStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - terminate with fail style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate(SpinnerView.TERMINATE_STYLE.FAIL);
            // expect
            expect(failStub.callCount).equal(1);
            expect(failStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - terminate with warn style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate(SpinnerView.TERMINATE_STYLE.WARN);
            // expect
            expect(warnStub.callCount).equal(1);
            expect(warnStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - terminate with info style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate(SpinnerView.TERMINATE_STYLE.INFO);
            // expect
            expect(infoStub.callCount).equal(1);
            expect(infoStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - terminate with persist style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate(SpinnerView.TERMINATE_STYLE.PERSIST);
            // expect
            expect(stopAndPersistStub.callCount).equal(1);
            expect(stopAndPersistStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - terminate with clear style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate(SpinnerView.TERMINATE_STYLE.CLEAR);
            // expect
            expect(stopStub.callCount).equal(1);
            expect(stopStub.args[0][0]).equal(undefined);
        });

        it('| test SpinnerView class method - terminate with default style', () => {
            // call
            const spinner = new ProxySpinnerView();
            spinner.terminate();
            // expect
            expect(stopStub.callCount).equal(1);
            expect(stopStub.args[0][0]).equal(undefined);
        });
    });
});
