'use strict';

const tools = require('./tools');
const path = require('path');

module.exports.domainList = () => {
    return Object.keys(domainRegistry());
};

module.exports.getSkillSchemaKey = (domain) => {
    return domainRegistry()[domain].skillSchemaKey;
};

module.exports.getLambdaPath = (domain) => {
    return domainRegistry()[domain].lambdaPath;
};

module.exports.getEventSourceParams = (domain, skillId) => {
    let domainEventSourceParams = domainRegistry()[domain].eventSourceParams;
    if (domain === 'smarthome') {
        domainEventSourceParams.EventSourceToken = skillId;
    }
    return domainEventSourceParams;
};


// Private
function domainRegistry() {
    let lambdaPath = path.join(process.cwd(), 'lambda');

    return {
        custom: {
            lambdaPath: path.join(lambdaPath, 'custom'),
            skillSchemaKey: 'customInteractionModelInfo',
            eventSourceParams: {
                Action: 'lambda:InvokeFunction',
                StatementId: tools.generateSID(),
                Principal: 'alexa-appkit.amazon.com'
            }
        },

        smarthome: {
            lambdaPath: path.join(lambdaPath, 'smarthome'),
            skillSchemaKey: 'smartHomeInfo',
            eventSourceParams: {
                Action: 'lambda:InvokeFunction',
                StatementId: tools.generateSID(),
                Principal: 'alexa-connectedhome.amazon.com'
            }
        }

        // Register new domains here
    };
}
