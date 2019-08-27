const R = require('ramda');

const CONSTANTS = require('@src/utils/constants');

const ISP_URL_BASE = 'inSkillProducts';
const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function createIsp(vendorId, ispDefinition, callback) {
        const url = `${ISP_URL_BASE}/`;
        const payload = {
            vendorId,
            inSkillProductDefinition: ispDefinition
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.CREATE_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getIsp(ispId, stage, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/stages/${stage}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function getIspSummary(ispId, stage, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/stages/${stage}/summary`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function updateIsp(ispId, stage, ispDefinition, eTag, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/stages/${stage}`;
        const headers = eTag ? { 'If-Match': eTag } : {};
        const payload = {
            inSkillProductDefinition: ispDefinition
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.UPDATE_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            headers,
            payload,
            callback
        );
    }

    function associateIsp(ispId, skillId, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/skills/${skillId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.ASSOCIATE_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function disassociateIsp(ispId, skillId, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/skills/${skillId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.DISASSOCIATE_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.DELETE,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List ISPs based on the vendor-id
     * @param {string} vendorId vendor id of the in-skill product
     * @param {Array} productIdList the array of in-skill product IDs
     * @param {string} stage stage for the in-skill product
     * @param {string} referenceName reference name for the in-skill product
     * @param {string} status status for the in-skill product
     * @param {string} type type for the in-skill product
     * @param {Boolean} isAssociatedWithSkill whether or not the in-skill products are associated to a skill
     * @param {Object} queryParams  | nextToken
     *                              | maxResults
     * @param {*} callback
     */
    function listIspForVendor(vendorId, productIdList, stage, referenceName, status, type, isAssociatedWithSkill, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (!queryObject) {
            queryObject = {};
        }
        if (productIdList && productIdList.length > 0) {
            queryObject.productId = productIdList.filter(id => id);
        }
        queryObject.vendorId = vendorId;
        if (referenceName) {
            queryObject.referenceName = referenceName;
        }

        if (type) {
            queryObject.type = type;
        }

        if (stage) {
            queryObject.stage = stage;
        }

        if (status) {
            queryObject.status = status;
        }

        if (isAssociatedWithSkill) {
            queryObject.isAssociatedWithSkill = isAssociatedWithSkill;
        }

        const url = `${ISP_URL_BASE}`;

        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_ISP_FOR_VENDOR,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List Isp based on the skill
     * @param {*} skillId
     * @param {*} stage
     * @param {*} queryParams | nextToken
     *                        | maxResults
     * @param {*} callback
     */
    function listIspForSkill(skillId, stage, queryParams, callback) {
        const queryObject = R.clone(queryParams);
        const url = `skills/${skillId}/stages/${stage}/${ISP_URL_BASE}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_SKILLS_FOR_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List skills based on the isp
     * @param {*} ispId
     * @param {*} stage
     * @param {*} queryParams | nextToken
     *                        | maxResults
     * @param {*} callback
     */
    function listSkillsForIsp(ispId, stage, queryParams, callback) {
        const queryObject = R.clone(queryParams);
        const url = `${ISP_URL_BASE}/${ispId}/stages/${stage}/skills`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_SKILLS_FOR_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function deleteIsp(ispId, stage, eTag, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/stages/${stage}`;
        const headers = eTag ? { 'If-Match': eTag } : {};
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.DELETE_ISP,
            CONSTANTS.HTTP_REQUEST.VERB.DELETE,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            headers,
            NULL_PAYLOAD,
            callback
        );
    }

    function resetIspEntitlement(ispId, stage, callback) {
        const url = `${ISP_URL_BASE}/${ispId}/stages/${stage}/entitlement`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.RESET_ISP_ENTITLEMENT,
            CONSTANTS.HTTP_REQUEST.VERB.DELETE,
            CONSTANTS.SMAPI.VERSION.V1,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    return {
        createIsp,
        getIsp,
        getIspSummary,
        updateIsp,
        associateIsp,
        disassociateIsp,
        listIspForVendor,
        listIspForSkill,
        listSkillsForIsp,
        deleteIsp,
        resetIspEntitlement
    };
};
