const chalk = require('chalk');
const { expect } = require('chai');
const fs = require('fs-extra');
const sinon = require('sinon');

const DialogController = require('@src/controllers/dialog-controller');
const DialogReplView = require('@src/view/dialog-repl-view');
const Messenger = require('@src/view/messenger');

describe('Controller test - dialog controller test', () => {
    const TEST_MSG = 'TEST_MSG';
    const RECORD_FORMAT = 'Please use the format: ".record <fileName>" or ".record <fileName> --append-quit"';

    describe('# test constructor', () => {
        it('| constructor with config parameter returns DialogController object', () => {
            // call
            const dialogController = new DialogController({
                profile: 'default',
                debug: true,
                skillId: 'a1b2c3',
                locale: 'en-US',
                stage: 'DEVELOPMENT',
                newSession: false
            });
            // verify
            expect(dialogController).to.be.instanceOf(DialogController);
            expect(dialogController.smapiClient.profile).equal('default');
            expect(dialogController.utteranceCache.length).equal(0);
        });

        it('| constructor with empty config object returns DialogController object', () => {
            // call
            const dialogController = new DialogController({});
            // verify
            expect(dialogController).to.be.instanceOf(DialogController);
            expect(dialogController.smapiClient.profile).equal(undefined);
            expect(dialogController.utteranceCache.length).equal(0);
        });

        it('| constructor with no args throws exception', () => {
            try {
                // setup & call
                new DialogController();
            } catch (err) {
                // verify
                expect(err).to.match(new RegExp('Cannot have an undefined configuration.'));
            }
        });
    });

    describe('# test class method - startSkillSimulation', () => {
        let simulateSkillStub;
        let dialogController;

        beforeEach(() => {
            dialogController = new DialogController({});
            simulateSkillStub = sinon.stub(dialogController.smapiClient.skill.test, 'simulateSkill');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| test utterance input and response is stored into appropriate caches', (done) => {
            // setup
            simulateSkillStub.callsArgWith(5, null, { msg: TEST_MSG });
            // call
            dialogController.startSkillSimulation(TEST_MSG, (err, response) => {
                // verify
                expect(err).equal(null);
                expect(dialogController.utteranceCache.length).equal(1);
                expect(dialogController.utteranceCache[0]).equal(response.msg);
                done();
            });
        });

        it('| test an error in request does not effect caches', (done) => {
            // setup
            simulateSkillStub.callsArgWith(5, TEST_MSG, null);
            // call
            dialogController.startSkillSimulation(TEST_MSG, (err, response) => {
                // verify
                expect(err).equal(TEST_MSG);
                expect(response).equal(undefined);
                expect(dialogController.utteranceCache.length).equal(0);
                done();
            });
        });
    });

    describe('# test class method - getSkillSimulationResult', () => {
        let getSimulationStub;
        let dialogController;

        beforeEach(() => {
            dialogController = new DialogController({});
            getSimulationStub = sinon.stub(dialogController.smapiClient.skill.test, 'getSimulation');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| test valid simulation response', (done) => {
            // setup
            const output = {
                statusCode: 200,
                headers: {},
                body: {
                    status: 'SUCCESSFUL',
                    msg: TEST_MSG
                }
            };
            getSimulationStub.callsArgWith(3, null, output);
            // call
            dialogController.getSkillSimulationResult(TEST_MSG, (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).to.deep.equal(output);
                done();
            });
        });

        it('| test an error in request', (done) => {
            // setup
            getSimulationStub.callsArgWith(3, TEST_MSG, null);
            // call
            dialogController.getSkillSimulationResult(TEST_MSG, (err, response) => {
                // verify
                expect(err).equal(TEST_MSG);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| test an error in response', (done) => {
            // setup
            const output = {
                statusCode: 200,
                headers: {},
                body: {
                    status: 'SUCCESSFUL',
                    msg: TEST_MSG,
                    result: {
                        error: {
                            message: TEST_MSG
                        }
                    }
                }
            };
            getSimulationStub.callsArgWith(3, null, output);
            // call
            dialogController.getSkillSimulationResult(TEST_MSG, (err, response) => {
                // verify
                expect(err).equal(TEST_MSG);
                expect(response).equal(undefined);
                done();
            });
        });
    });

    describe('# test class method - clearSession', () => {
        it('| values are reset after method call', () => {
            // setup
            const dialogController = new DialogController({});

            // call
            dialogController.clearSession();

            // verify
            expect(dialogController.newSession).equal(true);
        });
    });

    describe('# test class method - createReplayFile', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| successful replay file creation', () => {
            // setup
            const utterances = ['userUtterance'];
            const dialogController = new DialogController({});
            const fileSystemStub = sinon.stub(fs, 'outputJSONSync');

            // call
            dialogController.createReplayFile('random_file_name', utterances);

            // verify
            expect(fileSystemStub.callCount).equal(1);
            expect(fileSystemStub.args[0][1].userInput).deep.equal(utterances);
        });

        it('| file name is empty', () => {
            // setup
            const dialogController = new DialogController({});

            // call
            dialogController.createReplayFile('');

            // verify
            expect(dialogController.utteranceCache.length).equal(0);
        });
    });

    describe('# test class method - setupSpecialCommands', () => {
        const dialogController = new DialogController({});
        const dialogReplView = new DialogReplView({});

        afterEach(() => {
            sinon.restore();
        });

        it('| Invalid record command format', () => {
            // setup
            sinon.stub(DialogReplView.prototype, 'registerRecordCommand');
            DialogReplView.prototype.registerRecordCommand.callsArgWith(0, '');
            const warnStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                warn: warnStub
            });

            // call
            dialogController.setupSpecialCommands(dialogReplView, () => {});

            // verify
            expect(warnStub.args[0][0]).equal(`Incorrect format. ${RECORD_FORMAT}`);
        });

        it('| Invalid record command format, malformed --append-quit argument', () => {
            // setup
            const malFormedAppendQuitArgument = '--append';
            sinon.stub(DialogReplView.prototype, 'registerRecordCommand');
            DialogReplView.prototype.registerRecordCommand.callsArgWith(0, `history.json ${malFormedAppendQuitArgument}`);
            const warnStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                warn: warnStub
            });

            // call
            dialogController.setupSpecialCommands(dialogReplView, () => {});

            // verify
            expect(warnStub.args[0][0]).equal(`Unable to validate arguments: "${malFormedAppendQuitArgument}". ${RECORD_FORMAT}`);
        });

        it('| file is not of JSON type', () => {
            // setup
            const warnStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                warn: warnStub
            });
            sinon.stub(DialogReplView.prototype, 'registerRecordCommand');
            DialogReplView.prototype.registerRecordCommand.callsArgWith(0, 'file.yml');

            // call
            dialogController.setupSpecialCommands(dialogReplView, () => {});

            // verify
            expect(warnStub.args[0][0]).equal("File should be of type '.json'");
        });

        it('| replay file creation throws error', (done) => {
            // setup
            const infoStub = sinon.stub().throws(new Error(TEST_MSG));
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            const replayStub = sinon.stub(DialogController.prototype, 'createReplayFile');
            sinon.stub(DialogReplView.prototype, 'registerRecordCommand');
            DialogReplView.prototype.registerRecordCommand.callsArgWith(0, 'file.json');

            // call
            dialogController.setupSpecialCommands(dialogReplView, (error) => {
                expect(error.message).equal(TEST_MSG);
                expect(replayStub.calledOnce).equal(true);
                expect(infoStub.calledOnce).equal(true);
                done();
            });
        });

        it('| Valid record command format, with --append-quit argument', () => {
            // setup
            const appendQuitArgument = '--append-quit';
            const filePath = 'history.json';
            sinon.stub(DialogReplView.prototype, 'registerRecordCommand');
            DialogReplView.prototype.registerRecordCommand.callsArgWith(0, `${filePath} ${appendQuitArgument}`);
            const infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
            const replayStub = sinon.stub(DialogController.prototype, 'createReplayFile');

            // call
            dialogController.setupSpecialCommands(dialogReplView, () => {});

            // verify
            expect(infoStub.args[0][0]).equal(`Created replay file at ${filePath} (appended ".quit" to list of utterances).`);
            expect(replayStub.calledOnce).equal(true);
            expect(replayStub.args[0][0]).equal(filePath);
            expect(replayStub.args[0][1][0]).equal('.quit');
        });
    });

    describe('# test evaluateUtterance -', () => {
        const dialogController = new DialogController({});
        const utterance = 'hello';
        const simulationId = 'simulationId';
        const prompt = chalk.yellow.bold('Alexa > ');
        let infoStub;
        let errorStub;
        let terminateSpinnerStub;
        let updateSpinnerStub;
        let startSpinnerStub;
        let replViewStub;

        beforeEach(() => {
            infoStub = sinon.stub();
            errorStub = sinon.stub();
            terminateSpinnerStub = sinon.stub();
            updateSpinnerStub = sinon.stub();
            startSpinnerStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub,
                error: errorStub
            });
            replViewStub = {
                startProgressSpinner: startSpinnerStub,
                terminateProgressSpinner: terminateSpinnerStub,
                updateProgressSpinner: updateSpinnerStub
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| start skill simulation throws error', (done) => {
            // setup
            sinon.stub(DialogController.prototype, 'startSkillSimulation').callsArgWith(1, TEST_MSG);
            // call
            dialogController.evaluateUtterance(utterance, replViewStub, () => {
                // verify
                expect(startSpinnerStub.args[0][0]).equal('Sending simulation request to Alexa...');
                expect(terminateSpinnerStub.calledOnce).equal(true);
                expect(errorStub.args[0][0]).equal(TEST_MSG);
                done();
            });
        });

        it('| start skill simulation throws error', (done) => {
            // setup
            const response = {
                statusCode: 400,
                body: {
                    error: {
                        message: TEST_MSG
                    }
                }
            };
            sinon.stub(DialogController.prototype, 'startSkillSimulation').callsArgWith(1, null, response);
            // call
            dialogController.evaluateUtterance(utterance, replViewStub, () => {
                // verify
                expect(startSpinnerStub.args[0][0]).equal('Sending simulation request to Alexa...');
                expect(terminateSpinnerStub.calledOnce).equal(true);
                expect(errorStub.args[0][0]).equal(TEST_MSG);
                done();
            });
        });

        it('| get skill simulation result throws error', (done) => {
            // setup
            const response = {
                statusCode: 200,
                body: {
                    id: simulationId
                }
            };
            sinon.stub(DialogController.prototype, 'startSkillSimulation').callsArgWith(1, null, response);
            sinon.stub(DialogController.prototype, 'getSkillSimulationResult').callsArgWith(1, TEST_MSG);
            // call
            dialogController.evaluateUtterance(utterance, replViewStub, () => {
                // verify
                expect(startSpinnerStub.args[0][0]).equal('Sending simulation request to Alexa...');
                expect(updateSpinnerStub.args[0][0]).equal('Waiting for the simulation response...');
                expect(terminateSpinnerStub.calledOnce).equal(true);
                expect(errorStub.args[0][0]).equal(TEST_MSG);
                done();
            });
        });

        it('| valid response is returned with existing session', (done) => {
            // setup
            const response = {
                statusCode: 200,
                body: {
                    id: simulationId,
                    result: {
                        alexaExecutionInfo: {
                            alexaResponses: [{
                                content: {
                                    caption: 'hello'
                                }
                            }]
                        },
                        skillExecutionInfo: {
                            invocations: ['hello']
                        }
                    }
                }
            };
            sinon.stub(DialogController.prototype, 'startSkillSimulation').callsArgWith(1, null, response);
            sinon.stub(DialogController.prototype, 'getSkillSimulationResult').callsArgWith(1, null, response);
            // call
            dialogController.evaluateUtterance(utterance, replViewStub, () => {
                // verify
                expect(startSpinnerStub.args[0][0]).equal('Sending simulation request to Alexa...');
                expect(updateSpinnerStub.args[0][0]).equal('Waiting for the simulation response...');
                expect(terminateSpinnerStub.calledOnce).equal(true);
                expect(infoStub.args[0][0]).equal(`${prompt}hello`);
                done();
            });
        });

        it('| valid response is returned with a new session', (done) => {
            // setup
            const response = {
                statusCode: 200,
                body: {
                    id: simulationId,
                    result: {
                        alexaExecutionInfo: {
                            alexaResponses: [{
                                content: {
                                    caption: 'hello'
                                }
                            }]
                        },
                        skillExecutionInfo: {
                            invocations: [{
                                invocationResponse: {
                                    body: {
                                        response: {
                                            shouldEndSession: true
                                        }
                                    }
                                }
                            }]
                        }
                    }
                }
            };
            sinon.stub(DialogController.prototype, 'startSkillSimulation').callsArgWith(1, null, response);
            sinon.stub(DialogController.prototype, 'getSkillSimulationResult').callsArgWith(1, null, response);
            const clearSessionStub = sinon.stub(DialogController.prototype, 'clearSession');
            // call
            dialogController.evaluateUtterance(utterance, replViewStub, () => {
                // verify
                expect(startSpinnerStub.args[0][0]).equal('Sending simulation request to Alexa...');
                expect(updateSpinnerStub.args[0][0]).equal('Waiting for the simulation response...');
                expect(terminateSpinnerStub.calledOnce).equal(true);
                expect(clearSessionStub.calledOnce).equal(true);
                expect(infoStub.args[0][0]).equal('Session ended');
                expect(infoStub.args[1][0]).equal(`${prompt}hello`);
                done();
            });
        });
    });
});
