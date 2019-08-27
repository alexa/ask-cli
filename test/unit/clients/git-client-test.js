
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Clients test - cli git client', () => {
    describe('# git clone check', () => {
        const TEST_CLONE_DIR = 'testCloneDir';
        const TEST_CLONE_URL = 'https://test.git';
        const TEST_BRANCH = 'branch';
        const TEST_ERROR = 'testError';

        it('| git clone a repo with branch fails, returns error', () => {
            // setup
            const cloneStub = sinon.stub();
            const proxygitClient = proxyquire('@src/clients/git-client', {
                'simple-git': () => {
                    return {
                        silent: () => {
                            return {
                                clone: cloneStub
                            };
                        }
                    };
                }
            });
            cloneStub.callsArgOnWith(3, {}, TEST_ERROR);

            // call
            proxygitClient.clone(TEST_CLONE_URL, TEST_BRANCH, TEST_CLONE_DIR, (err) => {
                expect(err).to.equal(TEST_ERROR);
            });
            // verify
            expect(cloneStub.args[0][0]).to.equal(TEST_CLONE_URL);
            expect(cloneStub.args[0][1]).to.equal(TEST_CLONE_DIR);
            expect(cloneStub.args[0][2]).to.deep.equal(['-b', TEST_BRANCH]);
        });

        it('| git clone a repo without branch succeed, callback normal', () => {
            // setup
            const cloneStub = sinon.stub();
            const proxygitClient = proxyquire('@src/clients/git-client', {
                'simple-git': () => {
                    return {
                        silent: () => {
                            return {
                                clone: cloneStub
                            };
                        }
                    };
                }
            });
            cloneStub.callsArgOnWith(3, {});

            // call
            proxygitClient.clone(TEST_CLONE_URL, null, TEST_CLONE_DIR, (err) => {
                expect(err).to.equal(undefined);
            });
            // verify
            expect(cloneStub.args[0][0]).to.equal(TEST_CLONE_URL);
            expect(cloneStub.args[0][1]).to.equal(TEST_CLONE_DIR);
            expect(cloneStub.args[0][2]).to.deep.equal([]);
        });
    });
});
