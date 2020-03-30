const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs-extra');

const ResourcesConfig = require('@src/model/resources-config');
const AskStates = require('@src/model/resources-config/ask-states');

describe('Model test - resources config test', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const FIXTURE_RESOURCES_CONFIG_FILE_PATH = path.join(FIXTURE_PATH, 'regular-proj', 'ask-resources.json');
    const FIXTURE_STATES_FILE_PATH = path.join(FIXTURE_PATH, 'regular-proj', '.ask', 'ask-states.json');
    const NOT_EXISTING_PROJECT_CONFIG_PATH = 'out-of-no-where.json';
    const TEST_PROFILE = 'default';

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        it('| initiate as a ResourcesConfig class', () => {
            const projConfig = new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            expect(projConfig).to.be.instanceof(ResourcesConfig);
        });

        it('| make sure ResourcesConfig class is singleton', () => {
            const config1 = new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            const config2 = new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            expect(config1 === config2).equal(true);
        });

        it('| get instance function return the instance constructed before', () => {
            const projConfig = new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            expect(ResourcesConfig.getInstance() === projConfig).equal(true);
        });

        it('| dispose the instance correctly', () => {
            new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            ResourcesConfig.dispose();
            expect(ResourcesConfig.getInstance()).equal(null);
        });

        it('| init with a file path not existing, expect correct error message thrown', () => {
            try {
                new ResourcesConfig(NOT_EXISTING_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `File ${NOT_EXISTING_PROJECT_CONFIG_PATH} not exists.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        it('| .ask/ask-states.json file does not exist, expect withContent called', () => {
            // setup
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs(FIXTURE_STATES_FILE_PATH).returns(false);
            fs.existsSync.callThrough();
            sinon.stub(AskStates, 'withContent');
            // call
            try {
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            } catch (err) {
                expect(err).equal(undefined);
            }
            // expect
            expect(AskStates.withContent.args[0][0]).equal(FIXTURE_STATES_FILE_PATH);
        });

        afterEach(() => {
            ResourcesConfig.dispose();
        });
    });

    describe('# inspect special methods in resources config model', () => {
        describe('| getCodeRegions', () => {
            beforeEach(() => {
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
                sinon.restore();
            });

            it('| return code regions correctly based on the fixture data', () => {
                expect(ResourcesConfig.getInstance().getCodeRegions(TEST_PROFILE)).deep.equal(['default', 'NA', 'EU']);
            });
        });

        describe('| method getCodeBuildByRegion', () => {
            beforeEach(() => {
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
                sinon.restore();
            });

            it('| return null when codeSrc does not exist', () => {
                // setup
                sinon.stub(ResourcesConfig.prototype, 'getCodeSrcByRegion').returns(null);
                expect(ResourcesConfig.getInstance().getCodeBuildByRegion(TEST_PROFILE, 'default')).equal(null);
            });

            it('| return correct result when codeSrc is a file', () => {
                // setup
                const TEST_SRC = path.join(FIXTURE_PATH, 'regular-proj', 'folder1', 'file1.json');
                ResourcesConfig.getInstance().setCodeSrcByRegion(TEST_PROFILE, 'default', TEST_SRC);
                sinon.stub(fs, 'statSync').withArgs(TEST_SRC).returns({
                    isDirectory: () => false
                });
                // call
                const build = ResourcesConfig.getInstance().getCodeBuildByRegion(TEST_PROFILE, 'default');
                // verify
                expect(build.folder.endsWith(`.ask${path.sep}folder1`)).equal(true);
                expect(build.file.endsWith(`.ask${path.sep}folder1${path.sep}build.zip`)).equal(true);
            });

            it('| return correct result when codeSrc is a directory', () => {
                // setup
                const TEST_SRC = path.join(FIXTURE_PATH, 'regular-proj', 'folder1', 'folder2');
                ResourcesConfig.getInstance().setCodeSrcByRegion(TEST_PROFILE, 'default', TEST_SRC);
                sinon.stub(fs, 'statSync').withArgs(TEST_SRC).returns({
                    isDirectory: () => true
                });
                // call
                const build = ResourcesConfig.getInstance().getCodeBuildByRegion(TEST_PROFILE, 'default');
                // verify
                expect(build.folder.endsWith(`.ask${path.sep}folder1${path.sep}folder2`)).equal(true);
                expect(build.file.endsWith(`.ask${path.sep}folder1${path.sep}folder2${path.sep}build.zip`)).equal(true);
            });
        });
    });

    describe('# inspect correctness for getter and setter for different fields', () => {
        const TEST_ASK_RESOURCES = fs.readJSONSync(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
        const TEST_ASK_STATES = fs.readJSONSync(FIXTURE_STATES_FILE_PATH);

        describe('# inspect skillMetadata', () => {
            beforeEach(() => {
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
            });

            [{
                field: 'SkillId',
                params: [TEST_PROFILE],
                newValue: 'skillId new',
                oldValue: TEST_ASK_STATES.profiles[TEST_PROFILE].skillId
            },
            {
                field: 'SkillMetaSrc',
                params: [TEST_PROFILE],
                newValue: 'new skillMetadata src',
                oldValue: TEST_ASK_RESOURCES.profiles[TEST_PROFILE].skillMetadata.src
            },
            {
                field: 'SkillMetaLastDeployHash',
                params: [TEST_PROFILE],
                newValue: '==hash',
                oldValue: TEST_ASK_STATES.profiles[TEST_PROFILE].skillMetadata.lastDeployHash
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
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
            });

            [{
                field: 'CodeSrcByRegion',
                params: [TEST_PROFILE, 'NA'],
                newValue: 'new code src',
                oldValue: TEST_ASK_RESOURCES.profiles[TEST_PROFILE].code.NA.src
            },
            {
                field: 'CodeLastDeployHashByRegion',
                params: [TEST_PROFILE, 'FE'],
                newValue: 'new code hash',
                oldValue: TEST_ASK_STATES.profiles[TEST_PROFILE].code.FE.lastDeployHash
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
                new ResourcesConfig(FIXTURE_RESOURCES_CONFIG_FILE_PATH);
            });

            afterEach(() => {
                ResourcesConfig.dispose();
            });

            [{
                field: 'SkillInfraType',
                params: [TEST_PROFILE],
                newValue: 'new type',
                oldValue: TEST_ASK_RESOURCES.profiles[TEST_PROFILE].skillInfrastructure.type
            },
            {
                field: 'SkillInfraUserConfig',
                params: [TEST_PROFILE],
                newValue: 'new user config',
                oldValue: TEST_ASK_RESOURCES.profiles[TEST_PROFILE].skillInfrastructure.userConfig
            },
            {
                field: 'SkillInfraDeployState',
                params: [TEST_PROFILE],
                newValue: 'new deploy state',
                oldValue: TEST_ASK_STATES.profiles[TEST_PROFILE].skillInfrastructure['@ask-cli/cfn-deployer'].deployState
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
