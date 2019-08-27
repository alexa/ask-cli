const { expect } = require('chai');
const sinon = require('sinon');
const helper = require('@src/commands/api/validation/validate-skill/helper');
const SpinnerView = require('@src/view/spinner-view');
const Retry = require('@src/utils/retry-utility');
const CONSTANTS = require('@src/utils/constants');

describe('Commands validate-skill - helper test', () => {
    const TEST_SKILL_ID = 'SKILL_ID';
    const TEST_VALIDATION_ID = 'VALIDATION_ID';
    const TEST_STAGE = 'live';
    const TEST_ERROR_MESSAGE = 'ERROR_MESSAGE';
    const TEST_HTTP_RESPONSE_BODY = { status: CONSTANTS.SKILL.VALIDATION_STATUS.SUCCESS };
    const TEST_INVALID_RESPONSE_BODY = {};
    const fakeSmapiClient = sinon.stub();

    describe('# pollingSkillValidationResult check', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| pollingSkillValidationResult return callback with error and response from polling call', (done) => {
            const spinnerStartStub = sinon.stub(SpinnerView.prototype, 'start');
            const spinnerTerminateStub = sinon.stub(SpinnerView.prototype, 'terminate');

            // Stubbing 'Retry' instead of '_keepPollingSkillValidationResult', because internal function calls cannot
            // be stubbed directly (https://github.com/sinonjs/sinon/issues/1684)
            sinon.stub(Retry, 'retry').callsArgWith(3, null, TEST_HTTP_RESPONSE_BODY);

            helper.pollingSkillValidationResult(fakeSmapiClient, TEST_SKILL_ID, TEST_VALIDATION_ID, TEST_STAGE, (err, response) => {
                expect(err).equal(null);
                expect(response).equal(TEST_HTTP_RESPONSE_BODY);
                sinon.assert.calledOnce(spinnerStartStub);
                sinon.assert.calledOnce(spinnerTerminateStub);
                done();
            });
        });
    });

    describe('# _keepPollingSkillValidationResult check', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| _keepPollingSkillValidationResult return error when retry call fails', (done) => {
            sinon.stub(Retry, 'retry').callsArgWith(3, TEST_ERROR_MESSAGE);
            helper._keepPollingSkillValidationResult(fakeSmapiClient, TEST_SKILL_ID, TEST_VALIDATION_ID, TEST_STAGE, (err, response) => {
                expect(err).equal(TEST_ERROR_MESSAGE);
                expect(response).equal();
                done();
            });
        });

        it('| _keepPollingSkillValidationResult return error when retry call succeeds with no response status', (done) => {
            sinon.stub(Retry, 'retry').callsArgWith(3, null, TEST_INVALID_RESPONSE_BODY);
            helper._keepPollingSkillValidationResult(fakeSmapiClient, TEST_SKILL_ID, TEST_VALIDATION_ID, TEST_STAGE, (err, response) => {
                expect(err).equal(`[Error]: Unable to get skill validation result for validation id: ${TEST_VALIDATION_ID}`);
                expect(response).equal();
                done();
            });
        });

        it('| _keepPollingSkillValidationResult return error when retry call succeeds', (done) => {
            sinon.stub(Retry, 'retry').callsArgWith(3, null, TEST_HTTP_RESPONSE_BODY);
            helper._keepPollingSkillValidationResult(fakeSmapiClient, TEST_SKILL_ID, TEST_VALIDATION_ID, TEST_STAGE, (err, response) => {
                expect(err).equal(null);
                expect(response).equal(TEST_HTTP_RESPONSE_BODY);
                done();
            });
        });
    });
});
