'use strict';

const jsonUtility = require('../utils/json-utility');
const domainRegistry = require('../utils/domain-registry');

module.exports.localizingCreatedLambdaARN = (lambdaMetaDataList, projectConfigFile, profile) => {
    if (!lambdaMetaDataList || lambdaMetaDataList.length === 0) {
        return;
    }
    let projectConfig = jsonUtility.read(projectConfigFile);
    lambdaMetaDataList.forEach((metaData) => {
        if (metaData.customName) {
            return;
        }
        let domainKey = domainRegistry.getSkillSchemaKey(metaData.domain);
        let arrayPathToUrl = ['deploy_settings', profile, 'merge', 'skillManifest', 'apis',
            domainKey, 'regions', metaData.region, 'endpoint', 'uri'];
        jsonUtility.writePropertyToJsonOjbect(projectConfig, arrayPathToUrl, metaData.arn);
    });
    jsonUtility.write(projectConfigFile, projectConfig);
};
