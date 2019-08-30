const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function getAlexaHostedSkillMetadata(skillId, callback) {
        const url = `skills/${skillId}/alexaHosted`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_HOSTED_SKILLS_META_DATA,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function getGitCredentials(skillId, repoUrl, callback) {
        const url = `skills/${skillId}/alexaHosted/repository/credentials/generate`;

        const payload = {
            repository: {
                type: 'GIT',
                url: repoUrl
            }
        };

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_GIT_CREDENTIALS,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getHostedSkillPermission(vendorId, permissionType, callback) {
        const url = `vendors/${vendorId}/alexaHosted/permissions/${permissionType}`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_HOSTED_SKILLS_PERMISSION,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        getAlexaHostedSkillMetadata,
        getGitCredentials,
        getHostedSkillPermission
    };
};
