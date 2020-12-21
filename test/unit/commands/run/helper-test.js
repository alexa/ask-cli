const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const helper = require('@src/commands/run/helper');
const CONSTANTS = require('@src/utils/constants');
const NodejsRunFlow = require('@src/commands/run/run-flow/nodejs-run');
const PythonRunFlow = require('@src/commands/run/run-flow/python-run');
const JavaRunFlow = require('@src/commands/run/run-flow/java-run');
const ResourcesConfig = require('@src/model/resources-config');

describe('Commands Run - helper test', () => {
    describe('getHostedSkillInvocationInfo test', () => {
        it('| validate Node hosted skill invocation info', () => {
            const hostedSkillInvocationInfo = helper.getHostedSkillInvocationInfo(CONSTANTS.RUNTIME.NODE);
            expect(hostedSkillInvocationInfo.skillCodeFolderName).eq('lambda');
            expect(hostedSkillInvocationInfo.handlerName).eq('handler');
            expect(hostedSkillInvocationInfo.skillFileName).eq('index');
        });

        it('| validate Python hosted skill invocation info', () => {
            const hostedSkillInvocationInfo = helper.getHostedSkillInvocationInfo(CONSTANTS.RUNTIME.PYTHON);
            expect(hostedSkillInvocationInfo.skillCodeFolderName).eq('lambda');
            expect(hostedSkillInvocationInfo.handlerName).eq('lambda_handler');
            expect(hostedSkillInvocationInfo.skillFileName).eq('lambda_function');
        });

        it('| Invalid hosted skill runtime info', () => {
            const hostedSkillInvocationInfo = helper.getHostedSkillInvocationInfo(CONSTANTS.RUNTIME.JAVA);
            expect(hostedSkillInvocationInfo).eq(undefined);
        });
    });

    describe('getNonHostedSkillInvocationInfo test', () => {
        it('| validate Node non hosted skill invocation info', () => {
            const nonHostedSkillInvocationInfo = helper
                .getNonHostedSkillInvocationInfo(CONSTANTS.RUNTIME.NODE, 'fooFileName.fooHandler', 'fooSkillCodeFolderName');
            expect(nonHostedSkillInvocationInfo.handlerName).eq('fooHandler');
            expect(nonHostedSkillInvocationInfo.skillFileName).eq('fooFileName');
            expect(nonHostedSkillInvocationInfo.skillCodeFolderName).eq('fooSkillCodeFolderName');
        });
        it('| validate Python non hosted skill invocation info', () => {
            const nonHostedSkillInvocationInfo = helper
                .getNonHostedSkillInvocationInfo(CONSTANTS.RUNTIME.PYTHON, 'fooFileName.fooHandler', 'fooSkillCodeFolderName');
            expect(nonHostedSkillInvocationInfo.handlerName).eq('fooHandler');
            expect(nonHostedSkillInvocationInfo.skillFileName).eq('fooFileName');
            expect(nonHostedSkillInvocationInfo.skillCodeFolderName).eq('fooSkillCodeFolderName');
        });
        it('| validate Java non hosted skill invocation info', () => {
            const nonHostedSkillInvocationInfo = helper
                .getNonHostedSkillInvocationInfo(CONSTANTS.RUNTIME.JAVA, 'fooHandler', 'fooSkillCodeFolderName');
            expect(nonHostedSkillInvocationInfo.handlerName).eq('fooHandler');
            expect(nonHostedSkillInvocationInfo.skillCodeFolderName).eq('fooSkillCodeFolderName');
        });
        it('| empty runtime', () => {
            expect(() => helper
                .getNonHostedSkillInvocationInfo('', '', '')).to.throw('Missing runtime info in '
                + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`);
        });
        it('| empty handler', () => {
            expect(() => helper
                .getNonHostedSkillInvocationInfo(CONSTANTS.RUNTIME.JAVA, '', '')).to.throw('Missing handler info in '
                + `resource file ${CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG}.`);
        });
    });

    describe('getNormalisedRuntime test', () => {
        it('| normalised runtime for nodejs', () => {
            expect(helper.getNormalisedRuntime('nodejs12.x')).eq(CONSTANTS.RUNTIME.NODE);
        });
        it('| normalised runtime for python', () => {
            expect(helper.getNormalisedRuntime('python3.8')).eq(CONSTANTS.RUNTIME.PYTHON);
        });
        it('| normalised runtime for java', () => {
            expect(helper.getNormalisedRuntime('java11')).eq(CONSTANTS.RUNTIME.JAVA);
        });
        it('| unsupported runtime', () => {
            expect(() => helper.getNormalisedRuntime('foo')).to.throw('Runtime - foo is not supported');
        });
    });

    describe('selectRunFlowClass test', () => {
        it('| java run flow test', () => {
            expect(helper.selectRunFlowClass(CONSTANTS.RUNTIME.JAVA)).eq(JavaRunFlow);
        });
        it('| python run flow test', () => {
            expect(helper.selectRunFlowClass(CONSTANTS.RUNTIME.PYTHON)).eq(PythonRunFlow);
        });
        it('| nodejs run flow test', () => {
            expect(helper.selectRunFlowClass(CONSTANTS.RUNTIME.NODE)).eq(NodejsRunFlow);
        });
        it('| unsupported run flow test', () => {
            expect(helper.selectRunFlowClass('foo')).eq(undefined);
        });
    });

    describe('getSkillCodeFolderName test', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| skill code folder value exists for user provided region in resources file', () => {
            sinon.stub(ResourcesConfig.prototype, 'getCodeSrcByRegion').returns('fooFolder');
            sinon.stub(fs, 'existsSync').returns(true);
            expect(helper.getSkillCodeFolderName('foo', CONSTANTS.ALEXA.REGION.NA)).eq('fooFolder');
        });

        it('| skill code folder value does not for user provided region, default exists in resources file', () => {
            sinon.stub(ResourcesConfig.prototype, 'getCodeSrcByRegion').withArgs('foo', CONSTANTS.ALEXA.REGION.NA).returns('')
                .withArgs('foo', CONSTANTS.ALEXA.REGION.DEFAULT)
                .returns('fooFolder');
            sinon.stub(fs, 'existsSync').returns(true);
            expect(helper.getSkillCodeFolderName('foo', CONSTANTS.ALEXA.REGION.NA)).eq('fooFolder');
        });

        it('| skill code folder value does not exist for user provided region or default in resources file', () => {
            sinon.stub(ResourcesConfig.prototype, 'getCodeSrcByRegion').returns('');
            sinon.stub(fs, 'existsSync').returns(true);
            expect(() => helper.getSkillCodeFolderName('foo', CONSTANTS.ALEXA.REGION.NA))
                .to.throw('Invalid code setting in region NA. "src" must be set if you want to run the skill code with skill package.');
        });

        it('| skill code folder does not exist', () => {
            sinon.stub(ResourcesConfig.prototype, 'getCodeSrcByRegion').returns('fooFolder');
            sinon.stub(fs, 'existsSync').returns(false);
            expect(() => helper.getSkillCodeFolderName('foo', CONSTANTS.ALEXA.REGION.NA))
                .to.throw('Invalid code setting in region NA. File doesn\'t exist for code src: fooFolder.');
        });
    });

    describe('getSkillFlowInstance test', () => {
        it('| create skill flow instance test, error case', () => {
            expect(() => helper.getSkillFlowInstance(CONSTANTS.RUNTIME.NODE, { skillCodeFolderName: 'fooSkillCodeFolderName' },
                true, CONSTANTS.RUN.DEFAULT_DEBUG_PORT, 'fooToken',
                'fooSkillId', CONSTANTS.ALEXA.REGION.NA, false).to.throw('ask-sdk-local-debug cannot be found. Please install '
                + 'ask-sdk-local-debug to your skill code project. Refer https://www.npmjs.com/package/ask-sdk-local-debug for more info'));
        });
    });
});
