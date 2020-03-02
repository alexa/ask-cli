const AppConfig = require('@src/model/app-config');
/**
 * Appends vendor id to requestParameters.
 * @param {Object} requestParameters Request parameters.
 * @param {string} profile Profile name.
 */
const appendVendorId = (requestParameters, profile) => {
    const { createSkillRequest, createInSkillProductRequest } = requestParameters;
    const body = createSkillRequest || createInSkillProductRequest;
    const vendorId = AppConfig.getInstance().getVendorId(profile);
    if (body && !body.vendorId) {
        body.vendorId = vendorId;
    } else if (!requestParameters.vendorId) {
        requestParameters.vendorId = vendorId;
    }
};

module.exports = appendVendorId;
