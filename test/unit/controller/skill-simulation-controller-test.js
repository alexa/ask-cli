const { expect } = require('chai');
const sinon = require('sinon');

const jsonView = require('@src/view/json-view');

const SkillSimulationController = require('@src/controllers/skill-simulation-controller');

describe('Controller test - skill simulation controller test', () => {
    describe('# test constructor', () => {
        it('| constructor with config parameter returns SkillSimulationCotroller object', () => {
            // call
            const simulationController = new SkillSimulationController({
                profile: 'default',
                debug: true,
                skillId: 'a1b2c3',
                locale: 'en-US',
                stage: 'DEVELOPMENT'
            });
            // verify
            expect(simulationController).to.be.instanceOf(SkillSimulationController);
        });

        it('| constructor with empty config object returns SkillSimulationController object', () => {
            // call
            const simulationController = new SkillSimulationController({});
            // verify
            expect(simulationController).to.be.instanceOf(SkillSimulationController);
        });

        it('| constructor with no args throws exception', () => {
            try {
                // call
                new SkillSimulationController();
            } catch (err) {
                // verify
                expect(err).to.match(new RegExp('Cannot have an undefined configuration.'));
            }
        });
    });

    describe('# test class method - startSkillSimulation', () => {
        let simulateSkillStub;
        let simulationController;
        const TEST_MSG = 'TEST_MSG';

        before(() => {
            simulationController = new SkillSimulationController({});
            simulateSkillStub = sinon.stub(simulationController.smapiClient.skill.test, 'simulateSkill');
        });

        after(() => {
            sinon.restore();
        });

        it('| test for SMAPI.test.simulateSkill gives correct 200 response', (done) => {
            // setup
            const TEST_RES = {
                statusCode: 200,
                headers: {},
                body: {
                    id: 'a1b2c3',
                    status: 'IN_PROGRESS',
                    result: null
                }
            };
            simulateSkillStub.callsArgWith(5, null, TEST_RES);
            // call
            simulationController.startSkillSimulation(TEST_MSG, true, (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response.statusCode).equal(200);
                done();
            });
        });

        it('| test for SMAPI.test.simulateSkill gives correct 300+ error', (done) => {
            // setup
            const TEST_RES = {
                statusCode: 400,
                headers: {},
                body: {
                    message: TEST_MSG
                }
            };
            simulateSkillStub.callsArgWith(5, null, TEST_RES);
            // call
            simulationController.startSkillSimulation(TEST_MSG, true, (err, response) => {
                // verify
                expect(err).to.equal(jsonView.toString(TEST_RES.body));
                expect(response).to.equal(undefined);
                done();
            });
        });

        it('| test for SMAPI.test.simulateSkill gives correct error', (done) => {
            // setup
            simulateSkillStub.callsArgWith(5, TEST_MSG, null);
            // call
            simulationController.startSkillSimulation(TEST_MSG, true, (err, response) => {
                // verify
                expect(err).to.equal(TEST_MSG);
                expect(response).to.equal(undefined);
                done();
            });
        });
    });

    describe('# test class method - getSkillSimulationResult', () => {
        let simulationController;
        let getSimulationStub;
        const TEST_MSG = 'TEST_MSG';

        beforeEach(() => {
            simulationController = new SkillSimulationController({});
            getSimulationStub = sinon.stub(simulationController.smapiClient.skill.test, 'getSimulation');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSimulation polling terminates on SUCCESSFUL status received', (done) => {
            // setup
            const TEST_RES = {
                statusCode: 200,
                headers: {},
                body: {
                    status: 'SUCCESSFUL'
                }
            };
            getSimulationStub.callsArgWith(3, null, TEST_RES);
            // call
            simulationController.getSkillSimulationResult('', (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response.body.status).equal('SUCCESSFUL');
                done();
            });
        });

        it('| getSimulation polling terminates on statusCode greater than 300', (done) => {
            // setup
            const TEST_RES = {
                statusCode: 400,
                headers: {},
                body: {
                    status: 'SUCCESSFUL'
                }
            };
            getSimulationStub.callsArgWith(3, null, TEST_RES);
            // call
            simulationController.getSkillSimulationResult('', (err, response) => {
                // verify
                expect(err).equal(jsonView.toString(TEST_RES.body));
                expect(response).equal(undefined);
                done();
            });
        });

        it('| getSimulation polling terminates on FAILED status received', (done) => {
            // setup
            const TEST_RES = {
                statusCode: 200,
                headers: {},
                body: {
                    status: 'FAILED'
                }
            };
            getSimulationStub.callsArgWith(3, null, TEST_RES);
            // call
            simulationController.getSkillSimulationResult('', (err, response) => {
                // verify
                expect(err).equal(null);
                expect(response.body.status).equal('FAILED');
                done();
            });
        });

        it('| getSimulation polling terminates when max retry is reached from request error', (done) => {
            // setup
            getSimulationStub.callsArgWith(3, TEST_MSG);
            // call
            simulationController.getSkillSimulationResult('', (err, response) => {
                // verify
                expect(err).equal(TEST_MSG);
                expect(response).equal(undefined);
                done();
            });
        });
    });
});
