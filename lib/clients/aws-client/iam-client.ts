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
   * Returns information for a role
   * @param roleArn The arn of the IAM role to get information about.
   */
  getIAMRole(roleArn: string): Promise<Role | undefined> {
    const command = new GetRoleCommand({
      RoleName: this._extractIAMRoleName(roleArn),
    });
    return this.client.send(command).then((data: GetRoleCommandOutput) => data.Role);
  }

  /**
   * Creates a new role for AWS account.
   * @param roleName The name of the IAM role.
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
   * Attaches the specified managed policy to the specified IAM role.
   * @param roleArn The Amazon Resource Name (ARN) specifying the group.
   */
  attachBasicLambdaRolePolicy(roleArn: string): Promise<AttachRolePolicyCommandOutput> {
    const command = new AttachRolePolicyCommand({
      PolicyArn: CONSTANTS.AWS.IAM.ROLE.LAMBDA_BASIC_ROLE.POLICY_ARN,
      RoleName: this._extractIAMRoleName(roleArn),
    });
    return this.client.send(command);
  }

  /**
   * Extracts IAM Role from an existing iam role arn.
   * @param roleArn The Amazon Resource Name (ARN) specifying the group.
   */
  _extractIAMRoleName(roleArn: string): string | undefined {
    return roleArn.split("role/").pop();
  }
}
