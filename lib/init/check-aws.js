'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const profileHelper = require('../utils/profile-helper');
const inquirer = require('inquirer');
const AWS_DISPLAY_PAGE_SIZE = 25;

module.exports.checkAWS = (AskProfile, callback) => {
    let AWSProfileList = getAWSProfileList();
    addAwsProfileOption(AWSProfileList, AskProfile, callback);
};

// Private
function getAWSProfileList() {
    let awsCredentialsIni = path.join(os.homedir(), '.aws', 'credentials');
    if (!fs.existsSync(awsCredentialsIni)) {
        // console.warn("Warn: Cannot find aws credentials");
        return [];
    }
    let profiles = profileHelper.parseIni(fs.readFileSync(awsCredentialsIni, 'utf-8'));
    let listOfProfileNames = [];
    for (let profileName in profiles) {
        if (profiles.hasOwnProperty(profileName)) {
            listOfProfileNames.push(profileName);
        }
    }
    if (listOfProfileNames.length === 0) {
        // console.warn('Warn: aws credentials have not set up yet.');
        return [];
    }
    return listOfProfileNames;
}

function addAwsProfileOption(AWSProfileList, ASKProfile, callback) {
    const SKIP_AWS_MESSAGE = 'skip AWS credential for ask-cli';
    if (AWSProfileList.length === 0) {
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'skipAWS',
                default: false,
                message: 'There is no AWS credentials setup yet, do you want to continue the initialization?' +
                ' (Default: False)'
            }
        ]).then((answer) => {
            if (answer.skipAWS) {
                console.warn('Warning: ' + 'Profile: "' + ASKProfile + '" will not able to deploy lambda functions' +
                    ' since no AWS credentials are set up.\n');
                profileHelper.setupProfile(null, ASKProfile, callback);
            } else {
                console.log('You can turn to README.md for AWS credentials setup instruction.');
                return;
            }
        });
    } else {
        console.log('Setting up ask profile: [' + ASKProfile + ']');
        AWSProfileList.push(new inquirer.Separator());
        AWSProfileList.push(SKIP_AWS_MESSAGE);
        AWSProfileList.push(new inquirer.Separator());
        inquirer.prompt([{
            type: 'list',
            name: 'chosenProfile',
            message: 'Please choose one from the following AWS profiles for skill\'s Lambda function deployment.\n',
            pageSize: AWS_DISPLAY_PAGE_SIZE,
            choices: AWSProfileList
        }]).then((answer) => {
            if (answer.chosenProfile === SKIP_AWS_MESSAGE) {
                console.warn('Warning: ' + 'Profile: "' + ASKProfile + '" will not able to deploy lambda functions' +
                    ' since no AWS credentials are set up.');
                profileHelper.setupProfile(null, ASKProfile, callback);
            } else {
                profileHelper.setupProfile(answer.chosenProfile, ASKProfile, callback);
            }
        });
    }
}
