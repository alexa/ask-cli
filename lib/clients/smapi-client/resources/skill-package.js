const CONSTANTS = require('@src/utils/constants');
const stringUtils = require('@src/utils/string-utils');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function createUpload(callback) {
        const url = 'skills/uploads';
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.CREATE_UPLOAD,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function importPackage(skillId, vendorId, location, callback) {
        const url = stringUtils.isNonBlankString(skillId) ? `skills/${skillId}/imports` : 'skills/imports';
        const payload = {
            location
        };
        if (stringUtils.isNonBlankString(vendorId)) {
            payload.vendorId = vendorId;
        }
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.IMPORT_PACKAGE,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getImportStatus(importId, callback) {
        const url = `skills/imports/${importId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_IMPORT_STATUS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function exportPackage(skillId, stage, callback) {
        const url = `skills/${skillId}/stages/${stage}/exports`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.EXPORT_PACKAGE,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function getExportStatus(exportId, callback) {
        const url = `skills/exports/${exportId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_EXPORT_STATUS,
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
        createUpload,
        importPackage,
        getImportStatus,
        exportPackage,
        getExportStatus
    };
};
