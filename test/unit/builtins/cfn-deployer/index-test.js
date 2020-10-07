const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');

const awsUtil = require('@src/clients/aws-client/aws-util');
const CliCFNDeployerError = require('@src/exceptions/cli-cfn-deployer-error');
const Helper = require('@src/builtins/deploy-delegates/cfn-deployer/helper');
const Deployer = require('@src/builtins/deploy-delegates/cfn-deployer/index');

describe('Builtins test - cfn-deployer index test', () => {
    const templatePath = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'yaml-config.yml');
    const s3VersionId = 'some version';
    const profile = 'default';
    const alexaRegion = 'default';
    const awsRegion = 'us-east-1';
    const runtime = 'nodejs10.x';
    const handler = 'index.handler';
    const stackId = 'some stack id';
    const bucketName = 'someName';
    const bucketKey = 'someKey.zip';
    const endpointUri = 'some endpoint uri';
    const userDefinedParamKey = 'someKey';
    const userDefinedParamValue = 'someValue';
    let waitForStackDeployStub;
    let getAWSProfileStub;
    let deployStackStub;

    describe('bootstrap', () => {
        const bootstrapOptions = {
            profile,
            userConfig: { runtime, handler },
            workspacePath: 'some-path'
        };

        beforeEach(() => {
            sinon.stub(fs, 'readFileSync');
            sinon.stub(fs, 'writeFileSync');
            getAWSProfileStub = sinon.stub(awsUtil, 'getAWSProfile');
            sinon.stub(awsUtil, 'getCLICompatibleDefaultRegion').returns(awsRegion);
        });
        it('should bootstrap deployer', (done) => {
            Deployer.bootstrap(bootstrapOptions, (err, result) => {
                const expected = { userConfig:
                    { runtime,
                        handler,
                        templatePath: `./infrastructure/${bootstrapOptions.workspacePath}/skill-stack.yaml`,
                        awsRegion } };
                expect(err).eql(null);
                expect(result).eql(expected);
                done();
            });
        });

        it('should catch bootstrap error', (done) => {
            const errorMessage = 'some error';
            getAWSProfileStub.throws(new Error(errorMessage));

            Deployer.bootstrap(bootstrapOptions, (err, result) => {
                expect(err).eql(errorMessage);
                expect(result).eql(undefined);
                done();
            });
        });
    });

    describe('deploy', () => {
        let deployOptions;
        let expectedOutput;
        let expectedErrorOutput;

        beforeEach(() => {
            expectedOutput = {
                isAllStepSuccess: true,
                isCodeDeployed: true,
                deployState:
                    { stackId,
                        outputs: [],
                        s3: { bucket: bucketName,
                            key: bucketKey } },
                endpoint: { uri: endpointUri },
                resultMessage: `The CloudFormation deploy succeeded for Alexa region "${alexaRegion}" with output Lambda ARN: ${endpointUri}.`
            };
            expectedErrorOutput = {
                isAllStepSuccess: false,
                isCodeDeployed: false,
                deployState:
                    { stackId,
                        s3: { bucket: bucketName,
                            key: bucketKey } },
                resultMessage: 'Some error'
            };
            deployOptions = {
                profile,
                alexaRegion,
                skillId: 'some skill id',
                skillName: 'cf-skill',
                code: {
                    codeBuild: '/some-path/.ask/lambda/build.zip',
                    isCodeModified: true
                },
                userConfig: {
                    runtime,
                    handler,
                    templatePath,
                    awsRegion: 'us-east-1',
                    artifactsS3: {
                        bucketName,
                        bucketKey
                    },
                    cfn: {
                        parameters: {
                            [userDefinedParamKey]: userDefinedParamValue
                        },
                        capabilities: [
                            'CAPABILITY_IAM'
                        ]
                    }
                },
                deployState: {
                    default: {
                        stackId,
                        s3: {
                            bucket: 'someName',
                            key: 'someKey.zip'
                        }
                    }
                }
            };
            getAWSProfileStub = sinon.stub(awsUtil, 'getAWSProfile').returns('some profile');
            sinon.stub(Helper.prototype, 'createS3BucketIfNotExists').resolves();
            sinon.stub(Helper.prototype, 'enableS3BucketVersioningIfNotEnabled').resolves();
            sinon.stub(Helper.prototype, 'uploadToS3').resolves({ VersionId: s3VersionId });
            deployStackStub = sinon.stub(Helper.prototype, 'deployStack').resolves({ StackId: stackId });
            waitForStackDeployStub = sinon.stub(Helper.prototype, 'waitForStackDeploy');
        });
        it('should deploy', (done) => {
            waitForStackDeployStub.resolves({ endpointUri, stackInfo: { Outputs: [] } });

            Deployer.invoke({}, deployOptions, (err, result) => {
                expect(err).eql(null);
                expect(result).eql(expectedOutput);
                done();
            });
        });

        it('should deploy without initial state', (done) => {
            waitForStackDeployStub.resolves({ endpointUri, stackInfo: { Outputs: [] } });
            deployOptions.deployState = undefined;

            Deployer.invoke({}, deployOptions, (err, result) => {
                expect(err).eql(null);
                expect(result).eql(expectedOutput);
                done();
            });
        });

        it('should always deploy with CAPABILITY_IAM capabilities', (done) => {
            waitForStackDeployStub.resolves({ endpointUri, stackInfo: { Outputs: [] } });
            deployOptions.userConfig.cfn.capabilities = undefined;

            Deployer.invoke({}, deployOptions, (err, result) => {
                expect(err).eql(null);
                expect(result).eql(expectedOutput);
                expect(deployStackStub.args[0][4]).includes('CAPABILITY_IAM');
                done();
            });
        });

        it('should deploy without user defined cf parameters', (done) => {
            waitForStackDeployStub.resolves({ endpointUri, stackInfo: { Outputs: [] } });
            delete deployOptions.userConfig.cfn.parameters;

            Deployer.invoke({}, deployOptions, (err, result) => {
                expect(err).eql(null);
                expect(result).eql(expectedOutput);
                expect(deployStackStub.args[0][3]).to.not.include({ ParameterKey: userDefinedParamKey, ParameterValue: userDefinedParamValue });
                done();
            });
        });

        it('should invoke deploy and catch deploy error', (done) => {
            const errorMessage = 'some error';
            waitForStackDeployStub.rejects(new CliCFNDeployerError(errorMessage));

            Deployer.invoke({}, deployOptions, (err, result) => {
                expectedErrorOutput.isCodeDeployed = true;
                expectedErrorOutput.resultMessage = `The CloudFormation deploy failed for Alexa region "${alexaRegion}": ${errorMessage}`;
                expect(err).eql(null);
                expect(result).eql(expectedErrorOutput);
                done();
            });
        });

        it('should throw error when reserved parameter is used', (done) => {
            deployOptions.userConfig.cfn.parameters.SkillId = 'reserved parameter value';

            Deployer.invoke({}, deployOptions, (err, result) => {
                expectedErrorOutput.resultMessage = `The CloudFormation deploy failed for Alexa region "${alexaRegion}": `
                    + 'Cloud Formation parameter "SkillId" is reserved. Please use a different name.';
                expect(err).eql(null);
                expect(result).eql(expectedErrorOutput);
                done();
            });
        });

        it('should throw error when no template path is provided', (done) => {
            delete deployOptions.userConfig.templatePath;

            Deployer.invoke({}, deployOptions, (err, result) => {
                expectedErrorOutput.resultMessage = `The CloudFormation deploy failed for Alexa region "${alexaRegion}": `
                    + 'The template path in userConfig must be provided.';
                expect(err).eql(null);
                expect(result).eql(expectedErrorOutput);
                done();
            });
        });

        it('should generate s3 bucket name if not provided or not in state', (done) => {
            delete deployOptions.userConfig.artifactsS3;
            delete deployOptions.deployState.default.s3;

            Deployer.invoke({}, deployOptions, (err, result) => {
                expect(err).eql(null);
                expect(result.deployState.s3.bucket).contains('ask-');
                done();
            });
        });

        it('should throw error when aws profile is not linked to the ask cli', (done) => {
            getAWSProfileStub.returns(undefined);

            Deployer.invoke({}, deployOptions, (err, result) => {
                expectedErrorOutput.resultMessage = `The CloudFormation deploy failed for Alexa region "${alexaRegion}": `
                    + `Profile [${profile}] doesn't have AWS profile linked to it. Please run "ask configure" to re-configure your profile.`;
                expect(err).eql(null);
                expect(result).eql(expectedErrorOutput);
                done();
            });
        });

        it('should throw error when unsupported alexa region is used', (done) => {
            const unsupportedRegion = 'non existing region';
            deployOptions.alexaRegion = unsupportedRegion;

            Deployer.invoke({}, deployOptions, (err, result) => {
                expectedErrorOutput.deployState = {};
                expectedErrorOutput.resultMessage = `The CloudFormation deploy failed for Alexa region "${unsupportedRegion}": `
                    + `Unsupported Alexa region: ${unsupportedRegion}. Please check your region name or `
                    + 'use "regionalOverrides" to specify AWS region.';
                expect(err).eql(null);
                expect(result).eql(expectedErrorOutput);
                done();
            });
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
