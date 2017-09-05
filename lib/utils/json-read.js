'use strict';

const jsonfile = require('jsonfile');

// Public
module.exports = {
    readFile: (filePath) => {
        let file;
        try {
            file = jsonfile.readFileSync(filePath);
        } catch (e) {
            console.error('Invalid json: ' + filePath);
            return null;
        }
        return file;
    },
    readString: (string) => {
        let jsonObj;
        try {
            jsonObj = JSON.parse(string);
        } catch (e) {
            console.error('Invalid json string: ' + string);
            return null;
        }
        return jsonObj;
    },
    getProperty: (jsonObject, track) => {
        let trackArray = track.split('.').slice(1);
        let property = jsonObject;
        for (let i = 0; i < trackArray.length; i++) {
            if (property.hasOwnProperty(trackArray[i])) {
                property = property[trackArray[i]];
            } else {
                console.log('The property "' + trackArray[i] + '" does not exist.');
                return null;
            }
        }
        return property;
    }
};
