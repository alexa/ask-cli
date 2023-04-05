import {
  LambdaClient as _LambdaClient,
  AddPermissionCommand,
  AddPermissionCommandOutput,
  CreateFunctionCommand,
  CreateFunctionCommandOutput,
  GetFunctionCommand,
  GetFunctionCommandOutput,
  UpdateFunctionCodeCommand,
  UpdateFunctionCodeCommandOutput,
  UpdateFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommandOutput,
} from "@aws-sdk/client-lambda";

import AbstractAwsClient, {AwsClientConfiguration} from "./abstract-aws-client";

/**
 * Class for Lambda Client
 */
export default class LambdaClient extends AbstractAwsClient {
  client: _LambdaClient;

  /**
   * Constructor
   * @param configuration The AWS client config
   */
  constructor(configuration: AwsClientConfiguration) {
    super(configuration);
    this.client = new _LambdaClient({
      credentials: this.credentials,
      region: this.region,
    });
  }

  /**
   * Creates a lambda function
   * @param functionName The name of the lambda function
   * @param config The configuration of the lambda function
   * @param role The arm of the iam role
   * @param zipFile The base64-encoded contents of the deployment package
   */
  createLambdaFunction(
    functionName: string,
    config: FunctionConfiguration,
    role: string,
    zipFile: Buffer,
  ): Promise<CreateFunctionCommandOutput> {
    const {runtime, handler, description, memorySize, timeout, environmentVariables} = config;
    const command = new CreateFunctionCommand({
      Code: {
        ZipFile: zipFile,
      },
      FunctionName: functionName,
      Handler: handler,
      MemorySize: memorySize,
      Role: role,
      Runtime: runtime,
      Timeout: timeout,
      ...(description && {Description: description}),
      ...(environmentVariables && {Environment: {Variables: environmentVariables}}),
    });
    return this.client.send(command);
  }

  /**
   * Adds Alexa service permission to a lambda function
   * @param skillType The skill type
   * @param skillId The skill id used as a event source token
   * @param functionArn The arn of the lambda function
   */
  addAlexaPermissionByDomain(skillType: string, skillId: string, functionArn: string): Promise<AddPermissionCommandOutput> {
    const command = new AddPermissionCommand({
      FunctionName: functionArn,
      StatementId: Date.now().toString(),
      Action: "lambda:InvokeFunction",
      Principal: this._getAlexaServicePrincipal(skillType),
      EventSourceToken: skillId,
    });
    return this.client.send(command);
  }

  /**
   * Returns information for a lambda function
   * @param functionArn The name of the lambda function
   */
  getFunction(functionArn: string): Promise<GetFunctionCommandOutput> {
    const command = new GetFunctionCommand({
      FunctionName: functionArn,
    });
    return this.client.send(command);
  }

  /**
   * Updates the code for a lambda function
   * @param functionArn The arn of the lambda function
   * @param zipFile The base64-encoded contents of the deployment package
   * @param revisionId Only update the function if the revision ID matches the ID that's specified
   */
  updateFunctionCode(functionArn: string, zipFile: Buffer, revisionId: string): Promise<UpdateFunctionCodeCommandOutput> {
    const command = new UpdateFunctionCodeCommand({
      FunctionName: functionArn,
      ZipFile: zipFile,
      RevisionId: revisionId,
    });
    return this.client.send(command);
  }

  /**
   * Updates the configuration for a lambda function
   * @param functionArn The arn of the lambda function
   * @param config The configuration of the lambda function
   * @param revisionId Only update the function if the revision ID matches the ID that's specified
   */
  updateFunctionConfiguration(
    functionArn: string,
    config: FunctionConfiguration,
    revisionId: string,
  ): Promise<UpdateFunctionConfigurationCommandOutput> {
    const {runtime, handler, description, memorySize, timeout, environmentVariables} = config;
    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionArn,
      Handler: handler,
      MemorySize: memorySize,
      RevisionId: revisionId,
      Runtime: runtime,
      Timeout: timeout,
      ...(description && {Description: description}),
      ...(environmentVariables && {Environment: {Variables: environmentVariables}}),
    });
    return this.client.send(command);
  }

  /**
   * Returns the alexa service principal for a skill type
   * @param skillType The skill type
   */
  _getAlexaServicePrincipal(skillType: string): string | undefined {
    switch (skillType) {
      case "smartHome":
      case "video":
        return "alexa-connectedhome.amazon.com";
      case "custom":
      case "houseHoldList":
      case "music":
        return "alexa-appkit.amazon.com";
      default:
        return;
    }
  }
}

/**
 * Interface for Lambda Function Configuration
 */
export interface FunctionConfiguration {
  runtime: string;
  handler: string;
  description?: string;
  memorySize: number;
  timeout: number;
  environmentVariables?: Record<string, string>;
}
