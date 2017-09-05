'use strict';

const apiWrapper = require('./api-wrapper');
const inquirer = require('inquirer');
const profileHelper = require('../utils/profile-helper');

// Public
module.exports = {
    createCommand: (commander) => {
        buildSubmitCommand(commander);
        buildWithdrawCommand(commander);
    }
};

// Private
function buildSubmitCommand(commander) {
    commander
        .command('submit')
        .usage('<-s|--skill-id <skill-id>> [-p|--profile <profile>] [--debug]')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .description('submit a skill for certification')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        apiWrapper.callSubmit(options.skillId, profile, options.debug, () => {
            console.log('Skill submitted successfully.');
        });
    }
}

function buildWithdrawCommand(commander) {
    commander
        .command('withdraw')
        .usage('<-s|--skill-id <skill-id>> [-p|--profile <profile>] [--debug]')
        .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
        .option('-p, --profile <profile>', 'ask cli profile')
        .option('--debug', 'ask cli debug mode')
        .description('withdraw a skill from the certification process')
        .action(handle);

    function handle(options) {
        if (!options.skillId) {
            console.warn('Please input required parameter: skill-id.');
            return;
        }
        let profile = profileHelper.runtimeProfile(options.profile);
        collectWithdrawPayload((reason, message) => {
            apiWrapper.callWithdraw(options.skillId, reason, message, profile, options.debug, () => {
                console.log('Skill withdrawn successfully.');
            });
        });
    }
}

function collectWithdrawPayload(callback) {
    const REASON_CHOICES = {
        'This is a test skill and not meant for certification': 'TEST_SKILL',
        'I want to add more features to the skill': 'MORE_FEATURES',
        'I discovered an issue with the skill': 'DISCOVERED_ISSUE',
        "I haven't received certification feedback yet": 'NOT_RECEIVED_CERTIFICATION_FEEDBACK',
        'I do not intend to publish the skill right away': 'NOT_INTEND_TO_PUBLISH',
        'Other reason': 'OTHER'
    };
    let question1 = [
        {
            type: 'list',
            name: 'reason',
            message: 'Please choose your reason for the withdrawal: ',
            choices: Object.keys(REASON_CHOICES)
        }
    ];
    inquirer.prompt(question1).then((answers) => {
        let reasonEnum = REASON_CHOICES[answers.reason];
        if (reasonEnum !== 'OTHER') {
            callback(reasonEnum, null);
        } else {
            let question2 = [
                {
                    type: 'input',
                    name: 'message',
                    message: 'Your reason: '
                }
            ];
            inquirer.prompt(question2).then((answers) => {
                callback(reasonEnum, answers.message);
            });
        }
    });
}
