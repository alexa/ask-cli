'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const jsonUtility = require('./json-utility');
const FORMATTER_SPACING = 26;

module.exports = {
    runtimeProfile: runtimeProfile,
    getAWSProfile: getAWSProfile,
    checkASKProfileExist: checkASKProfileExist,
    setupProfile: setupProfile,
    deleteProfile: deleteProfile,
    getListProfile: getListProfile,
    displayProfile: displayProfile,
    stringFormatter: stringFormatter
};

module.exports.parseIni = (ini) => {
      let currentSection;
      let map = {};
      for (let line of ini.split(/\r?\n/)) {
          line = line.split(/(^|\s)[;#]/)[0]; // this regex will remove comments after each aws profile
          let section = line.match(/^\s*\[([^\[\]]+)\]\s*$/);
          if (section) {
            currentSection = section[1];
          } else if (currentSection) {
            let item = line.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
            if (item) {
              map[currentSection] = map[currentSection] || {};
              map[currentSection][item[1]] = item[2];
            }
          }
      }
      return map;
};


module.exports.checkAWSProfileExist = (profile) => {
    let awsCredentialsIni = path.join(os.homedir(), '.aws', 'credentials');
    try {
        let profileMap = module.exports.parseIni(fs.readFileSync(awsCredentialsIni, 'utf-8'));
        return profileMap.hasOwnProperty(profile);
    } catch (err) {
        console.error('Invalid ini file: ' + awsCredentialsIni);
        process.exit(1);
    }
};

function runtimeProfile(profile) {
    let askProfile = profile || process.env.ASK_DEFAULT_PROFILE || 'default';
    if (!module.exports.checkASKProfileExist(askProfile)) {
        console.error('[Error]: Cannot resolve profile [' + askProfile + ']');
        process.exit(1);
    }
    return askProfile;
}

function getAWSProfile(askProfile) {
    let awsCredentials = path.join(os.homedir(), '.ask', 'cli_config');
    let propertyPathForAWSProfile = ['profiles', askProfile, 'aws_profile'];
    return jsonUtility.getProperty(awsCredentials, propertyPathForAWSProfile);
}

function checkASKProfileExist(profile) {
    let askCliConfig = path.join(os.homedir(), '.ask', 'cli_config');
    let askProfile = jsonUtility.read(askCliConfig);
    return askProfile.profiles.hasOwnProperty(profile);
}

function setupProfile(AWSProfile, ASKProfile, callback) {
    let homeConfig = path.join(os.homedir(), '.ask', 'cli_config');
    let propertyPathArray = ['profiles', ASKProfile, 'aws_profile'];
    jsonUtility.writeToProperty(homeConfig, propertyPathArray, AWSProfile);
    callback();
}

function deleteProfile(profile) {
    let configPath = path.join(os.homedir(), '.ask', 'cli_config');
    let targetPath = ['profiles', profile];
    jsonUtility.deleteProperty(configPath, targetPath);
}

function getListProfile() {
    let askConfig = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(askConfig)) {
        return null;
    }
    let profileObject = jsonUtility.read(askConfig);
    let profiles = profileObject.profiles;
    if (!profiles || Object.keys(profiles).length === 0) {
        return null;
    }
    let printOut = [];
    for (let profile of Object.getOwnPropertyNames(profiles)) {
        printOut.push({
            'askProfile': profile,
            'awsProfile': profiles[profile].aws_profile
        });
    }
    return printOut;
}

function displayProfile() {
    const HEADER = 'Profile              Associated AWS Profile';
    let profileList = stringFormatter(getListProfile());
    if (!profileList) {
        console.warn('ask-cli has not set up any profiles yet.');
        return;
    }
    profileList.splice(0, 0, HEADER);
    profileList.forEach((profile) => {
        console.log('  ' + profile);
    });
}

function stringFormatter(profileList) {
    if (!profileList || profileList.length === 0) {
        return null;
    }
    let formattedProfileList = [];
    for (let profileObj of profileList) {
        let formattedASKProfile = '[' + profileObj.askProfile + ']';
        let fillingSpace = ' ';
        if (formattedASKProfile.length <= FORMATTER_SPACING) {
            fillingSpace = ' '.repeat(FORMATTER_SPACING-formattedASKProfile.length);
        }
        if (!profileObj.awsProfile) {
            formattedProfileList.push(formattedASKProfile + fillingSpace + '** NULL **');
            continue;
        }
        formattedProfileList.push(formattedASKProfile + fillingSpace  + '"' + profileObj.awsProfile + '"');
    }
    return formattedProfileList;
}
