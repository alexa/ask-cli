/* eslint-disable no-await-in-loop */
import { CustomSmapiClientBuilder } from 'ask-smapi-sdk';
import { PLACEHOLDER } from '../dist/lib/utils/constants';
import { isEnvProfile, resolveVendorId } from "../dist/lib/utils/profile-helper";

const appConfig = new (require('../lib/model/app-config'))();
const authorizationController = new (require('../dist/lib/controllers/authorization-controller'))({
    auth_client_type: 'LWA'
});
const dynamicConfig = require('../dist/lib/utils/dynamic-config');
const profile = _findEnvProfile() || process.env.ASK_DEFAULT_PROFILE || "default";;

function _findEnvProfile() {
    if (isEnvProfile()) {
      // Only when user set every required parameter in ENV, we will treat profile as ENV
      return PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    }
    return null;
  }

const refreshTokenConfig = {
    clientId: authorizationController.oauthClient?.config.clientId,
    clientSecret: authorizationController.oauthClient?.config.clientConfirmation,
    refreshToken: appConfig.getToken(profile).refresh_token
};

const authEndpoint = dynamicConfig.lwaTokenHost;
const smapiEndpoint = dynamicConfig.smapiBaseUrl;

const cleanUp = async () => {
    console.log('cleaning ask resources');
    const client = new CustomSmapiClientBuilder()
        .withAuthEndpoint(authEndpoint)
        .withApiEndpoint(smapiEndpoint)
        .withRefreshTokenConfig(refreshTokenConfig)
        .client();

    let nextToken;
    const skills: any = [];
    do {
        const vendorId = resolveVendorId(profile);
        const res = await client.listSkillsForVendorV1(vendorId, nextToken);
        Array.prototype.push.apply(skills, res.skills);

        nextToken = res.nextToken;
    } while (nextToken);

    const skillIds = skills.map(s => s.skillId);

    // not using promise all to avoid throttling
    for (const skillId of skillIds) {
        await client.deleteSkillV1(skillId);
        console.log(`removed skill with id ${skillId}`);
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log(`removed # skill(s) ${skillIds.length}`);
    console.log('done');
};

cleanUp();
