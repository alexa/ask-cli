
const { expect } = require('chai');
const helpers = require('@src/builtins/deploy-delegates/cfn-deployer/helper')

describe('Builtins test - cfn-deployer helper.js test', () => {
    describe('# test class method: getAwsInformation', () => {
        it('| return basic aws resource informations', () => {
            const result = helpers.getAwsInformation("default", "default", {
                runtime: "nodejs10.x",
                handler: "index.handler",
                templatePath: "./infrastructure/cfn-deployer/skill-stack.yaml",
                awsRegion: "us-east-1",
            })
            expect(result.awsRegion).equal('us-east-1')
            expect(result.bucketObjectVersion).equal(undefined)              
            expect(result.templatePath).equal("./infrastructure/cfn-deployer/skill-stack.yaml")
            expect(result.bucketName).match(/^ask/)
            expect(result.bucketName).match(/default/)
        })
        it('| return custom S3 bucket name when given userconfig props', () => {
            const result = helpers.getAwsInformation("default", "default", {
                runtime: "nodejs10.x",
                handler: "index.handler",
                templatePath: "./infrastructure/cfn-deployer/skill-stack.yaml",
                awsRegion: "us-east-1",
                deploymentBucket: "example-bucket-name"
            })
            expect(result.awsRegion).equal('us-east-1')
            expect(result.bucketObjectVersion).equal(undefined)              
            expect(result.templatePath).equal("./infrastructure/cfn-deployer/skill-stack.yaml")
            expect(result.bucketName).equal("example-bucket-name")
        })
    })
})