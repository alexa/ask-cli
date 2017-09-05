'use strict';

const jsonUtility = require('../utils/json-utility');
const domainRegistry = require('../utils/domain-registry');
const path = require('path');

module.exports = {
    localizing: localizing
};

function localizing(skillPath, configPath, lambdaPath, listOfReOrgLambdaInfoObject, profile) {
    let skillJson = jsonUtility.read(skillPath);
    let configJson = jsonUtility.read(configPath);

    for (let reorgLambdaInfoObject of listOfReOrgLambdaInfoObject) {
        for (let region of reorgLambdaInfoObject.regions) {
            let domainKey = domainRegistry.getSkillSchemaKey(reorgLambdaInfoObject.domain);
            let skillJsonPropertyPathToUri = region !== 'default' ?
                ['skillManifest', 'apis', domainKey, 'regions', region, 'endpoint', 'uri'] :
                ['skillManifest', 'apis', domainKey, 'endpoint', 'uri'];

            let uri = jsonUtility.getPropertyFromJsonObject(skillJson, skillJsonPropertyPathToUri);
            if (!uri || uri.length === 0) {
                continue;
            }
            if (uri.substr(0, 5) === 'https') {
                continue;
            }
            // delete uri property from skill.json
            jsonUtility.deletePropertyFromJsonObject(skillJson, skillJsonPropertyPathToUri);

            // write sourceDir to skill.json
            let skillJsonPropertyPathToSourceDir = region !== 'default' ?
                ['skillManifest', 'apis', domainKey, 'regions', region, 'endpoint', 'sourceDir'] :
                ['skillManifest', 'apis', domainKey, 'endpoint', 'sourceDir'];
            let relativePathToTargetLambdaFunction = path.join(lambdaPath, reorgLambdaInfoObject.sourceDirFromDomainLevel);
            jsonUtility.writePropertyToJsonOjbect(skillJson, skillJsonPropertyPathToSourceDir, relativePathToTargetLambdaFunction);

            // write uri to config
            let configPropertyPathToUri = region !== 'default' ?
                ['deploy_settings', profile, 'merge', 'skillManifest', 'apis', domainKey, 'regions', region, 'endpoint', 'uri'] :
                ['deploy_settings', profile, 'merge', 'skillManifest', 'apis', domainKey, 'endpoint', 'uri'];
            jsonUtility.writePropertyToJsonOjbect(configJson, configPropertyPathToUri, reorgLambdaInfoObject.uri);
        }
    }
    jsonUtility.write(skillPath, skillJson);
    jsonUtility.write(configPath, configJson);
}
