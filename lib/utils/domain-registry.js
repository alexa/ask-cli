'use strict';

const tools = require('./tools');
const path = require('path');

// Triggers for Lambda
const EVENT_SOURCE_TRIGGER_ASK = 'Alexa Skill Kit';
const EVENT_SOURCE_TRIGGER_SMARTHOME = 'Alexa Smart Home';

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
    let domainInfo = domainRegistry();
    let domainEventSourceParams = domainInfo[domain].eventSourceParams;
    if (domainInfo[domain].triggers === EVENT_SOURCE_TRIGGER_SMARTHOME) {
        domainEventSourceParams.EventSourceToken = skillId;
    }
    return domainEventSourceParams;
};

/*
 * Register each domain with required info
 *
 * @return list of domain info.
 */
function domainRegistry() {
    let lambdaPath = path.join(process.cwd(), 'lambda');

    return {
        custom: {
            lambdaPath: path.join(lambdaPath, 'custom'),
            skillSchemaKey: 'custom',
            triggers: EVENT_SOURCE_TRIGGER_ASK,
            eventSourceParams: {
                Action: 'lambda:InvokeFunction',
                StatementId: tools.generateSID(),
                Principal: 'alexa-appkit.amazon.com'
            }
        },

        smartHome: {
            lambdaPath: path.join(lambdaPath, 'smarthome'),
            skillSchemaKey: 'smartHome',
            triggers: EVENT_SOURCE_TRIGGER_SMARTHOME,
            eventSourceParams: {
                Action: 'lambda:InvokeFunction',
                StatementId: tools.generateSID(),
                Principal: 'alexa-connectedhome.amazon.com'
            }
        },

        flashBriefing: {
            // No Lambda relative settings
        },

        houseHoldList: {
            lambdaPath: path.join(lambdaPath, 'householdlist'),
            skillSchemaKey: 'houseHoldList',
            triggers: EVENT_SOURCE_TRIGGER_ASK,
            eventSourceParams: {
                Action: 'lambda:InvokeFunction',
                StatementId: tools.generateSID(),
                Principal: 'alexa-appkit.amazon.com'
            }
        },

        video: {
            lambdaPath: path.join(lambdaPath, 'video'),
            skillSchemaKey: 'video',
            triggers: EVENT_SOURCE_TRIGGER_SMARTHOME,
            eventSourceParams: {
                Action: 'lambda:InvokeFunction',
                StatementId: tools.generateSID(),
                Principal: 'alexa-connectedhome.amazon.com'
            }
        }

        // Register new domains here
    };
}
