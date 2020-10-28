# Using the CFN-Deployer to create dependent AWS resources

Note: See [Deploy-Command](./Deploy-Command.md) and [Alexa-Skill-Project-Definition](./Alexa-Skill-Project-Definition.md) for deployer mechanism overview and background.

In this example we are going to use the cfn-depoyer (and AWS CloudFormation) to build out an S3 bucket to hold our skill's assets and a DynamoDB table for session tracking. These example services will be built with simplified configurations so be sure to follow AWS security practices if you plan to do this in your production environment.

## Update ask-resources.json

In the ask-resources.json we define the paramaters we want to use in our CloudFormation template in the `skillInfrastructure.cfn.parameters` block.

Here we are defining `ProjectName`, `Environment`, `UserTableName`.

```json
{
  "askcliResourcesVersion": "2020-03-31",
  "profiles": {
    "default": {
      "skillMetadata": {
        "src": "skill-package"
      },
      "code": {
        "default": {
          "src": "./lambda"
        }
      },
      "skillInfrastructure": {
        "type": "@ask-cli/cfn-deployer",
        "userConfig": {
          "runtime": "nodejs10.x",
          "handler": "index.handler",
          "templatePath": "./infrastructure/cfn-deployer/skill-stack.yaml",
          "awsRegion": "us-west-2",
          "cfn": {
            "parameters": {
              "ProjectName": "test-skill",
              "Environment": "production",
              "UserTableName": "test-skill-table"
            }
          }
        }
      }
    }
  }
}
```

## Update skill-stack.yaml

In the `infrastructure/cfn-deployer/skill-stack.yaml` CloudFormation template file we need to:

1. Declare the parameters
2. Modify the template to use the parameters

Here you can see we are declaring `ProjectName`, `Environment`, `UserTableName` as string types.

In the CF template we:

- add configuration blocks for the S3 bucket (`S3AssetBucket`) and the DynamoDB table (`AlexaDynamoDbTable`)
  - You can use almost any of the [CloudFormation resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) configurations to build out needed skill AWS dependencies.
  - We are using `!Ref` to access the values of our parameters
  - We are using [CloudFormation's Intrinsic functions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html) like `!Join` to create dynamic values for some properties. You can use any of the functions in your skill-stack template but note for certain functions you will be required you pass specific `Capabilities` to CloudFormation (see [skill infrastructure's deployer](./Deploy-Command.md#Deployer)).
- modify the `AlexaSkillIAMRole` policy
  - allow `S3:GetObject` access to the S3AssetBucket
  - allow all table actions on the AlexaDynamoDbTable
- Add an `Environment` section to the `AlexaSkillFunction` block and pass important information to the skill's Lambda function via Environment variables.

```yaml
AWSTemplateFormatVersion: 2010-09-09
Parameters:
  SkillId:
    Type: String
  LambdaRuntime:
    Type: String
  LambdaHandler:
    Type: String
  CodeBucket:
    Type: String
  CodeKey:
    Type: String
  CodeVersion:
    Type: String
  ProjectName:
    Type: String
  Environment:
    Type: String
  UserTableName:
    Type: String
Resources:
  AlexaSkillIAMRole:
      Type: AWS::IAM::Role
      Properties:
        AssumeRolePolicyDocument:
          Version: 2012-10-17
          Statement:
            - Effect: Allow
              Principal:
                Service:
                  - lambda.amazonaws.com
              Action:
                - sts:AssumeRole
        Path: /
        Policies:
          - PolicyName: alexaSkillExecutionPolicy
            PolicyDocument:
              Version: 2012-10-17
              Statement:
                - Effect: Allow
                  Action:
                    - logs:*
                  Resource: "*"
                - Effect: Allow
                  Action: S3:GetObject
                  Resource: !Join ['', ['arn:aws:s3:::', !Ref S3AssetBucket]]
                - Effect: Allow
                  Actions: dynamodb:*
                  Resources: !Join ['', ['arn:aws:dynamodb:::', !Ref AlexaDynamoDbTable]]
  S3AssetBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Join ['-',[!Ref ProjectName, 'assets']]
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
  AlexaDynamoDbTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName:
        !Ref UserTableName
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
  AlexaSkillFunction:
    Type: AWS::Lambda::Function
    Properties:
      Code:
        S3Bucket: !Ref CodeBucket
        S3Key: !Ref CodeKey
        S3ObjectVersion: !Ref CodeVersion
      Handler: !Ref LambdaHandler
      Runtime: !Ref LambdaRuntime
      Role: !GetAtt AlexaSkillIAMRole.Arn
      MemorySize: 512
      Timeout: 60
      Environment:
        Variables:
          S3_PERSISTENCE_BUCKET: {Ref: S3AssetBucket}
          DYNAMODB_TABLE_NAME: {Ref: AlexaDynamoDbTable}
  AlexaSkillFunctionEventPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:invokeFunction
      FunctionName: !GetAtt AlexaSkillFunction.Arn
      Principal: alexa-appkit.amazon.com
      EventSourceToken: !Ref SkillId
  AlexaSkillFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/lambda/${AlexaSkillFunction}
      RetentionInDays: 14
Outputs:
  SkillEndpoint:
    Description: LambdaARN for the regional endpoint
    Value: !GetAtt AlexaSkillFunction.Arn
  S3AssetBucket:
    Value: !GetAtt S3AssetBucket.DomainName
    Description: Name of S3 bucket to hold assets
  DynamoDBTableArn:
    Value: !GetAtt AlexaDynamoDbTable.Arn
    Description: ARN of DynamoDb Table
  DynamoDBTableName:
    Value: !Ref UserTableName
    Description: ARN of DynamoDb Table
```

## Deploy

When running the `ask deploy` command, you can inspect the CloudFormation stack progress and debug/troubleshoot and errors via the AWS console.
