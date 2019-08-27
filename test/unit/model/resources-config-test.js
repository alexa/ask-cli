const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');

const ResourcesConfig = require('@src/model/resources-config');

describe('Model test - resources config test', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const RESOURCS_CONFIG_PATH = path.join(FIXTURE_PATH, 'resources-config.json');
    const YAML_RESOURCES_CONFIG_PATH = path.join(FIXTURE_PATH, 'resources-config.yaml');
    const TEST_PROFILE = 'default';

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        const NOT_EXISTING_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'out-of-noWhere.json');
        const INVALID_JSON_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'invalid-json.json');

        it('| initiate as a ResourcesConfig class', () => {
            const projConfig = new ResourcesConfig(RESOURCS_CONFIG_PATH);
            expect(projConfig).to.be.instanceof(ResourcesConfig);
        });

        it('| make sure ResourcesConfig class is singleton', () => {
            const config1 = new ResourcesConfig(RESOURCS_CONFIG_PATH);
            const config2 = new ResourcesConfig(RESOURCS_CONFIG_PATH);
            expect(config1 === config2).equal(true);
        });

        it('| make sure YAML and JSON resources config can both be created well', () => {
            const yamlConfig = new ResourcesConfig(YAML_RESOURCES_CONFIG_PATH);
            const jsonConfig = jsonfile.readFileSync(RESOURCS_CONFIG_PATH);
            expect(yamlConfig.content).deep.equal(jsonConfig);
        });

        it('| get instance function return the instance constructed before', () => {
            const projConfig = new ResourcesConfig(RESOURCS_CONFIG_PATH);
            expect(ResourcesConfig.getInstance() === projConfig).equal(true);
        });

        it('| dispose the instance correctly', () => {
            new ResourcesConfig(RESOURCS_CONFIG_PATH);
            ResourcesConfig.dispose();
            expect(ResourcesConfig.getInstance()).equal(null);
        });

        it('| init with a file path not existing, expect correct error message thrown', () => {
            try {
                new ResourcesConfig(NOT_EXISTING_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `File ${NOT_EXISTING_PROJECT_CONFIG_PATH} not exists.`;
                expect(err).to.match(new RegExp(expectedError));
            }
        });

        it('| init with a file path without access permission, expect correct error message thrown', () => {
            // setup
            fs.chmodSync(RESOURCS_CONFIG_PATH, 0o111);
            try {
                // call
                new ResourcesConfig(RESOURCS_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                // verify
                const expectedError = `No access to read/write file ${RESOURCS_CONFIG_PATH}.`;
                expect(err).to.match(new RegExp(expectedError));
            } finally {
                // clear
                fs.chmodSync(RESOURCS_CONFIG_PATH, 0o644);
            }
        });

        it('| init with a invalid json file, expect correct error message thrown', () => {
            try {
                new ResourcesConfig(INVALID_JSON_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `Failed to parse JSON file ${INVALID_JSON_PROJECT_CONFIG_PATH}.`;
                expect(err).to.match(new RegExp(expectedError));
            }
        });

        afterEach(() => {
            ResourcesConfig.dispose();
        });
    });

    describe('# inspect special case static methods in resources config model', () => {
        describe('| method getCodeBuildByRegion', () => {
            beforeEach(() => {
                new ResourcesConfig(RESOURCS_CONFIG_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
                sinon.restore();
            });

            it('| return null when codeSrc does not exist', () => {
                ResourcesConfig.getInstance().setCodeSrcByRegion(TEST_PROFILE, 'default', undefined);
                expect(ResourcesConfig.getInstance().getCodeBuildByRegion(TEST_PROFILE, 'default')).equal(null);
            });

            it('| return correct result when codeSrc is a file', () => {
                // setup
                const TEST_SRC = 'folder1/folder2/codesrc.ext';
                ResourcesConfig.getInstance().setCodeSrcByRegion(TEST_PROFILE, 'default', TEST_SRC);
                sinon.stub(fs, 'statSync').withArgs(TEST_SRC).returns({
                    isDirectory: () => false
                });
                // call and verify
                const build = ResourcesConfig.getInstance().getCodeBuildByRegion(TEST_PROFILE, 'default');
                expect(build.folder.endsWith(`folder2${path.sep}build`)).equal(true);
                expect(build.file.endsWith(`folder2${path.sep}build${path.sep}upload.zip`)).equal(true);
            });

            it('| return correct result when codeSrc is a directory', () => {
                // setup
                const TEST_SRC = 'folder1/folder2/codesrc';
                ResourcesConfig.getInstance().setCodeSrcByRegion(TEST_PROFILE, 'default', TEST_SRC);
                sinon.stub(fs, 'statSync').withArgs(TEST_SRC).returns({
                    isDirectory: () => true
                });
                // call and verify
                const build = ResourcesConfig.getInstance().getCodeBuildByRegion(TEST_PROFILE, 'default');
                expect(build.folder.endsWith(`codesrc${path.sep}build`)).equal(true);
                expect(build.file.endsWith(`codesrc${path.sep}build${path.sep}upload.zip`)).equal(true);
            });
        });
    });

    describe('# inspect correctness for getter and setter for different fields', () => {
        const TEST_CONFIG = JSON.parse(fs.readFileSync(RESOURCS_CONFIG_PATH));

        describe('# inspect skillMetadata', () => {
            beforeEach(() => {
                new ResourcesConfig(RESOURCS_CONFIG_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
            });

            [{
                field: 'SkillId',
                params: [TEST_PROFILE],
                newValue: 'skillId new',
                oldValue: 'amzn1.ask.skill.5555555-4444-3333-2222-1111111111'
            },
            {
                field: 'SkillMetadata',
                params: [TEST_PROFILE],
                newValue: 'new skillMetaData',
                oldValue: {
                    src: './skillPackage',
                    lastDeployHash: ''
                }
            },
            {
                field: 'SkillMetaSrc',
                params: [TEST_PROFILE],
                newValue: 'new src',
                oldValue: './skillPackage'
            },
            {
                field: 'SkillMetaLastDeployHash',
                params: [TEST_PROFILE],
                newValue: 'hash',
                oldValue: ''
            }].forEach(({
                field,
                params,
                newValue,
                oldValue
            }) => {
                it(`| test get${field} function successfully`, () => {
                    expect(ResourcesConfig.getInstance()[`get${field}`](...params)).deep.equal(oldValue);
                });

                it(`| test set${field} function successfully`, () => {
                    const setParams = params;
                    setParams.push(newValue);
                    ResourcesConfig.getInstance()[`set${field}`](...setParams);
                    expect(ResourcesConfig.getInstance()[`get${field}`](...params)).equal(newValue);
                });
            });
        });

        describe('# inspect code', () => {
            beforeEach(() => {
                new ResourcesConfig(RESOURCS_CONFIG_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
            });

            [{
                field: 'Code',
                params: [TEST_PROFILE],
                newValue: 'code',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].code
            },
            {
                field: 'CodeByRegion',
                params: [TEST_PROFILE, 'default'],
                newValue: 'code by region',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].code.default
            },
            {
                field: 'CodeSrcByRegion',
                params: [TEST_PROFILE, 'NA'],
                newValue: 'new code src',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].code.NA.src
            },
            {
                field: 'CodeLastDeployHashByRegion',
                params: [TEST_PROFILE, 'EU'],
                newValue: 'new code hash',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].code.EU.lastDeployHash
            }].forEach(({
                field,
                params,
                newValue,
                oldValue
            }) => {
                it(`| test get${field} function successfully`, () => {
                    expect(ResourcesConfig.getInstance()[`get${field}`](...params)).deep.equal(oldValue);
                });

                it(`| test set${field} function successfully`, () => {
                    const setParams = params;
                    setParams.push(newValue);
                    ResourcesConfig.getInstance()[`set${field}`](...setParams);
                    expect(ResourcesConfig.getInstance()[`get${field}`](...params)).equal(newValue);
                });
            });
        });

        describe('# inspect skillInfrastructure', () => {
            beforeEach(() => {
                new ResourcesConfig(RESOURCS_CONFIG_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
            });

            [{
                field: 'SkillInfra',
                params: [TEST_PROFILE],
                newValue: 'new infra',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].skillInfrastructure
            },
            {
                field: 'SkillInfraType',
                params: [TEST_PROFILE],
                newValue: 'new type',
                oldValue: '@ask-cli/cfn-deployer'
            },
            {
                field: 'SkillInfraUserConfig',
                params: [TEST_PROFILE],
                newValue: 'new user config',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].skillInfrastructure.userConfig
            },
            {
                field: 'SkillInfraDeployState',
                params: [TEST_PROFILE],
                newValue: 'new deploy state',
                oldValue: TEST_CONFIG.profiles[TEST_PROFILE].skillInfrastructure.deployState
            }].forEach(({
                field,
                params,
                newValue,
                oldValue
            }) => {
                it(`| test get${field} function successfully`, () => {
                    expect(ResourcesConfig.getInstance()[`get${field}`](...params)).deep.equal(oldValue);
                });

                it(`| test set${field} function successfully`, () => {
                    const setParams = params;
                    setParams.push(newValue);
                    ResourcesConfig.getInstance()[`set${field}`](...setParams);
                    expect(ResourcesConfig.getInstance()[`get${field}`](...params)).equal(newValue);
                });
            });
        });
    });
});
