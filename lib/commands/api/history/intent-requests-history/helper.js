const jsonView = require('@src/view/json-view');

module.exports = {
    getIntentRequestsHistoryList,
    traverseIntentRequestsHistoryList
};

const INTENT_REQUESTS_HISTORY_MESSAGES = {
    UNABLE_TO_PARSE_FILTER: 'Please verify "--filters" parameter is a double-quote-qualified, '
    + 'semicolon-delimited list of name/value pairs, for instance: "Name=intent.name,'
    + 'Values=MyIntent,YourIntent;Name=interactionType,Value=MODAL".',
    INVALID_NAME_VALUE_PAIR: 'Invalid name/value pair.',
    NO_PARSABLE_VALUE_PAIR: name => `No parsable value(s) for Name=${name}.`
};

/**
 * Parses a string as semicolon-delimited list of name/value pairs into an object. Each value is an entry in an array
 * stored in object[name].
 *
 * "Name=myField, Values= myValue1,myValue2 ;Name = otherField, Value =myValue3" results in the object:
 *
 * {
 *   myField: ["myValue1", "myValue2"],
 *   otherField: ["myValue3"]
 * }
 *
 * @param {string} nameValuePairsString - String of comma-delimited name/value pairs, each in the format "Name=[name],Values=[value,value...]"
 * @returns {object} - Object with each property of a given name mapped to an array of string values.
 */
function parseNameValuePairsStringAsObject(nameValuePairsString) {
    const object = {};
    if (!nameValuePairsString) {
        return object;
    }
    nameValuePairsString.split(';').forEach((filterString) => {
        const nameValueMatch = /^\s*Name\s*=\s*([^,\s]+?)\s*,\s*Value[s]*\s*=\s*(.+?)\s*$/.exec(filterString);

        if (!nameValueMatch) {
            throw new Error(INTENT_REQUESTS_HISTORY_MESSAGES.INVALID_NAME_VALUE_PAIR);
        }

        const name = nameValueMatch[1];
        const values = nameValueMatch[2].split(',').filter(s => s && s.match(/^\s*$/) === null);

        if (values.length === 0) {
            throw new Error(INTENT_REQUESTS_HISTORY_MESSAGES.NO_PARSABLE_VALUE_PAIR(name));
        }

        if (name in object) {
            Array.prototype.push.apply(object[name], values);
        } else {
            object[name] = values;
        }
    });
    return object;
}

function getIntentRequestsHistoryList(smapiClient, cmd, callback) {
    let queryParams = {};
    try {
        queryParams = parseNameValuePairsStringAsObject(cmd.filters);
    } catch (error) {
        const errorMessage = `[Error] : ${error.message} ${INTENT_REQUESTS_HISTORY_MESSAGES.UNABLE_TO_PARSE_FILTER}`;
        return callback(errorMessage);
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
    if (cmd.nextToken) {
        queryParams.nextToken = cmd.nextToken;
    }

    smapiClient.skill.history.getIntentRequestsHistory(cmd.skillId, queryParams, (err, response) => {
        if (err) {
            return callback(err, null);
        }
        if (response.statusCode >= 300) {
            return callback(jsonView.toString(response.body), null);
        }
        callback(null, response.body);
    });
}

function traverseIntentRequestsHistoryList(smapiClient, cmd, callback) {
    const callApiTrack = ['skill', 'history', 'getIntentRequestsHistory'];
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
