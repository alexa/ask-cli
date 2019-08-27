const { expect } = require('chai');
const sinon = require('sinon');
const inquirer = require('inquirer');
const helper = require('@src/commands/api/publishing/withdraw/helper');

describe('Commands withdraw - helper test', () => {
    const TEST_EXISTING_REASON = 'This is a test skill and is not meant for certification';
    const TEST_EXISTING_REASON_ENUM = 'TEST_SKILL';
    const TEST_OTHER_REASON_ENUM = 'OTHER';
    const TEST_OTHER_REASON = 'Other reason';
    const TEST_CUSTOM_REASON = 'My Reason';

    describe('# collectWithdrawPayload check', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        it('| Withdraw reason of existing type entered by user is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ reason: TEST_EXISTING_REASON });
            // call
            helper.collectWithdrawPayload((reasonEnum, reason) => {
                // verify
                expect(reasonEnum).equal(TEST_EXISTING_REASON_ENUM);
                expect(reason).to.be.null;
                done();
            });
        });

        it('| Withdraw reason of other type entered by user is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ reason: TEST_OTHER_REASON, message: TEST_CUSTOM_REASON });
            // call
            helper.collectWithdrawPayload((reasonEnum, reason) => {
                // verify

                expect(reasonEnum).equal(TEST_OTHER_REASON_ENUM);
                expect(reason).equal(TEST_CUSTOM_REASON);
                done();
            });
        });

        afterEach(() => {
            inquirer.prompt.restore();
        });
    });
});
