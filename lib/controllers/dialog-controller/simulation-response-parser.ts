import R from 'ramda';

function getConsideredIntents(response: any) {
    const consideredIntents = R.view(R.lensPath(['result', 'alexaExecutionInfo', 'consideredIntents']), response);

    if (!consideredIntents) {
        return [];
    }
    return consideredIntents;
}

function getJsonInputAndOutputs(response: any) {
    const invocations = R.view(R.lensPath(['result', 'skillExecutionInfo', 'invocations']), response);

    if (!invocations) {
        return [];
    }

    const jsonInputs = invocations.map((invocation: any) => {
        const invocationRequest = R.view(R.lensPath(['invocationRequest', 'body']), invocation);
        return invocationRequest || { };
    });

    const jsonOutputs = invocations.map((invocation: any) => {
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

function shouldEndSession(response: any) {
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

function getErrorMessage(response: any) {
    return R.view(R.lensPath(['result', 'error', 'message']), response);
}

function getCaption(response: any) {
    const alexaResponses = R.view(R.lensPath(['result', 'alexaExecutionInfo', 'alexaResponses']), response);
    if (!alexaResponses) {
        return [];
    }
    return alexaResponses.map((element: any) => R.view(R.lensPath(['content', 'caption']), element));
}

function getStatus(response: any) {
    return R.view(R.lensPath(['status']), response);
}

function getSimulationId(response: any) {
    return R.view(R.lensPath(['id']), response);
}

export default {
    getJsonInputAndOutputs,
    shouldEndSession,
    getConsideredIntents,
    getErrorMessage,
    getCaption,
    getStatus,
    getSimulationId
};
