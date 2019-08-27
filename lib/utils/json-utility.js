'use strict';

const jsonfile = require('jsonfile');

module.exports = {
    write: write,
    read: read,
    getProperty: getProperty,
    writeToProperty: writeToProperty,
    deleteProperty: deleteProperty,
    insertObjectToObject: insertObjectToObject,
    deletePropertyFromJsonObject: deletePropertyFromJsonObject,
    getPropertyValueFromObject: getPropertyValueFromObject,
    addValueToProperty:addValueToProperty
};

function read(filePath) {
    try {
        let content = jsonfile.readFileSync(filePath);
        return content;
    } catch (e) {
        console.error('Invalid json: ' + filePath);
        process.exit(1);
    }
}

function write(filePath, jsonObject) {
    try {
        jsonfile.writeFileSync(filePath, jsonObject, {spaces: 2});
    } catch (e) {
        console.error('Invalid file, cannot write to: ' + filePath);
        process.exit(1);
    }
}

function writeToProperty(filePath, propertyPathArray, writeObject) {
    let jsonObject = read(filePath);
    insertObjectToObject(jsonObject, propertyPathArray, writeObject);
    write(filePath, jsonObject);
}

function deleteProperty(filePath, propertyPathArray) {
    let jsonObject = read(filePath);
    deletePropertyFromJsonObject(jsonObject, propertyPathArray);
    write(filePath, jsonObject);
    return true;
}

function getProperty(filePath, propertyPathArray) {
    const jsonObject = read(filePath);
    return getPropertyValueFromObject(jsonObject, propertyPathArray);
}

function getPropertyValueFromObject(jsonObject, propertyPathArray) {
    let targetObject = jsonObject;
    for (let index = 0; index < propertyPathArray.length - 1; index++) {
        if (!targetObject || !targetObject[propertyPathArray[index]]) {
            return null;
        }
        targetObject = targetObject[propertyPathArray[index]];
    }

    if (!targetObject) {
        return null;
    }

    return targetObject[propertyPathArray[propertyPathArray.length - 1]];
}

function deletePropertyFromJsonObject(jsonObject, propertyPathArray) {
    let targetObject = jsonObject;
    for (let index = 0; index < propertyPathArray.length - 1; index++) {
        if (!targetObject.hasOwnProperty(propertyPathArray[index])) {
            return false;
        }
        targetObject = targetObject[propertyPathArray[index]];
    }
    delete targetObject[propertyPathArray[propertyPathArray.length - 1]];
}

function insertObjectToObject(jsonObject, propertyPathArray, writeObject) {
    let targetObject = jsonObject;
    for (let index = 0; index < propertyPathArray.length - 1; index++) {
        if (!targetObject.hasOwnProperty(propertyPathArray[index])) {
            if (typeof targetObject !== 'object') {
                break;
            }
            targetObject[propertyPathArray[index]] = {};
        }
        targetObject = targetObject[propertyPathArray[index]];
    }

    if (typeof targetObject === 'object') {
        targetObject[propertyPathArray[propertyPathArray.length - 1]] = writeObject;
        return jsonObject;
    }
    console.error('[Error]: cannot add property to non-object value. Please correct your target path');
    process.exit(1);
}


function addValueToProperty(jsonObject, propertyPathArray, value) {
    for (let index = 0; index < propertyPathArray.length-1; index++) {
        if (!jsonObject.hasOwnProperty(propertyPathArray[index]) && typeof jsonObject === 'object') {
            jsonObject[propertyPathArray[index]] = {};
        }
        jsonObject = jsonObject[propertyPathArray[index]];
    }
    jsonObject[propertyPathArray[propertyPathArray.length-1]] = value;
}
