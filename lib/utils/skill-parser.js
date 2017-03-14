'use strict';

const jsonRead = require('./json-read');

module.exports.parseSkillName = (skillSchema) => {
    let info = jsonRead.getProperty(skillSchema,
        '.skillDefinition.multinationalPublishingInfo.publishingInfoByLocale');
    if (!info) {
        return null;
    }
    let name;
    if (info.hasOwnProperty('en-US')) {
        name = info['en-US'].name;
    } else if (info.hasOwnProperty('en-GB')){
        name = info['en-GB'].name;
    } else {
        name = info[Object.keys(info)[0]].name;
    }
    return name.replace(/[\s]+/g, '_'); // Change spaces between skill name to underbar
};

module.exports.parseSkillType = (skillSchema) => {
    let skillDefinition = jsonRead.getProperty(skillSchema, '.skillDefinition');
    if (!skillDefinition) {
        return null;
    }
    if (skillDefinition.hasOwnProperty('smartHomeInfo')) {
        return 'smarthome';
    }
    if (skillDefinition.hasOwnProperty('customInteractionModelInfo')) {
        return 'custom';
    }
    let hasFlashBriefing = false;
    Object.keys(skillDefinition).forEach((key) => {
        if (key !== 'multinationalPublishingInfo' && key.endsWith('Info')) {
            hasFlashBriefing = true;
        }
    });
    if (hasFlashBriefing) {
        return 'flashbriefing';
    }
    // Domain not recognized
    console.warn('Skill schema invalid. Type of the skill not recognized.');
    return null;
};

module.exports.parseLambdaWithSkillType = (skillSchema, skillType) => {
    if (skillType === 'flashbriefing') {
        return null;
    }
    let lambdaArn = {};
    if (skillType === 'custom') {
        let customInfo = jsonRead.getProperty(skillSchema,
            '.skillDefinition.customInteractionModelInfo');
        if (!customInfo) {
            return lambdaArn;
        }
        if (customInfo.hasOwnProperty('endpointsByRegion')) {
            let customEndpoints = customInfo.endpointsByRegion;
            if (customEndpoints.hasOwnProperty('NA')) {
                lambdaArn.custom = customEndpoints.NA.url;
            } else {
                lambdaArn.custom = customEndpoints[Object.keys(customEndpoints)[0]].url;
            }
            if (lambdaArn.custom.trim().length === 0) {
                delete lambdaArn.custom;
            }
        }
    }
    if (skillType === 'smarthome') {
        let smartHomeInfo = jsonRead.getProperty(skillSchema,
            '.skillDefinition.smartHomeInfo');
        if (!smartHomeInfo) {
            return lambdaArn;
        }
        if (smartHomeInfo.hasOwnProperty('endpointsByRegion')) {
            let smarthomeEndpoints = smartHomeInfo.endpointsByRegion;
            if (smarthomeEndpoints.hasOwnProperty('NA')) {
                lambdaArn.smarthome = smarthomeEndpoints.NA.url;
            } else {
                lambdaArn.smarthome = smarthomeEndpoints[Object.keys(smarthomeEndpoints)[0]].url;
            }
            if (lambdaArn.smarthome.trim().length === 0) {
                delete lambdaArn.smarthome;
            }
        }
    }
    return lambdaArn;
};

module.exports.parseLocaleList = (skillSchema) => {
    let infoByLocale = jsonRead.getProperty(skillSchema,
        '.skillDefinition.multinationalPublishingInfo.publishingInfoByLocale');
    if (!infoByLocale) {
        return [];
    }
    return Object.keys(infoByLocale);
};

module.exports.isSkillNameValid = (name) => {
    let filteredName = name.match(/([a-zA-Z0-9-_]+)/g);
    if (filteredName && filteredName[0] === name) {
        return true;
    } else {
        return false;
    }
};

module.exports.setLambdaWithArns = (skillSchema, lambdaArns) => {
    let localeMapping = {
        'en-US': 'NA',
        'en-GB': 'GB',
        'de-DE': 'DE'
    };
    if (lambdaArns.hasOwnProperty('custom')) {
        let info = jsonRead.getProperty(skillSchema,
            '.skillDefinition.customInteractionModelInfo');
        let customEndpoints;
        if (info.hasOwnProperty('endpointsByRegion')) {
            customEndpoints = info.endpointsByRegion;
            Object.keys(customEndpoints).map((key) => {
                customEndpoints[key].url = lambdaArns.custom;
            });
        } else {
            customEndpoints = {};
            let localList = module.exports.parseLocaleList(skillSchema);
            localList.map((key) => {
                customEndpoints[localeMapping[key]] = {};
                customEndpoints[localeMapping[key]].url = lambdaArns.custom;
            });
        }
        skillSchema.skillDefinition.customInteractionModelInfo.endpointsByRegion = customEndpoints;
    } else if (lambdaArns.hasOwnProperty('smarthome')) {
        let info = jsonRead.getProperty(skillSchema,
            '.skillDefinition.smartHomeInfo');
        let smarthomeEndpoints;
        if (info.hasOwnProperty('endpointsByRegion')) {
            smarthomeEndpoints = info.endpointsByRegion;
            Object.keys(smarthomeEndpoints).map((key) => {
                smarthomeEndpoints[key].url = lambdaArns.smarthome;
            });
        } else {
            smarthomeEndpoints = {};
            let localList = module.exports.parseLocaleList(skillSchema);
            localList.map((key) => {

                smarthomeEndpoints[localeMapping[key]] = {};
                smarthomeEndpoints[localeMapping[key]].url = lambdaArns.smarthome;
            });
        }
        skillSchema.skillDefinition.smartHomeInfo.endpointsByRegion = smarthomeEndpoints;
    }
    return skillSchema;
};
