'use strict';

const apiWrapper = require('./api-wrapper');
const tools = require('../utils/tools');
const fs = require('fs');
const profileHelper = require('../utils/profile-helper');
const jsonUtility = require('../utils/json-utility');
const async = require('async');
const os = require('os');
const path = require('path');

// Public
module.exports = {
    getSkillList: getSkillList,
    createCommand: (commander) => {
        buildCreateSkillCommand(commander);
        buildGetSkillCommand(commander);
        buildUpdateSkillCommand(commander);
        buildListSkillsCommand(commander);
        buildGetSkillStatusCommand(commander);
    }
};

// Private
function buildCreateSkillCommand(commander) {
    commander
        .command('create-skill')
        .usage('<-f|--file <file-path>> [-p|--profile <profile>] [--debug]')
        .description('create a skill')
        .option('-f, --file <file-path>', 'path for skill schema')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.file) {
            console.warn('Please input required parameter: file.');
            return;
        }
        if (!fs.existsSync(options.file)) {
            console.warn('Please verify skill schema is in current working directory.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        let skillManifest = jsonUtility.read(options.file);
        apiWrapper.callCreateSkill(skillManifest, profile, options.debug, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log('Skill created successfully.\n' +
                'Skill ID: ' + response.skillId);
            }
        });
    }
}

function buildGetSkillCommand(commander) {
    commander
        .command('get-skill')
        .usage('<-s|--skill-id <skill-id>> [-p|--profile <profile>] [--debug]')
        .description('get a skill')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callGetSkill(options.skillId, profile, options.debug, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                console.log(JSON.stringify(response, null, 2));
            }
        });
    }
}

function buildUpdateSkillCommand(commander) {
    commander
        .command('update-skill')
        .usage('<-s|--skill-id <skill-id>> <-f|--file <file-path>> [-p|--profile <profile>] [--debug]')
        .description('update the skill configuration details')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-f, --file <file-path>', 'path for skill schema')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        if (!options.file) {
            console.warn('Please input required parameter: file.');
            return;
        }
        if (!fs.existsSync(options.file)) {
            console.warn('Please verify skill schema is in current working directory.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        let skillManifest = jsonUtility.read(options.file);
        apiWrapper.callUpdateSkill(options.skillId, skillManifest, profile, options.debug, () => {
            console.log('Skill updated successfully.');
        });
    }
}

function buildListSkillsCommand(commander) {
    commander
        .command('list-skills')
        .usage('[-p|--profile <profile>] [--debug]')
        .description('list skills for a vendor')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        let profile = profileHelper.runtimeProfile(options.profile);
        getSkillList(profile, options.debug, (response) => {
            console.log(JSON.stringify(response, null, 2));
        });
    }
}

function buildGetSkillStatusCommand(commander) {
    commander
        .command('get-skill-status')
        .usage('<-s|--skill-id <skill-id>> [-p|--profile <profile>] [--debug]')
        .description('get the skill status for a skill')
        .option('-s, --skill-id <skill-id>', "skill-id for the skill")
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.error('[Error]: Please input required parameter: skill-id.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callGetSkillStatus(options.skillId, profile, options.debug, (data) => {
            let response = tools.convertDataToJsonObject(data);
            if (response) {
                let status = jsonUtility.getPropertyFromJsonObject(response, ['manifest', 'lastModified']);
                console.log(JSON.stringify(status, null, 2));
            }
        });
    }
}


// Private
function getSkillList(profile, doDebug, callback) {
    let nextToken;
    let result = {};
    result.skills = [];
    let configFile = path.join(os.homedir(), '.ask', 'cli_config');
    if (!fs.existsSync(configFile)) {
        console.warn('Please make sure ~/.ask/cli_config exists.');
        return;
    }
    let vendorId = jsonUtility.getProperty(configFile, ['profiles', profile, 'vendor_id']);
    if (!vendorId) {
        return;
    }
    async.doWhilst(
        (loopCallback) => {
            apiWrapper.callListSkills(vendorId, nextToken, 50, profile, doDebug, (data) => {
                let response = tools.convertDataToJsonObject(data);
                nextToken = response.nextToken;
                result.skills = result.skills.concat(deleteExtraProperty(response.skills));
                loopCallback(null, result);
            });
        },
        () => {
            return nextToken;
        },
        (err, result) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            callback(result);
        }
    );
}

function deleteExtraProperty(skills) {
    let skillList = JSON.parse(JSON.stringify(skills));
    for (let item of skillList) {
        delete item._links;
    }
    return skillList;
}
