const sinon = require('sinon');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');

const AbstractConfigFile = require('@src/model/abstract-config-file');
const AskStates = require('@src/model/resources-config/ask-states');

describe('Model test resources config - ask states test', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const RESOURCS_CONFIG_PATH = path.join(FIXTURE_PATH, 'resources-config.json');
    const YAML_RESOURCES_CONFIG_PATH = path.join(FIXTURE_PATH, 'resources-config.yaml');

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        const NOT_EXISTING_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'out-of-noWhere.json');
        const INVALID_JSON_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'invalid-json.json');

        it('| initiate as an AskStates class', () => {
            const projConfig = new AskStates(RESOURCS_CONFIG_PATH);
            expect(projConfig).to.be.instanceof(AskStates);
        });

        it('| make sure AskStates class is singleton', () => {
            const config1 = new AskStates(RESOURCS_CONFIG_PATH);
            const config2 = new AskStates(RESOURCS_CONFIG_PATH);
            expect(config1 === config2).equal(true);
        });

        it('| make sure YAML and JSON resources config can both be created well', () => {
            const yamlConfig = new AskStates(YAML_RESOURCES_CONFIG_PATH);
            const jsonConfig = fs.readJSONSync(RESOURCS_CONFIG_PATH);
            expect(yamlConfig.content).deep.equal(jsonConfig);
        });

        it('| get instance function return the instance constructed before', () => {
            const projConfig = new AskStates(RESOURCS_CONFIG_PATH);
            expect(AskStates.getInstance() === projConfig).equal(true);
        });

        it('| dispose the instance correctly', () => {
            new AskStates(RESOURCS_CONFIG_PATH);
            AskStates.dispose();
            expect(AskStates.getInstance()).equal(null);
        });

        it('| init with a file path not existing, expect correct error message thrown', () => {
            try {
                new AskStates(NOT_EXISTING_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `File ${NOT_EXISTING_PROJECT_CONFIG_PATH} not exists.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        it('| init with a file path without access permission, expect correct error message thrown', () => {
            // setup
            fs.chmodSync(RESOURCS_CONFIG_PATH, 0o111);
            try {
                // call
                new AskStates(RESOURCS_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                // verify
                const expectedError = `No access to read/write file ${RESOURCS_CONFIG_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            } finally {
                // clear
                fs.chmodSync(RESOURCS_CONFIG_PATH, 0o644);
            }
        });

        it('| init with a invalid json file, expect correct error message thrown', () => {
            try {
                new AskStates(INVALID_JSON_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `Failed to parse JSON file ${INVALID_JSON_PROJECT_CONFIG_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        afterEach(() => {
            AskStates.dispose();
        });
    });

    describe('# inspect class static property', () => {
        it('| check BASE correctness', () => {
            expect(AskStates.BASE).deep.equal({
                askcliStatesVersion: '2020-03-31',
                profiles: {}
            });
        });
    });

    describe('# verify method withContent', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| expect AbstractConfigFile withContent gets called and return AskResources instance', () => {
            // setup
            sinon.stub(AbstractConfigFile, 'withContent');
            sinon.stub(AbstractConfigFile.prototype, '_validateFilePath');
            sinon.stub(AbstractConfigFile.prototype, 'read');
            // call
            AskStates.withContent(RESOURCS_CONFIG_PATH);
            // expect
            expect(AskStates.getInstance()).to.be.instanceof(AskStates);
        });
    });
});
