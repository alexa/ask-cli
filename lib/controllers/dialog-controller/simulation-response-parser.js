const R = require('ramda');

module.exports = {
    getJsonInputAndOutputs,
    shouldEndSession,
    getConsideredIntents,
    getErrorMessage,
    getCaption,
    getStatus,
    getSimulationId
};

function getConsideredIntents(response) {
    const consideredIntents = R.view(R.lensPath(['result', 'alexaExecutionInfo', 'consideredIntents']), response);

    if (!consideredIntents) {
        return [];
    }
    return consideredIntents;
}

function getJsonInputAndOutputs(response) {
    const invocations = R.view(R.lensPath(['result', 'skillExecutionInfo', 'invocations']), response);

    if (!invocations) {
        return [];
    }

    const jsonInputs = invocations.map((invocation) => {
        const invocationRequest = R.view(R.lensPath(['invocationRequest', 'body']), invocation);
        return invocationRequest || { };
    });

    const jsonOutputs = invocations.map((invocation) => {
        const invocationResponse = R.view(R.lensPath(['invocationResponse']), invocation);
        return invocationResponse || { };
    });

    const result = [];
    for (let i = 0; i < jsonInputs.length; i++) {
        const io = {
            jsonInput: jsonInputs[i],
            jsonOutput: i < jsonOutputs.length ? jsonOutputs[i] : { }
        };
        result.push(io);
    }

    return result;
}

function shouldEndSession(response) {
    const invocations = R.view(R.lensPath(['result', 'skillExecutionInfo', 'invocations']), response);

    if (!invocations) {
        return false;
    }

    for (const invocation of invocations) {
        if (R.view(R.lensPath(['invocationResponse', 'body', 'response', 'shouldEndSession']), invocation)) {
            return true;
        }
    }
    return false;
}

function getErrorMessage(response) {
    return R.view(R.lensPath(['result', 'error', 'message']), response);
}

function getCaption(response) {
    const alexaResponses = R.view(R.lensPath(['result', 'alexaExecutionInfo', 'alexaResponses']), response);
    if (!alexaResponses) {
        return [];
    }
    return alexaResponses.map(element => R.view(R.lensPath(['content', 'caption']), element));
}

function getStatus(response) {
    return R.view(R.lensPath(['status']), response);
}

function getSimulationId(response) {
    return R.view(R.lensPath(['id']), response);
}
