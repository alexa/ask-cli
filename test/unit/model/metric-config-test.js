const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const { METRICS } = require('@src/utils/constants');
const MetricConfig = require('@src/model/metric-config');

describe('Model test - metric config test', () => {
    const configPath = 'somepath';

    describe('# inspect correctness of getters when config file is present', () => {
        const existingMachineId = 'existing-machine-id';

        beforeEach(() => {
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - METRICS.NEW_USER_LENGTH_DAYS - 1);

            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'readFileSync').returns(JSON.stringify({ machineId: existingMachineId, createdAt }));
            sinon.stub(jsonfile, 'writeFileSync');
        });

        it('| returns correct machine id', () => {
            const metricConfig = new MetricConfig(configPath);
            const { machineId } = metricConfig;
            expect(metricConfig).to.be.instanceof(MetricConfig);
            expect(machineId).eq(existingMachineId);
        });

        it('| returns correct is new user flag', () => {
            const metricConfig = new MetricConfig(configPath);
            const isNewUser = metricConfig.isNewUser();
            expect(metricConfig).to.be.instanceof(MetricConfig);
            expect(isNewUser).eq(false);
        });

        afterEach(() => {
            sinon.restore();
        });
    });

    describe('# inspect correctness of getters when config file is not present', () => {
        const newMachineId = 'new-machine-id';

        beforeEach(() => {
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - METRICS.NEW_USER_LENGTH_DAYS + 1);
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'ensureDirSync');
            sinon.stub(fs, 'readFileSync').returns(JSON.stringify({ machineId: newMachineId, createdAt }));
            sinon.stub(jsonfile, 'writeFileSync');
        });

        it('| returns correct machine id', () => {
            const metricConfig = new MetricConfig(configPath);
            const { machineId } = metricConfig;
            expect(metricConfig).to.be.instanceof(MetricConfig);
            expect(machineId).eq(newMachineId);
        });

        it('| returns correct is new user flag', () => {
            const metricConfig = new MetricConfig(configPath);
            const isNewUser = metricConfig.isNewUser();
            expect(metricConfig).to.be.instanceof(MetricConfig);
            expect(isNewUser).eq(true);
        });

        afterEach(() => {
            sinon.restore();
        });
    });
});
