const jsonView = require('@src/view/json-view');

module.exports = {
    getCertificationsList,
    traverseCertificationsList
};

function getCertificationsList(smapiClient, cmd, callback) {
    const queryParams = {};
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }
    if (cmd.maxResults) {
        queryParams.maxResults = cmd.maxResults;
    }
    smapiClient.skill.publishing.listCertifications(cmd.skillId, queryParams, (err, response) => {
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

function traverseCertificationsList(smapiClient, cmd, callback) {
    const callApiTrack = ['skill', 'publishing', 'listCertifications'];
    const callArgv = [cmd.skillId];
    const responseAccessor = 'items';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.items
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}
