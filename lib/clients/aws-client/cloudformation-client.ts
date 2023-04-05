import {
  CloudFormationClient as _CloudFormationClient,
  CloudFormationServiceException,
  CreateStackCommand,
  CreateStackCommandOutput,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
  DescribeStackEventsCommand,
  DescribeStackEventsCommandOutput,
  DescribeStackResourceCommand,
  DescribeStackResourceCommandOutput,
  DescribeStackResourcesCommand,
  DescribeStackResourcesCommandOutput,
  UpdateStackCommand,
  UpdateStackCommandOutput,
  Parameter,
  Stack,
  StackEvent,
  StackResource,
  StackResourceDetail,
} from "@aws-sdk/client-cloudformation";
import R from "ramda";
import AbstractAwsClient, {AwsClientConfiguration} from "./abstract-aws-client";

/**
 * Class for AWS Cloudformation Client
 */
export default class CloudformationClient extends AbstractAwsClient {
  client: _CloudFormationClient;

  /**
   * Constructor
   * @param configuration The AWS client config
   */
  constructor(configuration: AwsClientConfiguration) {
    super(configuration);
    this.client = new _CloudFormationClient({
      credentials: this.credentials,
      region: this.region,
    });
  }

  /**
   * Creates a stack based on the parameters.
   * @param stackName The stack name
   * @param templateBody The template body
   * @param parameters The input parameters
   * @param capabilities The input capabilities
   */
  createStack(stackName: string, templateBody: string, parameters: Parameter[], capabilities: string[]): Promise<string | undefined> {
    const command = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Capabilities: capabilities,
      ...(!R.isEmpty(parameters) && {Parameters: parameters}),
    });
    return this.client.send(command).then((data: CreateStackCommandOutput) => data.StackId);
  }

  /**
   * Updates the stack based on the stackName with input parameters.
   * @param stackName The stack name
   * @param templateBody The template body
   * @param parameters The input parameters
   * @param capabilities The input capabilities
   */
  updateStack(
    stackName: string,
    templateBody: string,
    parameters: Parameter[],
    capabilities: string[],
  ): Promise<string | undefined | void> {
    const command = new UpdateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Capabilities: capabilities,
      ...(!R.isEmpty(parameters) && {Parameters: parameters}),
    });
    return this.client
      .send(command)
      .then((data: UpdateStackCommandOutput) => data.StackId)
      .catch((err: CloudFormationServiceException) => {
        if (err.name !== "ValidationError" || err.message !== "No updates are to be performed.") {
          throw err;
        }
      });
  }

  /**
   * Checks if stack exists
   * @param stackName The stack name
   */
  stackExists(stackName: string | undefined): Promise<boolean> {
    return stackName
      ? this.getStack(stackName)
          .then((data: Stack | undefined) => data !== undefined && data.StackStatus !== "DELETE_COMPLETE")
          .catch(() => false)
      : Promise.resolve(false);
  }

  /**
   * Returns information for a stack
   * @param stackName The stack name
   */
  getStack(stackName: string): Promise<Stack | undefined> {
    const command = new DescribeStacksCommand({
      StackName: stackName,
    });
    return this.client.send(command).then((data: DescribeStacksCommandOutput) => data.Stacks?.[0]);
  }

  /**
   * Returns all events for a stack
   * @param stackName The stack name
   */
  getStackEvents(stackName: string): Promise<StackEvent[] | undefined> {
    const command = new DescribeStackEventsCommand({
      StackName: stackName,
    });
    return this.client.send(command).then((data: DescribeStackEventsCommandOutput) => data.StackEvents);
  }

  /**
   * Returns a specific resource for a stack
   * @param stackName The stack name
   * @param logicalId The logical resource ID
   */
  getStackResource(stackName: string, logicalId: string): Promise<StackResourceDetail | undefined> {
    const command = new DescribeStackResourceCommand({
      StackName: stackName,
      LogicalResourceId: logicalId,
    });
    return this.client.send(command).then((data: DescribeStackResourceCommandOutput) => data.StackResourceDetail);
  }

  /**
   * Returns all the resources for a stack
   * @param stackName The stack name
   */
  getStackResources(stackName: string): Promise<StackResource[] | undefined> {
    const command = new DescribeStackResourcesCommand({
      StackName: stackName,
    });
    return this.client.send(command).then((data: DescribeStackResourcesCommandOutput) => data.StackResources);
  }
}
