const aws = require('aws-sdk');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const helper = require('@src/builtins/deploy-delegates/lambda-deployer/helper');
const IAMClient = require('@src/clients/aws-client/iam-client');
const LambdaClient = require('@src/clients/aws-client/lambda-client');
const Manifest = require('@src/model/manifest');

describe('Builtins test - lambda-deployer helper.js test', () => {
    const FIXTURE_MANIFEST_FILE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'manifest.json');
    const TEST_PROFILE = 'default'; // test file uses 'default' profile
    const TEST_IGNORE_HASH = false;
    const TEST_AWS_PROFILE = 'default';
    const TEST_AWS_REGION = 'us-east-1';
    const TEST_ALEXA_REGION = 'default';
    const TEST_ALEXA_REGION_NON_DEFAULT = 'EU';
    const TEST_SKILL_NAME = 'skill_name';
    const TEST_SKILL_ID = 'skill_id';
    const TEST_IAM_ROLE_ARN = 'iam_role_arn';
    const TEST_LAMBDA_ARN = 'iam_lambda_arn';
    const TEST_NO_SUCH_ENTITY_ERROR = {
        code: 'NoSuchEntity'
    };
    const REPORTER = {
        updateStatus: () => {}
    };
    const TEST_ROLE_DATA = {
        Role: {
            Arn: TEST_IAM_ROLE_ARN
        }
    };

    describe('# test class method: loadLambdaInformation', () => {
        const TEST_LOCAL_IAM_ROLE = 'local_iam_role';
        const TEST_LOCAL_REVISION_ID = 'local_revision_id';
        const TEST_LOCAL_DEPLOY_STATE = {
            iamRole: TEST_LOCAL_IAM_ROLE,
            lambda: {
                arn: TEST_LAMBDA_ARN,
                revisionId: TEST_LOCAL_REVISION_ID
            }
        };
        const TEST_USER_CONFIG_WITH_SOURCELAMBDA = {
            regionalOverrides: {
                [TEST_ALEXA_REGION_NON_DEFAULT]: {
                    sourceLambda: {
                        arn: TEST_LAMBDA_ARN
                    }
                }
            }
        };
        const TEST_REMOTE_IAM_ROLE = 'remote_iam_role';
        const TEST_REMOTE_REVISION_ID = 'remote_revision_id';
        const TEST_LOAD_LAMBDA_OPTION_NO_LAMBDA_STATE = {
            awsProfile: TEST_AWS_PROFILE,
            awsRegion: TEST_AWS_REGION,
            alexaRegion: TEST_ALEXA_REGION,
            ignoreHash: TEST_IGNORE_HASH,
            deployState: {},
            userConfig: {}
        };

        const TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE = {
            awsProfile: TEST_AWS_PROFILE,
            awsRegion: TEST_AWS_REGION,
            alexaRegion: TEST_ALEXA_REGION,
            ignoreHash: TEST_IGNORE_HASH,
            deployState: TEST_LOCAL_DEPLOY_STATE,
            userConfig: {}
        };

        const TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE_IGNORE_HASH = {
            awsProfile: TEST_AWS_PROFILE,
            awsRegion: TEST_AWS_REGION,
            alexaRegion: TEST_ALEXA_REGION,
            ignoreHash: true,
            deployState: TEST_LOCAL_DEPLOY_STATE,
            userConfig: {}
        };

        const TEST_LOAD_LAMBDA_OPTION_WITH_SOURCELAMBDA = {
            awsProfile: TEST_AWS_PROFILE,
            awsRegion: TEST_AWS_REGION,
            alexaRegion: TEST_ALEXA_REGION_NON_DEFAULT,
            ignoreHash: true,
            deployState: TEST_LOCAL_DEPLOY_STATE,
            userConfig: TEST_USER_CONFIG_WITH_SOURCELAMBDA
        };

        afterEach(() => {
            sinon.restore();
        });

        it('| no lambda arn found, expect original deploystate return', (done) => {
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_NO_LAMBDA_STATE, (err, data) => {
                // verify
                expect(data).deep.equal({});
                done();
            });
        });

        it('| an existing lambda arn found in deployState, getFunction request fails, expect an error return', (done) => {
            // setup
            const TEST_GET_FUNCTION_ERROR = 'get_function_error';
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, TEST_GET_FUNCTION_ERROR);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE, (err) => {
                // verify
                expect(err).equal(TEST_GET_FUNCTION_ERROR);
                done();
            });
        });

        it('| an existing lambda arn found in deployState, getFunction request passes, the local iam role does not equal with the remote iam role, '
        + 'expect an error return', (done) => {
            // setup
            const TEST_REMOTE_DEPLOY_STATE = {
                Configuration: {
                    Role: TEST_REMOTE_IAM_ROLE,
                    RevisionId: TEST_REMOTE_REVISION_ID
                }
            };
            const TEST_IAM_ROLE_ERROR = `The IAM role for Lambda ARN (${TEST_LAMBDA_ARN}) should be "${TEST_REMOTE_IAM_ROLE}", \
but found "${TEST_LOCAL_IAM_ROLE}". Please solve this IAM role mismatch and re-deploy again. To ignore this error run "ask deploy --ignore-hash".`;
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, null, TEST_REMOTE_DEPLOY_STATE);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE, (err) => {
                // verify
                expect(err).equal(TEST_IAM_ROLE_ERROR);
                done();
            });
        });

        it('| an existing lambda arn found in deployState, getFunction request passes, the local revisionId does not equal with the remote revisionId,'
        + 'expect an error return', (done) => {
            // setup
            const TEST_REMOTE_DEPLOY_STATE = {
                Configuration: {
                    Role: TEST_LOCAL_IAM_ROLE,
                    RevisionId: TEST_REMOTE_REVISION_ID
                }
            };
            const TEST_REVISION_ID_ERROR = `The current revisionId (The revision ID for Lambda ARN (${TEST_LAMBDA_ARN}) should be \
${TEST_REMOTE_REVISION_ID}, but found ${TEST_LOCAL_REVISION_ID}. \
Please solve this revision mismatch and re-deploy again. To ignore this error run "ask deploy --ignore-hash".`;
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, null, TEST_REMOTE_DEPLOY_STATE);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE, (err) => {
                // verify
                expect(err).equal(TEST_REVISION_ID_ERROR);
                done();
            });
        });

        it('| an existing lambda arn found in deployState, getFunction request passes, the local revisionId and remote revisionId compare is ignored'
        + 'expect lambda data returned', (done) => {
            // setup
            const TEST_REMOTE_DEPLOY_STATE = {
                Configuration: {
                    Role: TEST_LOCAL_IAM_ROLE,
                    RevisionId: TEST_REMOTE_REVISION_ID
                }
            };
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, null, TEST_REMOTE_DEPLOY_STATE);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE_IGNORE_HASH, (err, data) => {
                // verify
                expect(data.iamRole).equal(TEST_LOCAL_IAM_ROLE);
                done();
            });
        });

        it('| an existing lambda arn found in deployState, getFunction request passes, expect lambda data returned', (done) => {
            // setup
            const TEST_REMOTE_DEPLOY_STATE = {
                Configuration: {
                    Role: TEST_LOCAL_IAM_ROLE,
                    RevisionId: TEST_LOCAL_REVISION_ID
                }
            };
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, null, TEST_REMOTE_DEPLOY_STATE);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_LAMBDA_STATE, (err, data) => {
                // verify
                expect(data.iamRole).equal(TEST_LOCAL_IAM_ROLE);
                expect(data.lambda.revisionId).equal(TEST_LOCAL_REVISION_ID);
                done();
            });
        });

        it('| using Lambda arn from sourceLambda, getFunction return error, expect error called back', (done) => {
            // setup
            const GET_FUNC_ERR = 'get func err';
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, GET_FUNC_ERR);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_SOURCELAMBDA, (err, data) => {
                // verify
                expect(err).equal(`Failed to load the Lambda (${TEST_LAMBDA_ARN}) specified in "sourceLambda". ${GET_FUNC_ERR}`);
                expect(data).equal(undefined);
                done();
            });
        });

        it('| using Lambda arn from sourceLambda, getFunction request passes, expect lambda data returned', (done) => {
            // setup
            const TEST_REMOTE_DEPLOY_STATE = {
                Configuration: {
                    Role: TEST_REMOTE_IAM_ROLE,
                    RevisionId: TEST_REMOTE_REVISION_ID
                }
            };
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, null, TEST_REMOTE_DEPLOY_STATE);
            // call
            helper.loadLambdaInformation(REPORTER, TEST_LOAD_LAMBDA_OPTION_WITH_SOURCELAMBDA, (err, data) => {
                // verify
                expect(data.iamRole).equal(TEST_REMOTE_IAM_ROLE);
                expect(data.lambda.revisionId).equal(TEST_REMOTE_REVISION_ID);
                expect(data.lambda.arn).equal(TEST_LAMBDA_ARN);
                done();
            });
        });
    });

    describe('# test class method: deployIAMRole', () => {
        const TEST_DEPLOYSTATE_NO_ROLE = {};
        const TEST_DEPLOYSTATE = {
            iamRole: TEST_IAM_ROLE_ARN
        };
        const TEST_IAM_CONFIG_NO_ROLE = {
            awsProfile: TEST_AWS_PROFILE,
            alexaRegion: TEST_ALEXA_REGION,
            skillName: TEST_SKILL_NAME,
            awsRegion: TEST_AWS_REGION,
            deployState: {}
        };
        const TEST_IAM_CONFIG = {
            awsProfile: TEST_AWS_PROFILE,
            alexaRegion: TEST_ALEXA_REGION,
            skillName: TEST_SKILL_NAME,
            awsRegion: TEST_AWS_REGION,
            deployState: TEST_DEPLOYSTATE
        };

        afterEach(() => {
            sinon.restore();
        });

        it('| an existing IAM role found, get IAM Role fails, expect an error return', (done) => {
            // setup
            const TEST_ERROR = 'getRole error message';
            sinon.stub(IAMClient.prototype, 'getIAMRole').callsArgWith(1, TEST_ERROR);
            // call
            helper.deployIAMRole(REPORTER, TEST_IAM_CONFIG, (err) => {
                // verify
                expect(err).equal(`Failed to retrieve IAM role (${TEST_IAM_ROLE_ARN}) for Lambda. ${TEST_ERROR}`);
                done();
            });
        });

        it('| an existing IAM role found, get IAM Role throw "NoSuchEntity" error, expect an error return', (done) => {
            // setup
            const TEST_GET_ROLE_ERROR = `The IAM role is not found. Please check if your IAM role from region ${TEST_ALEXA_REGION} is valid.`;
            sinon.stub(IAMClient.prototype, 'getIAMRole').callsArgWith(1, TEST_NO_SUCH_ENTITY_ERROR);
            // call
            helper.deployIAMRole(REPORTER, TEST_IAM_CONFIG, (err) => {
                // verify
                expect(err).equal(TEST_GET_ROLE_ERROR);
                done();
            });
        });

        it('| an existing IAM role found, get IAM Role passes, expect correct data return', (done) => {
            // setup
            sinon.stub(IAMClient.prototype, 'getIAMRole').callsArgWith(1, null, TEST_ROLE_DATA);
            // call
            helper.deployIAMRole(REPORTER, TEST_IAM_CONFIG, (err, res) => {
                // verify
                expect(res).equal(TEST_IAM_ROLE_ARN);
                done();
            });
        });

        it('| no IAM role found, create IAM role fails, expect an error return', (done) => {
            // setup
            const TEST_CREATE_ROLE_ERROR = 'createIAMRole error message';
            sinon.stub(IAMClient.prototype, 'createBasicLambdaRole').callsArgWith(1, TEST_CREATE_ROLE_ERROR);
            // call
            helper.deployIAMRole(REPORTER, TEST_IAM_CONFIG_NO_ROLE, (err) => {
                // verify
                expect(err).equal(`Failed to create IAM role before deploying Lambda. ${TEST_CREATE_ROLE_ERROR}`);
                done();
            });
        });

        it('| no IAM role found, create IAM role passes, attach role policy fails, expect an error return', (done) => {
            // setup
            const TEST_POLICY_ERROR = 'attachRolePolicy error message';
            sinon.stub(IAMClient.prototype, 'createBasicLambdaRole').callsArgWith(1, null, TEST_ROLE_DATA);
            sinon.stub(IAMClient.prototype, 'attachBasicLambdaRolePolicy').callsArgWith(1, TEST_POLICY_ERROR);
            // call
            helper.deployIAMRole(REPORTER, TEST_IAM_CONFIG_NO_ROLE, (err) => {
                // verify
                expect(err).equal(`Failed to create IAM role before deploying Lambda. ${TEST_POLICY_ERROR}`);
                done();
            });
        });

        it('| no IAM role found, create IAM role and attach role policy passes, expect a IAM role arn return.', (done) => {
            // setup
            sinon.stub(IAMClient.prototype, 'createBasicLambdaRole').callsArgWith(1, null, TEST_ROLE_DATA);
            sinon.stub(IAMClient.prototype, 'attachBasicLambdaRolePolicy').callsArgWith(1, null, TEST_IAM_ROLE_ARN);
            // call
            helper.deployIAMRole(REPORTER, TEST_IAM_CONFIG_NO_ROLE, (err, res) => {
                // verify
                expect(res).equal(TEST_IAM_ROLE_ARN);
                done();
            });
        });
    });

    describe('# test class method: deployLambdaFunction', () => {
        const TEST_ZIP_FILE_PATH = 'zip_file_path';
        const TEST_ZIP_FILE = 'zip_file';
        const TEST_CODE_BUILD = 'code_build_path';
        const TEST_LAST_MODIFIED = 'last_modified_time';
        const TEST_REVISION_ID = 'revision_id';
        const TEST_UPDATED_REVISION_ID = 'revision id';
        const TEST_FUNCTION_ARN = 'lambda function arn';
        const TEST_RUNTIME = 'runtime';
        const TEST_HANDLER = 'handler';
        const TEST_CREATE_OPTIONS = {
            profile: TEST_PROFILE,
            awsProfile: TEST_AWS_REGION,
            alexaRegion: TEST_ALEXA_REGION,
            awsRegion: TEST_AWS_REGION,
            skillId: TEST_SKILL_ID,
            skillName: TEST_SKILL_NAME,
            code: { codeBuild: TEST_CODE_BUILD },
            iamRoleArn: TEST_IAM_ROLE_ARN,
            zipFilePath: TEST_ZIP_FILE_PATH,
            userConfig: { awsRegion: TEST_AWS_REGION },
            deployState: {}
        };
        const TEST_UPDATE_OPTIONS = {
            profile: TEST_PROFILE,
            awsProfile: TEST_PROFILE,
            alexaRegion: TEST_ALEXA_REGION,
            awsRegion: TEST_AWS_REGION,
            skillId: TEST_SKILL_ID,
            skillName: TEST_SKILL_NAME,
            code: { codeBuild: TEST_CODE_BUILD },
            iamRoleArn: TEST_IAM_ROLE_ARN,
            zipFilePath: TEST_ZIP_FILE_PATH,
            userConfig: { awsRegion: TEST_AWS_REGION, runtime: TEST_RUNTIME, handler: TEST_HANDLER },
            deployState: { lambda: {
                arn: TEST_LAMBDA_ARN,
                lastModified: TEST_LAST_MODIFIED,
                revisionId: TEST_REVISION_ID
            } }
        };

        beforeEach(() => {
            new Manifest(FIXTURE_MANIFEST_FILE_PATH);
        });

        afterEach(() => {
            Manifest.dispose();
            sinon.restore();
        });

        it('| no Lambda found, create Lambda function fails, expect an error return.', (done) => {
            // setup
            const TEST_CREATE_FUNCTION_ERROR = 'createLambdaFunction error';
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'createLambdaFunction').callsArgWith(7, TEST_CREATE_FUNCTION_ERROR);
            // call
            helper.deployLambdaFunction(REPORTER, TEST_CREATE_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_CREATE_FUNCTION_ERROR);
                done();
            });
        });

        it('| no Lambda found, create Lambda function fails and get retry message, retry passes after one retry,'
        + ' add Alexa Permission fails, expect an error return.', (done) => {
            // setup
            const RETRY_MESSAGE = 'The role defined for the function cannot be assumed by Lambda.';
            const TEST_CREATE_FUNCTION_ERROR = {
                message: RETRY_MESSAGE
            };
            const TEST_LAMBDA_DATA = {
                FunctionArn: TEST_FUNCTION_ARN
            };
            const TEST_ADD_PERMISSION_ERROR = 'addAlexaPermissionByDomain error';
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            const stubTestFunc = sinon.stub(LambdaClient.prototype, 'createLambdaFunction');
            stubTestFunc.onCall(0).callsArgWith(7, TEST_CREATE_FUNCTION_ERROR);
            stubTestFunc.onCall(1).callsArgWith(7, null, TEST_LAMBDA_DATA);
            sinon.stub(LambdaClient.prototype, 'addAlexaPermissionByDomain').callsArgWith(3, TEST_ADD_PERMISSION_ERROR);
            // call
            helper.deployLambdaFunction(REPORTER, TEST_CREATE_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ADD_PERMISSION_ERROR);
                done();
            });
        }).timeout(10000);

        it('| no Lambda found, create Lambda function passes, add Alexa Permission fails, expect an error return.', (done) => {
            // setup
            const TEST_LAMBDA_DATA = {
                FunctionArn: TEST_FUNCTION_ARN
            };
            const TEST_ADD_PERMISSION_ERROR = 'addAlexaPermissionByDomain error';
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'createLambdaFunction').callsArgWith(7, null, TEST_LAMBDA_DATA);
            sinon.stub(LambdaClient.prototype, 'addAlexaPermissionByDomain').callsArgWith(3, TEST_ADD_PERMISSION_ERROR);
            // call
            helper.deployLambdaFunction(REPORTER, TEST_CREATE_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_ADD_PERMISSION_ERROR);
                done();
            });
        });

        it('| no Lambda found, create Lambda function and add Alexa Permission pass, get Function revisionId fails,'
        + ' expect an error return.', (done) => {
            // setup
            const TEST_LAMBDA_DATA = {
                FunctionArn: TEST_FUNCTION_ARN
            };
            const TEST_REVISION_ID_ERROR = 'getFunctionRevisionId error';
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'createLambdaFunction').callsArgWith(7, null, TEST_LAMBDA_DATA);
            sinon.stub(LambdaClient.prototype, 'addAlexaPermissionByDomain').callsArgWith(3, null);
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, TEST_REVISION_ID_ERROR);

            // call
            helper.deployLambdaFunction(REPORTER, TEST_CREATE_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_REVISION_ID_ERROR);
                done();
            });
        });

        it('| no Lambda found, create Lambda function, add Alexa Permission and get Function revisionId pass, expect Lambda data return.', (done) => {
            // setup
            const TEST_LAMBDA_DATA = {
                FunctionArn: TEST_FUNCTION_ARN,
                LastModified: TEST_LAST_MODIFIED
            };
            const TEST_GET_FUNCTION_RESPONSE = {
                Configuration: {
                    RevisionId: TEST_UPDATED_REVISION_ID,
                }
            };
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'createLambdaFunction').callsArgWith(7, null, TEST_LAMBDA_DATA);
            sinon.stub(LambdaClient.prototype, 'addAlexaPermissionByDomain').callsArgWith(3, null);
            sinon.stub(LambdaClient.prototype, 'getFunction').callsArgWith(1, null, TEST_GET_FUNCTION_RESPONSE);

            // call
            helper.deployLambdaFunction(REPORTER, TEST_CREATE_OPTIONS, (err, res) => {
                // verify
                expect(res).deep.equal({
                    isAllStepSuccess: true,
                    isCodeDeployed: true,
                    lambdaResponse: {
                        arn: TEST_FUNCTION_ARN,
                        lastModified: TEST_LAST_MODIFIED,
                        revisionId: TEST_UPDATED_REVISION_ID
                    }
                });
                done();
            });
        });

        it('| an existing Lambda found, update function code fails, expect an error return.', (done) => {
            // setup
            const TEST_UPDATE_CODE_ERROR = 'updateFunctionCode error';
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'updateFunctionCode').callsArgWith(3, TEST_UPDATE_CODE_ERROR);
            // call
            helper.deployLambdaFunction(REPORTER, TEST_UPDATE_OPTIONS, (err) => {
                // verify
                expect(err).equal(TEST_UPDATE_CODE_ERROR);
                done();
            });
        });

        it('| an existing Lambda found, update function code passes, update function configuration fails, expect an error return.', (done) => {
            // setup
            const TEST_UPDATE_CONGIF_ERROR = 'updateFunctionConfiguration error';
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'updateFunctionCode').callsArgWith(3, null, { RevisionId: TEST_REVISION_ID });
            sinon.stub(LambdaClient.prototype, 'updateFunctionConfiguration').callsArgWith(4, TEST_UPDATE_CONGIF_ERROR);
            // call
            helper.deployLambdaFunction(REPORTER, TEST_UPDATE_OPTIONS, (err, res) => {
                // verify
                expect(err).equal(null);
                expect(res).deep.equal({
                    isAllStepSuccess: false,
                    isCodeDeployed: true,
                    lambdaResponse: {
                        arn: undefined,
                        lastModified: undefined,
                        revisionId: TEST_REVISION_ID
                    },
                    resultMessage: TEST_UPDATE_CONGIF_ERROR
                });
                done();
            });
        });

        it('| an existing Lambda found, update function code and update function configuration pass, expect updated lambda data return.', (done) => {
            // setup
            const TEST_UPDATE_CONFIG_DATA = {
                FunctionArn: TEST_LAMBDA_ARN,
                LastModified: TEST_LAST_MODIFIED,
                RevisionId: TEST_REVISION_ID
            };
            sinon.stub(fs, 'readFileSync').withArgs(TEST_ZIP_FILE_PATH).returns(TEST_ZIP_FILE);
            sinon.stub(aws, 'Lambda');
            sinon.stub(LambdaClient.prototype, 'updateFunctionCode').callsArgWith(3, null, { RevisionId: TEST_REVISION_ID });
            sinon.stub(LambdaClient.prototype, 'updateFunctionConfiguration').callsArgWith(4, null, TEST_UPDATE_CONFIG_DATA);
            // call
            helper.deployLambdaFunction(REPORTER, TEST_UPDATE_OPTIONS, (err, data) => {
                // verify
                expect(data).deep.equal({
                    isAllStepSuccess: true,
                    isCodeDeployed: true,
                    lambdaResponse: {
                        arn: TEST_LAMBDA_ARN,
                        lastModified: TEST_LAST_MODIFIED,
                        revisionId: TEST_REVISION_ID
                    }
                });
                done();
            });
        });
    });
});
