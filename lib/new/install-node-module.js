'use strict';

const child = require('child_process');
const Spinner = require('clui').Spinner;

module.exports.install = (folderName, hasSpinner, callback) => {
    let installSpinner;
    if (hasSpinner) {
        installSpinner = new Spinner(' Initializing Alexa skill project...');
        installSpinner.start();
    }
    child.exec('npm install', {
        cwd: folderName
    }, (err) => {
        if (hasSpinner) {
            installSpinner.stop();
        }
        if (err) {
            console.error(err);
        } else {
            callback();
        }
    });
};
