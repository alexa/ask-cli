import {
  IAMClient as _IAMClient,
  AttachRolePolicyCommand,
  AttachRolePolicyCommandOutput,
  CreateRoleCommand,
  CreateRoleCommandOutput,
  GetRoleCommand,
  GetRoleCommandOutput,
  Role,
} from "@aws-sdk/client-iam";

import CONSTANTS from "../../utils/constants";
import AbstractAwsClient, {AwsClientConfiguration} from "./abstract-aws-client";

/**
 * Class for AWS IAM Client
 */
export default class IAMClient extends AbstractAwsClient {
  client: _IAMClient;

  /**
   * Constructor
   * @param configuration The aws client config
   */
  constructor(configuration: AwsClientConfiguration) {
    super(configuration);
    this.client = new _IAMClient({
      credentials: this.credentials,
      region: this.region,
    });
  }

  /**
   * Returns information for an iam role
   * @param roleArn The arn of the iam role to get information about
   */
  getIAMRole(roleArn: string): Promise<Role | undefined> {
    const command = new GetRoleCommand({
      RoleName: this._extractIAMRoleName(roleArn),
    });
    return this.client.send(command).then((data: GetRoleCommandOutput) => data.Role);
  }

  /**
   * Creates a basic lambda iam role
   * @param roleName The name of the iam role
   */
  createBasicLambdaRole(roleName: string): Promise<Role | undefined> {
    const policy = CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY;
    const command = new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(policy),
    });
    return this.client.send(command).then((data: CreateRoleCommandOutput) => data.Role);
  }

  /**
   * Attaches the basic lambda managed role policy to an iam role
   * @param roleArn The arn of the iam role to attach the role policy to
   */
  attachBasicLambdaRolePolicy(roleArn: string): Promise<AttachRolePolicyCommandOutput> {
    const command = new AttachRolePolicyCommand({
      PolicyArn: CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY_ARN,
      RoleName: this._extractIAMRoleName(roleArn),
    });
    return this.client.send(command);
  }

  /**
   * Extracts iam role name from an iam role arn
   * @param roleArn The arn of the iam role to extract the role name from
   */
  _extractIAMRoleName(roleArn: string): string | undefined {
    return roleArn.split("role/").pop();
  }
}
