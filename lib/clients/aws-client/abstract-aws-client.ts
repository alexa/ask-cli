import {fromEnv, fromIni} from "@aws-sdk/credential-providers";
import {AwsCredentialIdentityProvider} from "@aws-sdk/types";

import CONSTANTS from "../../utils/constants";
import stringUtils from "../../utils/string-utils";

/**
 * Abstract Class for AWS Client
 */
export default abstract class AbstractAwsClient {
  credentials: AwsCredentialIdentityProvider;
  profile?: string;
  region?: string;

  /**
   * Constructor
   * @param configuration aws client config
   */
  constructor(configuration: AwsClientConfiguration) {
    const {awsProfile, awsRegion} = configuration;
    if (!stringUtils.isNonBlankString(awsProfile) || !stringUtils.isNonBlankString(awsRegion)) {
      throw new Error("Invalid awsProfile or Invalid awsRegion");
    }
    this.credentials =
      awsProfile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS
        ? fromEnv()
        : fromIni({
            profile: awsProfile,
          });
    this.profile = awsProfile;
    this.region = awsRegion;
  }
}

/**
 * Interface for AWS CLient Configuration
 */
export interface AwsClientConfiguration {
  awsProfile?: string;
  awsRegion?: string;
}
