const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');

const RegionalStackFile = require('@src/model/regional-stack-file');

describe('Model test - regional stack file test', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const REGIONAL_STACK_PATH = path.join(FIXTURE_PATH, 'regional-stack-file.json');
    const YAML_REGIONAL_STACK_PATH = path.join(FIXTURE_PATH, 'regional-stack-file.yaml');

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        const NOT_EXISTING_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'out-of-noWhere.json');
        const INVALID_JSON_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'invalid-json.json');

        it('| initiate as a RegionalStackFile class', () => {
            const projConfig = new RegionalStackFile(REGIONAL_STACK_PATH);
            expect(projConfig).to.be.instanceof(RegionalStackFile);
        });

        it('| make sure RegionalStackFile class is singleton', () => {
            const config1 = new RegionalStackFile(REGIONAL_STACK_PATH);
            const config2 = new RegionalStackFile(REGIONAL_STACK_PATH);
            expect(config1 === config2).equal(true);
        });

        it('| make sure YAML and JSON resources config can both be created well', () => {
            const yamlConfig = new RegionalStackFile(YAML_REGIONAL_STACK_PATH);
            const jsonConfig = jsonfile.readFileSync(REGIONAL_STACK_PATH);
            expect(yamlConfig.content).deep.equal(jsonConfig);
        });

        it('| get instance function return the instance constructed before', () => {
            const projConfig = new RegionalStackFile(REGIONAL_STACK_PATH);
            expect(RegionalStackFile.getInstance() === projConfig).equal(true);
        });

        it('| dispose the instance correctly', () => {
            new RegionalStackFile(REGIONAL_STACK_PATH);
            RegionalStackFile.dispose();
            expect(RegionalStackFile.getInstance()).equal(null);
        });

        it('| init with a file path not existing, expect correct error message thrown', () => {
            try {
                new RegionalStackFile(NOT_EXISTING_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `File ${NOT_EXISTING_PROJECT_CONFIG_PATH} not exists.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        it('| init with a file path without access permission, expect correct error message thrown', () => {
            // setup
            fs.chmodSync(REGIONAL_STACK_PATH, 0o111);
            try {
                // call
                new RegionalStackFile(REGIONAL_STACK_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                // verify
                const expectedError = `No access to read/write file ${REGIONAL_STACK_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            } finally {
                // clear
                fs.chmodSync(REGIONAL_STACK_PATH, 0o644);
            }
        });

        it('| init with a invalid json file, expect correct error message thrown', () => {
            try {
                new RegionalStackFile(INVALID_JSON_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `Failed to parse JSON file ${INVALID_JSON_PROJECT_CONFIG_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        afterEach(() => {
            RegionalStackFile.dispose();
        });
    });

    describe('# inspect correctness for getter and setter for different fields', () => {
        const TEST_BUCKET = 'BUCKET';
        const TEST_KEY = 'KEY';
        const TEST_VERSION = 'VERSION';
        const jsonFileObject = jsonfile.readFileSync(REGIONAL_STACK_PATH);

        beforeEach(() => {
            new RegionalStackFile(REGIONAL_STACK_PATH);
        });

        afterEach(() => {
            RegionalStackFile.dispose();
        });

        describe('# verify method getResources()', () => {
            it('| get resource object', () => {
                expect(RegionalStackFile.getInstance().getResources()).deep.equal(jsonFileObject.Resources);
            });
        });

        describe('# verify method getLambdaFunction()', () => {
            it('| get aws lambda function object', () => {
                expect(RegionalStackFile.getInstance().getLambdaFunction()).deep.equal(jsonFileObject.Resources.AlexaSkillFunction);
            });

            it('| return null when aws lambda function object is empty', () => {
                RegionalStackFile.getInstance().content.Resources.AlexaSkillFunction = undefined;
                expect(RegionalStackFile.getInstance().getLambdaFunction()).equal(null);
            });

            it('| return null when resources object is empty', () => {
                RegionalStackFile.getInstance().content.Resources = undefined;
                expect(RegionalStackFile.getInstance().getLambdaFunction()).equal(null);
            });
        });

        describe('# verify method setLambdaFunctionCode()', () => {
            it('| set aws lambda function code property correctly', () => {
                expect(RegionalStackFile.getInstance().setLambdaFunctionCode(TEST_BUCKET, TEST_KEY, TEST_VERSION));
                expect(RegionalStackFile.getInstance().getLambdaFunction().Properties.Code).deep.equal({
                    S3Bucket: TEST_BUCKET,
                    S3Key: TEST_KEY,
                    S3ObjectVersion: TEST_VERSION
                });
            });

            it('| throw error when no resources property exists in template', () => {
                RegionalStackFile.getInstance().content.Resources = undefined;
                try {
                    RegionalStackFile.getInstance().setLambdaFunctionCode(TEST_BUCKET, TEST_KEY, TEST_VERSION);
                } catch (e) {
                    expect(e.message).equal('[Error]: Resources field must not be empty in regional template file');
                }
            });
        });
    });
});
