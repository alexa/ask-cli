const jsonView = require('@src/view/json-view');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    getInteractionModelVersionsList,
    traverseInteractionModelVersionsList
};

function getInteractionModelVersionsList(smapiClient, cmd, callback) {
    const queryParams = {};
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }
    if (cmd.maxResults) {
        queryParams.maxResults = cmd.maxResults;
    }
    if (cmd.sortDirection) {
        queryParams.sortDirection = cmd.sortDirection;
    }
    if (cmd.sortField) {
        queryParams.sortField = cmd.sortField;
    }
    const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    smapiClient.skill.interactionModel.listInteractionModelVersions(cmd.skillId, stage, cmd.locale, queryParams, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            callback(jsonView.toString(response.body), null);
            return;
        }
        callback(null, response.body);
    });
}

function traverseInteractionModelVersionsList(smapiClient, cmd, callback) {
    const callApiTrack = ['skill', 'interactionModel', 'listInteractionModelVersions'];
    const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
    const callArgv = [cmd.skillId, stage, cmd.locale];
    const responseAccessor = 'skillModelVersions';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.skillModelVersions
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}
