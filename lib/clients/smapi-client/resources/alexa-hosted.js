const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    /**
     * To submit a skill creation request for a specified vendorId
     * @param {Object} hostedSkillPayload The JSON representation of the skill, and provides Alexa with all of the metadata required
     * @param {callback} callback { error, response }
     */
    function createHostedSkill(hostedSkillPayload, callback) {
        const url = 'skills/';
        const { vendorId, manifest, region } = hostedSkillPayload;
        const runtime = CONSTANTS.HOSTED_SKILL.DEFAULT_RUNTIME[hostedSkillPayload.runtime];

        const payload = {
            vendorId,
            manifest,
            hosting: {
                alexaHosted: {
                    runtime,
                    region
                }
            }
        };

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.CREATE_HOSTED_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    /**
     * To get information about an Alexa-hosted skill
     * @param {string} skillId The skill Id
     * @param {callback} callback { error, response }
     */
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

    /**
     * To obtain the skill credentials for the specified skill
     * @param {string} skillId The skill Id
     * @param {string} repoUrl repository url
     * @param {callback} callback { error, response }
     */
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

    /**
     * To access a permission to an Alexa hosted skill
     * @param {string} vendorId The vendor Id
     * @param {string} permissionType The permission type
     * @param {callback} callback { error, response }
     */
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
        createHostedSkill,
        getAlexaHostedSkillMetadata,
        getGitCredentials,
        getHostedSkillPermission
    };
};
