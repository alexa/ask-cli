'use strict';

const cloneProject = require('./clone-project');
const cloneSkill = require('./clone-skill');
const cloneModel = require('./clone-model');
const cloneLambda = require('./clone-lambda');
const cloneLocalizing = require('./clone-localizing');
const parser = require('../utils/skill-parser');
const path = require('path');
const profileHelper = require('../utils/profile-helper');
const sugar = require('sugar');
const inquirer = require('inquirer');
const getSkillList = require('../api/skill').getSkillList;
const CONSTANTS = require('../utils/constants');

const LIST_SKILL_PAGE_SIZE = 15;


module.exports = {
    createCommand: (commander) => {
        commander
            .command('clone')
            .description('clone an existing skill project on your computer')
            .option('-s, --skill-id <skill-id>', 'skill-id for the skill')
            .option('-p, --profile <profile>', 'ask cli profile')
            .option('--debug', 'ask cli debug mode')
            .option('-h, --help', 'output usage information', () => {
                console.log(CONSTANTS.COMMAND.CLONE.HELP_DESCRIPTION);
                process.exit(0);
            })
            .action(handle);

        function handle(options) {
            let profile = profileHelper.runtimeProfile(options.profile);

            if (!options.skillId) {
                chooseSkillProcess(profile, options.debug, (skillId) => {
                    singleSkillCloneProcess(skillId, profile, options.debug);
                });
            } else {
                // fallback to default process.
                singleSkillCloneProcess(options.skillId, profile, options.debug);
            }
        }
    }
};

function singleSkillCloneProcess(skillId, profile, doDebug) {
    cloneSkill.getSkill(skillId, profile, doDebug, (skillManifest) => {
        let skillInfo = parser.extractSkillInfo(skillManifest);
        if (!skillInfo) {
            return;
        }
        let projectPath = path.join(process.cwd(), skillInfo.skillName);
        let configPath = path.join(projectPath, '.ask', 'config');
        let skillPath = path.join(projectPath, 'skill.json');
        let modelPath = path.join(projectPath, 'models');
        let lambdaPath = path.join(projectPath, 'lambda');

        console.log('-------------------- Clone Skill Project --------------------');
        cloneProject.clone(projectPath, skillId, skillInfo, profile);
        cloneSkill.clone(skillPath, skillManifest, skillId, skillInfo);

        // For skills which contains 'custom', clone model first
        if (skillInfo.domainList && skillInfo.domainList.indexOf('custom') !== -1) {
            cloneModel.cloneModel(modelPath, skillId, skillInfo, profile, doDebug, () => {
                if (!skillInfo.hasLambdaFunction) {
                    return;
                }
                cloneLambda.clone(lambdaPath, skillInfo, profile, (err, listOfReOrgLambdaInfoObject) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    cloneLocalizing.localizing(skillPath, configPath, './lambda', listOfReOrgLambdaInfoObject, profile);
                });
            });
        } else {
            // For skills without 'custom' domain, directly go to lambda clone
            if (!skillInfo.hasLambdaFunction) {
                return;
            }
            cloneLambda.clone(lambdaPath, skillInfo, profile, (err, listOfReOrgLambdaInfoObject) => {
                if (err) {
                    console.error(err);
                    return;
                }
                cloneLocalizing.localizing(skillPath, configPath, './lambda', listOfReOrgLambdaInfoObject, profile);
            });
        }
    });
}

function chooseSkillProcess(profile, doDebug, callback) {
    getSkillList(profile, doDebug, (response) => {
        promptProcess(response.skills, (skillId) => {
            callback(skillId);
        });
    });
}

function promptProcess(skillList, callback) {
    const TITLE_MESSAGE = 'Skill Name  :  Skill Id';
    let sortedList = sortListByLastUpdated(skillList);
    sortedList.splice(0, 0, new inquirer.Separator());
    sortedList.splice(1, 0, new inquirer.Separator(TITLE_MESSAGE));
    sortedList.splice(2, 0, new inquirer.Separator());
    inquirer.prompt([{
        type: 'list',
        message: 'List of all your skills.',
        paginated: true,
        pageSize: LIST_SKILL_PAGE_SIZE,
        name: 'skill',
        choices: sortedList
    }]).then((answers) => {
        let skillId = answers.skill.match(/\[(.+)\]/)[1];
        callback(skillId);
    });
}

function sortListByLastUpdated(skillList) {
    let sortedList = skillList.sort((one, another) => {
        let dateOne = new sugar.Date(one.lastUpdated).raw.getTime();
        let dateAnother = new sugar.Date(another.lastUpdated).raw.getTime();
        return dateAnother - dateOne;
    });
    let result = sortedList.map((element) => {
        let name = findSkillDisplayingName(element.nameByLocale);
        return name + ': [' + element.skillId + ']';
    });
    return result;
}

function findSkillDisplayingName(info) {
    let name;
    if (info.hasOwnProperty('en_US')) {
        name = info.en_US;
    } else if (info.hasOwnProperty('en_GB')){
        name = info.en_GB;
    } else {
        name = info[Object.keys(info)[0]];
    }
    if (!name || name.length === 0) {
        console.error('Get skill name error. Skill name should not be empty.');
        return;
    }
    return name;
}
