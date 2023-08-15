import {DEFAULT_PROFILE, parseKnownFiles} from "@smithy/shared-ini-file-loader";
import fs from "fs-extra";
import os from "os";
import path from "path";
import R from "ramda";

import CONSTANTS from "../../utils/constants";

/**
 * Returns the associated aws profile name to a ask profile
 * @param {string} askProfile cli profile name
 */
export function getAWSProfile(askProfile: string): string | undefined {
  if (askProfile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Environmental variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY not defined.");
    }
    return CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.AWS_CREDENTIALS;
  }
  const askConfig = fs.readJSONSync(path.join(os.homedir(), ".ask", "cli_config"));
  return R.view(R.lensPath(["profiles", askProfile, "aws_profile"]), askConfig);
}

/**
 * Returns the default aws region or global default aws region if available.
 * @param {string} awsProfile aws profile name
 */
export async function getCLICompatibleDefaultRegion(awsProfile: string): Promise<string> {
  const profile = awsProfile || process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE || DEFAULT_PROFILE;
  let region = process.env.AWS_REGION || process.env.AMAZON_REGION || process.env.AWS_DEFAULT_REGION || process.env.AMAZON_DEFAULT_REGION;
  if (!region) {
    const config = await parseKnownFiles({}).catch(() => undefined);
    region = config && config[profile] && config[profile].region;
  }
  return region || CONSTANTS.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION;
}
