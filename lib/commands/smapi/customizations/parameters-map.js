const parameterRename = require('@src/commands/smapi/customizations/parameters.json');

const apiToCommanderMap = new Map();
const customizationMap = new Map();

Object.keys(parameterRename).forEach(key => {
    const value = parameterRename[key];
    customizationMap.set(key, value);
    if (value.name) {
        apiToCommanderMap.set(key, value.name);
    }
});

module.exports = { apiToCommanderMap, customizationMap };
