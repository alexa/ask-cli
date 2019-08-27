const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function getManifest(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/manifest`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_MANIFEST,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function updateManifest(skillId, stage, manifest, eTag, callback) {
        const url = `skills/${skillId}/stages/${stage}/manifest`;
        const headers = eTag ? { 'If-Match': eTag } : {};
        const payload = { manifest: manifest.manifest };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.UPDATE_MANIFEST,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            headers,
            payload,
            callback
        );
    }

    return {
        getManifest,
        updateManifest
    };
};
