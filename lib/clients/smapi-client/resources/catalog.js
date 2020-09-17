const R = require('ramda');
const CONSTANTS = require('@src/utils/constants');

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

module.exports = (smapiHandle) => {
    function createCatalog(title, type, usage, vendorId, callback) {
        const url = 'catalogs';
        const payload = {
            title,
            type,
            usage,
            vendorId
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.CREATE_CATALOG,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getCatalog(catalogId, callback) {
        const url = `catalogs/${catalogId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_CATALOG,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    /**
     * List ISPs based on the vendor-id
     * @param {*} vendorId
     * @param {*} queryParams   | nextToken
     *                          | maxResults
     * @param {*} callback
     */
    function listCatalogs(vendorId, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (!queryObject) {
            queryObject = {};
        }
        queryObject.vendorId = vendorId;
        if (queryObject && !queryObject.maxResults) {
            queryObject.maxResults = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
        }
        const url = 'catalogs';
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_CATALOGS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function createCatalogUpload(catalogId, numberOfUploadParts, callback) {
        const url = `catalogs/${catalogId}/uploads`;
        const payload = {
            numberOfUploadParts
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.UPLOAD_CATALOG,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    function getCatalogUpload(catalogId, uploadId, callback) {
        const url = `catalogs/${catalogId}/uploads/${uploadId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.GET_CATALOG_UPLOAD,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function listCatalogUploads(catalogId, queryParams, callback) {
        let queryObject = R.clone(queryParams);
        if (!queryObject) {
            queryObject = {};
        }
        if (queryObject && !queryObject.maxResults) {
            queryObject.maxResults = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
        }
        const url = `catalogs/${catalogId}/uploads`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.LIST_CATALOG_UPLOADS,
            CONSTANTS.HTTP_REQUEST.VERB.GET,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            queryObject,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function associateCatalogWithSkill(skillId, catalogId, callback) {
        const url = `skills/${skillId}/catalogs/${catalogId}`;
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.ASSOCIATE_CATALOG_WITH_SKILL,
            CONSTANTS.HTTP_REQUEST.VERB.PUT,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            NULL_PAYLOAD,
            callback
        );
    }

    function completeCatalogUpload(catalogId, uploadId, partETagsList, callback) {
        const url = `catalogs/${catalogId}/uploads/${uploadId}`;
        const payload = {
            partETags: partETagsList
        };
        smapiHandle(
            CONSTANTS.SMAPI.API_NAME.COMPLET_CATALOG_UPLOAD,
            CONSTANTS.HTTP_REQUEST.VERB.POST,
            CONSTANTS.SMAPI.VERSION.V0,
            url,
            EMPTY_QUERY_PARAMS,
            EMPTY_HEADERS,
            payload,
            callback
        );
    }

    return {
        createCatalog,
        getCatalog,
        listCatalogs,
        createCatalogUpload,
        getCatalogUpload,
        listCatalogUploads,
        associateCatalogWithSkill,
        completeCatalogUpload
    };
};
