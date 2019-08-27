const { expect } = require('chai');
const sinon = require('sinon');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const Messenger = require('@src/view/messenger');

describe('View test - messenger file test', () => {
    const TEST_MESSAGE = 'TEST_MESSAGE';
    const TEST_TIME = 'TEST_TIME';
    const TEST_ERROR_OBJ = new Error('TEST_ERROR');

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        beforeEach(() => {
            sinon.stub(fs, 'writeFileSync');
        });

        it('| initiate as a Messenger class', () => {
            const messenger = new Messenger({ doDebug: false });
            expect(messenger).to.be.instanceof(Messenger);
            Messenger.getInstance().dispose();
            expect(Messenger.getInstance()).to.be.instanceof(Messenger);
        });

        it('| make sure Messenger class is singleton', () => {
            const messenger1 = new Messenger({ doDebug: false });
            const messenger2 = new Messenger({ doDebug: false });
            expect(messenger1 === messenger2).equal(true);
            Messenger.getInstance().dispose();
        });

        it('| get instance function return the instance constructed before', () => {
            const messenger = new Messenger({ doDebug: false });
            expect(Messenger.getInstance() === messenger).equal(true);
            Messenger.getInstance().dispose();
        });

        it('| init with doDebug parameter not existing, expect doDebug property equal to false ', () => {
            const messenger = new Messenger({ doDebug: false });
            expect(messenger.doDebug).equal(false);
            Messenger.getInstance().dispose();
        });

        it('| init with doDebug parameter equal to true, expect doDebug property equal to true ', () => {
            const messenger = new Messenger({ doDebug: true });
            expect(messenger.doDebug).equal(true);
            Messenger.getInstance().dispose();
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# inspect all log methods and make sure they work well on debug mode', () => {
        beforeEach(() => {
            // Clear Messenger instance before running each test to ensure test result don't get affected by failures from others
            if (Messenger.getInstance()) {
                Messenger.getInstance().dispose();
            }

            new Messenger({ doDebug: true });
            sinon.stub(Messenger, 'getTime').callsFake(() => TEST_TIME);
            sinon.stub(fs, 'writeFileSync');
        });

        it('| debug function correctly push message to buffer, and can display message on debug mode', () => {
            const stub = sinon.stub(console, 'warn');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'DEBUG',
                level: 20,
                msg: TEST_MESSAGE
            };

            // call
            Messenger.getInstance().debug(TEST_MESSAGE);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(stub.args[0][0]).equal(chalk`{gray [Debug]: ${TEST_MESSAGE}}`);

            // clear
            Messenger.getInstance().dispose();
        });

        it('| debug function correctly push message to buffer, but display nothing when not on debug mode', () => {
            Messenger.getInstance().dispose();
            new Messenger({ doDebug: false });
            const stub = sinon.stub(console, 'warn');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'DEBUG',
                level: 20,
                msg: TEST_MESSAGE
            };
            sinon.spy(Messenger, 'displayWithStyle');

            // call
            Messenger.getInstance().debug(TEST_MESSAGE);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(Messenger.displayWithStyle.calledOnce).equal(false);
            expect(stub.called).equal(false);

            // clear
            Messenger.getInstance().dispose();
        });

        it('| info function correctly push message to buffer and display', () => {
            const stub = sinon.stub(console, 'log');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'INFO',
                level: 30,
                msg: TEST_MESSAGE
            };

            // call
            Messenger.getInstance().info(TEST_MESSAGE);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(stub.args[0][0]).equal(`${TEST_MESSAGE}`);

            // clear
            Messenger.getInstance().dispose();

            // restore console.log first, otherwise cannot print test result to console
            console.log.restore();
        });

        it('| warn function correctly push message to buffer and display', () => {
            const stub = sinon.stub(console, 'warn');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'WARN',
                level: 40,
                msg: TEST_MESSAGE
            };

            // call
            Messenger.getInstance().warn(TEST_MESSAGE);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(stub.args[0][0]).equal(chalk`{bold.yellow [Warn]: ${TEST_MESSAGE}}`);

            // clear
            Messenger.getInstance().dispose();
        });

        it('| error function correctly push message to buffer and display', () => {
            const stub = sinon.stub(console, 'error');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'ERROR',
                level: 50,
                msg: TEST_MESSAGE
            };

            // call
            Messenger.getInstance().error(TEST_MESSAGE);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(stub.args[0][0]).equal(chalk`{bold.red [Error]: ${TEST_MESSAGE}}`);

            // clear
            Messenger.getInstance().dispose();
        });

        it('| fatal function correctly push message to buffer and display', () => {
            const stub = sinon.stub(console, 'error');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'FATAL',
                level: 60,
                msg: TEST_MESSAGE
            };

            // call
            Messenger.getInstance().fatal(TEST_MESSAGE);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(stub.args[0][0]).equal(chalk`{bold.rgb(128, 0, 0) [Fatal]: ${TEST_MESSAGE}}`);

            // clear
            Messenger.getInstance().dispose();
        });

        it('| fatal function correctly push error stack to buffer and display', () => {
            const stub = sinon.stub(console, 'error');
            const expectedItem = {
                time: TEST_TIME,
                operation: 'FATAL',
                level: 60,
                msg: TEST_ERROR_OBJ.stack.substring(7),
            };

            // call
            Messenger.getInstance().fatal(TEST_ERROR_OBJ);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
            expect(stub.args[0][0]).equal(chalk`{bold.rgb(128, 0, 0) [Fatal]: ${TEST_ERROR_OBJ.stack.substring(7)}}`);

            // clear
            Messenger.getInstance().dispose();
        });

        it('| trace function correctly push message to buffer and write to file with complete message', () => {
            const TEST_ACTIVITY = 'TEST_ACTIVITY';
            const TEST_METHOD = 'TEST_METHOD';
            const TEST_URL = 'TEST_URL';
            const TEST_HEADERS = 'TEST_HEADERS';
            const TEST_BODY = 'TEST_BODY';
            const TEST_STATUS_CODE = 'TEST_STATUS_CODE';
            const TEST_STATUS_MESSAGE = 'TEST_STATUS_MESSAGE';
            const TEST_ERROR = 'TEST_ERROR';
            const TEST_REQUEST_ID = 'TEST_REQUEST_ID';
            const message = {
                activity: TEST_ACTIVITY,
                request: {
                    method: TEST_METHOD,
                    url: TEST_URL,
                    headers: TEST_HEADERS,
                    body: TEST_BODY
                },
                response: {
                    statusCode: TEST_STATUS_CODE,
                    statusMessage: TEST_STATUS_MESSAGE,
                    headers: TEST_HEADERS
                },
                error: 'TEST_ERROR',
                'request-id': TEST_REQUEST_ID,
                body: TEST_BODY
            };
            const expectedItem = {
                time: TEST_TIME,
                operation: 'TRACE',
                level: 10,
                msg: message
            };
            const expectedContent = [
                `\n[TEST_TIME] - TRACE - ${TEST_ACTIVITY}`,
                `\nrequest-id: ${TEST_REQUEST_ID}`,
                `\nTEST_METHOD ${TEST_URL}`,
                `\nstatus code: ${TEST_STATUS_CODE} ${TEST_STATUS_MESSAGE}`,
                `\nerror: ${TEST_ERROR}\n`,
                `\nRequest headers: ${JSON.stringify('TEST_HEADERS')}`,
                `\nRequest body: ${TEST_BODY}`,
                `\nResponse headers: ${JSON.stringify(TEST_HEADERS)}`,
                `\nResponse body: ${JSON.stringify(TEST_BODY)}`,
                '\n----------------------------------------'
            ];
            const filePath = path.join(process.cwd(), `ask-cli-${TEST_TIME}.log`);
            sinon.stub(console, 'log');

            // call
            Messenger.getInstance().trace(message);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);

            // call
            Messenger.getInstance().dispose();

            // verify
            expect(fs.writeFileSync.args[0][0]).deep.equal(filePath);
            expect(fs.writeFileSync.args[0][1]).deep.equal(expectedContent);
            expect(console.log.args[0][0]).equal(`\nDetail log has been recorded at ${filePath}`);

            // restore console.log first, otherwise cannot print test result to console
            console.log.restore();
        });

        it('| trace function correctly push message to buffer and write to file with incomplete message', () => {
            const TEST_ACTIVITY = 'TEST_ACTIVITY';
            const TEST_METHOD = 'TEST_METHOD';
            const TEST_URL = 'TEST_URL';
            const TEST_HEADERS = 'TEST_HEADERS';
            const TEST_STATUS_CODE = 'TEST_STATUS_CODE';
            const TEST_STATUS_MESSAGE = 'TEST_STATUS_MESSAGE';
            const message = {
                activity: TEST_ACTIVITY,
                request: {
                    method: TEST_METHOD,
                    url: TEST_URL,
                    headers: TEST_HEADERS,
                },
                response: {
                    statusCode: TEST_STATUS_CODE,
                    statusMessage: TEST_STATUS_MESSAGE,
                    headers: TEST_HEADERS
                }
            };
            const expectedItem = {
                time: TEST_TIME,
                operation: 'TRACE',
                level: 10,
                msg: message
            };
            const expectedContent = [
                `\n[TEST_TIME] - TRACE - ${TEST_ACTIVITY}`,
                `\nTEST_METHOD ${TEST_URL}`,
                `\nstatus code: ${TEST_STATUS_CODE} ${TEST_STATUS_MESSAGE}`,
                `\nRequest headers: ${JSON.stringify('TEST_HEADERS')}`,
                `\nResponse headers: ${JSON.stringify(TEST_HEADERS)}`,
                '\n----------------------------------------'
            ];
            const filePath = path.join(process.cwd(), `ask-cli-${TEST_TIME}.log`);
            sinon.stub(console, 'log');

            // call
            Messenger.getInstance().trace(message);

            // verify
            expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);

            // call
            Messenger.getInstance().dispose();

            // verify
            expect(fs.writeFileSync.args[0][0]).deep.equal(filePath);
            expect(fs.writeFileSync.args[0][1]).deep.equal(expectedContent);
            expect(console.log.args[0][0]).equal(`\nDetail log has been recorded at ${filePath}`);

            // restore console.log first, otherwise cannot print test result to console
            console.log.restore();
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    it('| displayWithStyle can print bold but no color font', () => {
        new Messenger({ doDebug: true });
        const stub = sinon.stub(console, 'error');
        Messenger.displayWithStyle(null, 'error', true, TEST_MESSAGE);
        expect(stub.args[0][0]).equal(chalk`{bold ${TEST_MESSAGE}}`);
        sinon.restore();
    });
});
