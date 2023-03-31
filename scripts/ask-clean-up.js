/* eslint-disable no-await-in-loop */
const { CustomSmapiClientBuilder } = require('ask-smapi-sdk');
const AppConfig = require('../lib/model/app-config');
const AuthorizationController = require('../lib/controllers/authorization-controller');
const CONSTANTS = require('../lib/utils/constants');
const DynamicConfig = require('../lib/utils/dynamic-config');
const profileHelper = require("../lib/utils/profile-helper");

new AppConfig();

const authorizationController = new AuthorizationController({
    auth_client_type: 'LWA'
});
const profile = _findEnvProfile() || process.env.ASK_DEFAULT_PROFILE || "default";;

function _findEnvProfile() {
    if (profileHelper.isEnvProfile()) {
      // Only when user set every required parameter in ENV, we will treat profile as ENV
      return CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;
    }
    return null;
  }

const refreshTokenConfig = {
    clientId: authorizationController.oauthClient.config.clientId,
    clientSecret: authorizationController.oauthClient.config.clientConfirmation,
    refreshToken: AppConfig.getInstance().getToken(profile).refresh_token
};

const authEndpoint = DynamicConfig.lwaTokenHost;
const smapiEndpoint = DynamicConfig.smapiBaseUrl;

const cleanUp = async () => {
    console.log('cleaning ask resources');
    const client = new CustomSmapiClientBuilder()
        .withAuthEndpoint(authEndpoint)
        .withApiEndpoint(smapiEndpoint)
        .withRefreshTokenConfig(refreshTokenConfig)
        .client();

    let nextToken;
    const skills = [];
    do {
        vendorId = profileHelper.resolveVendorId(profile);
        const res = await client.listSkillsForVendorV1(vendorId, nextToken);
        skills.push(...res.skills);

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
