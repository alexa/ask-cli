'use strict';

const installNodeModule = require('./install-node-module');
const template = require('../utils/template');
const parser = require('../utils/skill-parser');
const profileHelper = require('../utils/profile-helper');
const jsonUtility = require('../utils/json-utility');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const CONSTANTS = require('../utils/constants');


// Public
module.exports = {
    createCommand: (commander) => {
        // TODO ask new -type <skill_type>
        commander
            .command('new')
            .description('create a new skill project on your computer')
            .option('-n, --skill-name <name>', 'create new skill project with skill name')
            .option('-p, --profile <profile>', 'create new skill project under the chosen profile')
            .option('--lambda-name <lambda-name>', 'define lambda name if the skill needs lambda function')
            .option('-h, --help', 'output usage information', () => {
                console.log(CONSTANTS.COMMAND.NEW.HELP_DESCRIPTION);
                process.exit(0);
            })
            .action(handle);

        function handle(options) {
            if (typeof options === 'string') {
                console.error('[Error]: Invalid command. Please run "ask new -h" for help.');
                return;
            }
            getSkillName(options.skillName, (skillName) => {
                if (!parser.isSkillNameValid(skillName)) {
                    console.warn('Lambda function name is invalid. ' +
                                 'Pattern of the name should be /[a-zA-Z0-9-_]+/.');
                    return;
                }

                let lambdaName;
                let profile = profileHelper.runtimeProfile(options.profile);

                if (options.lambdaName) {
                    if (!parser.isValidLambdaFunctionName(options.lambdaName)) {
                        console.warn('Lambda function name is invalid. ' +
                                     'Pattern of the name should be /[a-zA-Z0-9-_]+/.');
                        return;
                    } else {
                        lambdaName = options.lambdaName;
                    }
                } else {
                    lambdaName = skillName;
                }
                newSkillScaffold(skillName, profile, lambdaName);
            });
        }
    }
};

// Private
function newSkillScaffold(skillName, profile, lambdaName) {
    let currentDir = process.cwd();
    fs.access(currentDir, (fs.constants || fs).W_OK, (err) => {
        if (err) {
            console.error('No permission to write for the current path.');
            return;
        }
        let newProjDir = path.join(currentDir, skillName);
        if (fs.existsSync(newProjDir)) {
            console.warn('Failed to create skill project with the name already existed.');
            return;
        }

        let configFilePath = path.join(newProjDir, '.ask', 'config');
        let modelFilePath = path.join(newProjDir, 'models', 'en-US.json');
        let skillFilePath = path.join(newProjDir, 'skill.json');

        fs.mkdirSync(newProjDir);
        fs.mkdirSync(path.join(newProjDir, '.ask'));
        fs.mkdirSync(path.join(newProjDir, 'models'));

        template.copyConfig(configFilePath, '', false, profile);
        template.copyModel(modelFilePath);
        template.copySkill(skillFilePath, skillName);

        let AWSProfile = profileHelper.getAWSProfile(profile);
        if (AWSProfile && AWSProfile.length !== 0) {
            let defaultEndpoint = {
                "endpoint": {
                    "sourceDir": "lambda/custom"
                }
            };
            let addingObjectPath = ['skillManifest', 'apis', 'custom'];
            jsonUtility.writeToProperty(skillFilePath, addingObjectPath, defaultEndpoint);
            newLambdaJob(newProjDir, lambdaName, profile);
        } else {
            console.log('New project for Alexa skill created.');
        }
    });
}

function newLambdaJob(currentDir, lambdaName, profile) {
    fs.mkdirSync(path.join(currentDir, 'lambda'));
    fs.mkdirSync(path.join(currentDir, 'lambda', 'custom'));
    let configFilePath = path.join(currentDir, '.ask', 'config');

    let customLambdaPath = path.join(currentDir, 'lambda', 'custom');
    template.copyLambda(customLambdaPath);
    template.insertLambda(lambdaName, configFilePath, profile);

    installNodeModule.install(customLambdaPath, true, () => {
        console.log('New project for Alexa skill created.');
    });
}

function getSkillName(skillName, callback) {
    if (skillName) {
        callback(skillName);
    } else {
        inquirer.prompt([{
            message: 'Please type in your new skill name:\n',
            type: 'input',
            name: 'skillName'
        }]).then((answer) => {
            let skillName = answer.skillName.trim();
            if (skillName.length === 0) {
                console.error('[Error]: Invalid skill name.');
                process.exit(1);
            }
            callback(skillName);
        });
    }
}
