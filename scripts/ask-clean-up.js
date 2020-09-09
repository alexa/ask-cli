/* eslint-disable no-await-in-loop */
require('module-alias/register');
const { CustomSmapiClientBuilder } = require('ask-smapi-sdk');
const AppConfig = require('@src/model/app-config');
const AuthorizationController = require('@src/controllers/authorization-controller');
const CONSTANTS = require('@src/utils/constants');
const DynamicConfig = require('@src/utils/dynamic-config');

new AppConfig();

const authorizationController = new AuthorizationController({
    auth_client_type: 'LWA'
});
const profile = CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME;

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
        const res = await client.listSkillsForVendorV1(process.env.ASK_VENDOR_ID, nextToken);
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
