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

module.exports.extractSkillInfo = (skillSchema) => {
    let skillDefinition = jsonRead.getProperty(skillSchema, '.skillDefinition');
    if (!skillDefinition) {
        return null;
    }
    // For valid skill schema, 'multinationalPublishingInfo' will always be present
    // along with at least one more key corresponding to skill type.
    if (Object.keys(skillDefinition).length <= 1) {
        console.warn('Skill schema invalid. Skill domain not specified.');
        return null;
    }
    let skillInfo = {};
    let domainMapping = {
        custom: 'customInteractionModelInfo',
        smarthome: 'smartHomeInfo'
        // Add mappings for new domains here
    };
    Object.keys(domainMapping).forEach((domain) => {
        if (skillDefinition.hasOwnProperty(domainMapping[domain])) {
            let info = jsonRead.getProperty(skillSchema, '.skillDefinition.' + domainMapping[domain]);
            if (info.hasOwnProperty('endpointsByRegion')) {
                let endpoints = info.endpointsByRegion;
                // If endpointsByRegion has NA property, url field is using NA's url.
                // Else, the first key in endpointsByRegion will be used as Lambda arn.
                skillInfo[domain] = {};
                if (endpoints.hasOwnProperty('NA')) {
                    skillInfo[domain].url = endpoints.NA.url;
                } else {
                    skillInfo[domain].url = endpoints[Object.keys(endpoints)[0]].url;
                }
            }
        }
    });
    return skillInfo;
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

module.exports.unifySkillSchema = (skillSchema) => {
    let domainMapping = {
        custom: 'customInteractionModelInfo',
        smarthome: 'smartHomeInfo'
        // Add domain mapping here for the new domains
    };
    let localeMapping = {
        'en-US': 'NA',
        'en-GB': 'GB',
        'de-DE': 'DE'
    };
    let skillDefinition = jsonRead.getProperty(skillSchema, '.skillDefinition');
    if (!skillDefinition) {
        return;
    }
    Object.keys(domainMapping).forEach((domain) => {
        let domainInfo = domainMapping[domain];
        if (skillDefinition.hasOwnProperty(domainInfo)) {
            let info = skillDefinition[domainInfo];
            if (info) {
                if (!info.hasOwnProperty('endpointsByRegion')) {
                    let endpoints = {};
                    let localeList = module.exports.parseLocaleList(skillSchema);
                    localeList.forEach((locale) => {
                        endpoints[localeMapping[locale]] = {
                            url: 'TO_BE_REPLACED'
                        };
                    });
                    skillSchema.skillDefinition[domainInfo].endpointsByRegion = endpoints;
                }
            }
        }
    });
    return skillSchema;
};

module.exports.setLambdaWithSkillInfo = (skillSchema, skillInfo) => {
    let localeMapping = {
        'en-US': 'NA',
        'en-GB': 'GB',
        'de-DE': 'DE'
    };
    let domainMapping = {
        custom: 'customInteractionModelInfo',
        smarthome: 'smartHomeInfo'
        // Add mappings for new domains here
    };

    Object.keys(skillInfo).forEach((domain) => {
        let info = jsonRead.getProperty(skillSchema, '.skillDefinition.' + domainMapping[domain]);
        let endpoints;
        if (info.hasOwnProperty('endpointsByRegion')) {
            endpoints = info.endpointsByRegion;
            Object.keys(endpoints).map((key) => {
                endpoints[key].url = skillInfo[domain].url;
            });
        } else {
            endpoints = {};
            let localList = module.exports.parseLocaleList(skillSchema);
            localList.map((key) => {
                endpoints[localeMapping[key]] = {};
                endpoints[localeMapping[key]].url = skillInfo[domain].url;
            });
        }
        skillSchema.skillDefinition[domainMapping[domain]].endpointsByRegion = endpoints;
    });
    return skillSchema;
};
