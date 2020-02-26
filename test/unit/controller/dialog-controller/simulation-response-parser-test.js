const { expect } = require('chai');
const responseParser = require('@src/controllers/dialog-controller/simulation-response-parser');

describe('Controller test - skill simulation response parser tests', () => {
    describe('# helper function - getConsideredIntents', () => {
        it('| Test for defined result', () => {
            // setup
            const TEST_RES = { foo: 'bar' };
            const TEST_OBJ = {
                result: {
                    alexaExecutionInfo: {
                        consideredIntents: TEST_RES
                    }
                }
            };
            // call
            const res = responseParser.getConsideredIntents(TEST_OBJ);
            // verify
            expect(res).deep.equal(TEST_RES);
        });

        it('| Test for undefined result', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    alexaExecutionInfo: {}
                }
            };
            // call
            const res = responseParser.getConsideredIntents(TEST_OBJ);
            // verify
            expect(res).to.eql([]);
        });
    });

    describe('# helper function - getJsonInputAndOutputs', () => {
        const TEST_MSG = 'TEST_MSG';

        it('| Test for undefined invocations', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    skillExecutionInfo: {}
                }
            };
            // call
            const res = responseParser.getJsonInputAndOutputs(TEST_OBJ);
            // verify
            expect(res).to.eql([]);
        });

        it('| Test for equal invocations requests and responses', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    skillExecutionInfo: {
                        invocations: [
                            {
                                invocationRequest: {
                                    body: TEST_MSG
                                },
                                invocationResponse: {
                                    body: TEST_MSG
                                }
                            },
                            {
                                invocationRequest: {
                                    body: TEST_MSG
                                },
                                invocationResponse: {
                                    body: TEST_MSG
                                }
                            }
                        ]
                    }
                }
            };
            // call
            const res = responseParser.getJsonInputAndOutputs(TEST_OBJ);
            // verify
            expect(res.length).equal(2);
            expect(res[0].jsonInput).deep.equal(TEST_MSG);
            expect(res[0].jsonOutput).deep.equal({ body: TEST_MSG });
            expect(res[1].jsonInput).deep.equal(TEST_MSG);
            expect(res[1].jsonOutput).deep.equal({ body: TEST_MSG });
        });

        it('| Test for unequal invocations requests and responses', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    skillExecutionInfo: {
                        invocations: [
                            {
                                invocationRequest: {
                                    body: TEST_MSG
                                }
                            },
                            {
                                invocationRequest: {
                                    body: TEST_MSG
                                },
                                invocationResponse: {
                                    body: TEST_MSG
                                }
                            }
                        ]
                    }
                }
            };
            // call
            const res = responseParser.getJsonInputAndOutputs(TEST_OBJ);
            // verify
            expect(res.length).equal(2);
            expect(res[0].jsonInput).equal(TEST_MSG);
            expect(res[0].jsonOutput).to.eql({});
            expect(res[1].jsonInput).equal(TEST_MSG);
            expect(res[1].jsonOutput).to.eql({ body: TEST_MSG });
        });
    });

    describe('# helper function - shouldEndSession', () => {
        it('| Test for undefined invocations', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    skillExecutionInfo: {}
                }
            };
            // call
            const res = responseParser.shouldEndSession(TEST_OBJ);
            // verify
            expect(res).equal(false);
        });

        it('| Test for invocations with one response with shouldEndSession', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    skillExecutionInfo: {
                        invocations: [
                            {
                                invocationResponse: {
                                    body: {
                                        response: {
                                            shouldEndSession: true
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            };
            // call
            const res = responseParser.shouldEndSession(TEST_OBJ);
            // verify
            expect(res).equal(true);
        });

        it('| Test for invocations with no response with shouldEndSession', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    skillExecutionInfo: {
                        invocations: [
                            {
                                invocationResponse: {
                                    body: {
                                        response: {
                                            shouldEndSession: false
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            };
            // call
            const res = responseParser.shouldEndSession(TEST_OBJ);
            // verify
            expect(res).equal(false);
        });
    });

    describe('# helper function - getErrorMessage', () => {
        const TEST_MSG = 'TEST_MSG';

        it('| Test with undefined error message', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    error: {}
                }
            };
            // call
            const res = responseParser.getErrorMessage(TEST_OBJ);
            // verify
            expect(res).equal(undefined);
        });

        it('| Test with defined error message', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    error: {
                        message: TEST_MSG
                    }
                }
            };
            // call
            const res = responseParser.getErrorMessage(TEST_OBJ);
            // verify
            expect(res).equal(TEST_MSG);
        });
    });

    describe('# helper function - getCaption', () => {
        const TEST_MSG = 'TEST_MSG';

        it('| Test with undefined alexaResponse', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    alexaExecutionInfo: {}
                }
            };
            // call
            const res = responseParser.getCaption(TEST_OBJ);
            // verify
            expect(res).to.eql([]);
        });

        it('| Test with undefined caption array', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    alexaExecutionInfo: {
                        alexaResponses: []
                    }
                }
            };
            // call
            const res = responseParser.getCaption(TEST_OBJ);
            // verify
            expect(res).to.eql([]);
        });

        it('| Test with defined captions array', () => {
            // setup
            const TEST_OBJ = {
                result: {
                    alexaExecutionInfo: {
                        alexaResponses: [
                            {
                                content: {
                                    caption: TEST_MSG
                                }
                            }
                        ]
                    }
                }
            };
            // call
            const res = responseParser.getCaption(TEST_OBJ);
            // verify
            expect(res).to.be.instanceOf(Array);
            expect(res.length).equal(1);
            expect(res[0]).equal(TEST_MSG);
        });
    });

    describe('# helper function - getStatus', () => {
        it('| Test with undefined status', () => {
            // setup
            const TEST_OBJ = {};
            // call
            const res = responseParser.getStatus(TEST_OBJ);
            // verify
            expect(res).equal(undefined);
        });

        it('| Test with defined status', () => {
            // setup
            const TEST_MSG = 'TEST_MSG';
            const TEST_OBJ = {
                status: TEST_MSG
            };
            // call
            const res = responseParser.getStatus(TEST_OBJ);
            // verify
            expect(res).equal(TEST_MSG);
        });
    });

    describe('# helper function - getSimulationId', () => {
        it('| Test with undefined id', () => {
            // setup
            const TEST_OBJ = {};
            // call
            const res = responseParser.getSimulationId(TEST_OBJ);
            // verify
            expect(res).equal(undefined);
        });

        it('| Test with defined id', () => {
            // setup
            const TEST_MSG = 'TEST_MSG';
            const TEST_OBJ = {
                id: TEST_MSG
            };
            // call
            const res = responseParser.getSimulationId(TEST_OBJ);
            // verify
            expect(res).equal(TEST_MSG);
        });
    });
});
