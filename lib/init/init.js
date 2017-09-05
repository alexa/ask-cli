'use strict';

const initHomeConfig = require('./init-home-config');
const setVendor = require('./set-vendor');
const checkAWS = require('./check-aws');
const lwa = require('./lwa');
const inquirer = require('inquirer');
const profileHelper = require('../utils/profile-helper');
const CONSTANTS = require('../utils/constants');

const LIST_PAGE_SIZE = 50;


module.exports = {
    createCommand: (commander) => {
        commander
            .command('init')
            .description('initialize the ask-cli with your Amazon developer account credentials')
            .option('--no-browser', 'display authorization url instead of opening browser')
            .option('-l, --list-profiles', 'list all the profile(s) for ask-cli')
            .option('-p, --profile <profile>', 'name for the profile to be created/updated')
            .option('--debug', 'ask cli debug mode')
            .option('-h, --help', 'output usage information', () => {
                console.log(CONSTANTS.COMMAND.INIT.HELP_DESCRIPTION);
                process.exit(0);
            })
            .action(handle);

        function handle(options) {
            if (options && typeof options === 'string') {
                console.error('[Error]: Invalid command. Please run "ask init -h" for help.');
                return;
            }
            if (options.listProfiles) {
                profileHelper.displayProfile();
                return;
            }
            initHomeConfig.initHomeConfig();
            if (options.profile) {
                directInitProcess(options.browser, options.profile, options.debug);
            } else {
                listInitProcess(options.browser, options.debug);
            }
        }
    }
};

function directInitProcess(browser, inputProfile, doDebug) {
    let profile = inputProfile || process.env.ASK_DEFAULT_PROFILE || 'default';
    console.log('-------------------- Initialize CLI --------------------');
    checkAWS.checkAWS(profile, () => {
        lwa.login(browser, profile, () => {
            setVendor.setVendorId(profile, doDebug);
        });
    });
}

function listInitProcess(browser, doDebug) {
    let rawProfileList = profileHelper.getListProfile();
    if (!rawProfileList || rawProfileList.length === 0) {
        newProfile(browser);
        return;
    }
    const HEADER = 'Profile              Associated AWS Profile';
    const CREATE_PROFILE_MESSAGE = 'Create new profile';
    let profileList = profileHelper.stringFormatter(profileHelper.getListProfile());
    if (!profileList || profileList.length === 0) {
        newProfile(browser);
    } else {
        profileList.splice(0, 0, new inquirer.Separator());
        profileList.splice(1, 0, CREATE_PROFILE_MESSAGE);
        profileList.splice(2, 0, new inquirer.Separator());
        profileList.splice(3, 0, new inquirer.Separator(HEADER));
        inquirer.prompt([{
            type: 'list',
            message: 'Please create a new profile or overwrite the existing profile.\n',
            name: 'profile',
            pageSize: LIST_PAGE_SIZE,
            choices: profileList
        }]).then((answers) => {
            if (answers.profile === CREATE_PROFILE_MESSAGE) {
                newProfile(browser);
            } else {
                let overrideProfile = answers.profile.split(' ')[0];
                let profileName = overrideProfile.match(/^\s*\[([^\[\]]+)\]\s*$/);
                directInitProcess(browser, profileName[1], doDebug);
            }
        });
    }
}

function newProfile(browser) {
    inquirer.prompt([{
        message: 'Please type in your new profile name:\n',
        type: 'input',
        name: 'profile',
        default: 'default'
    }]).then((answer) => {
        if (answer.profile.trim().length === 0) {
            console.error('[Error]: Invalid profile name.');
            process.exit(1);
        }
        directInitProcess(browser, answer.profile.trim());
    });
}
