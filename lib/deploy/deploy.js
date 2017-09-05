'use strict';

const path = require('path');
const fs = require('fs');
const profileHelper = require('../utils/profile-helper');
const skillSchemaProcessor = require('./skill-schema-pocessor');
const deployLocalizing = require('./deploy-localizing');
const deploySkill = require('./deploy-skill');
const deployModel = require('./deploy-model');
const deployLambda = require('./deploy-lambda');
const CONSTANTS = require('../utils/constants');


// Public
module.exports = {
    createCommand: (commander) => {
        commander
            .command('deploy')
            .description('deploy a skill to your developer account')
            .option('--no-wait', 'asynchronous model deployment', {isDefault: true})
            .option('-t, --target <target>', 'deploy "lambda", "model", "skill" or "all"')
            .option('-p, --profile <profile>', 'ask cli profile')
            .option('--debug', 'ask cli debug mode')
            .option('-h, --help', 'output usage information', () => {
                console.log(CONSTANTS.COMMAND.DEPLOY.HELP_DESCRIPTION);
                process.exit(0);
            })
            .action(handle);

        function handle(options) {
            let currentDir = process.cwd();
            let target = options.target;
            let isWaiting = options.wait;
            let profile = profileHelper.runtimeProfile(options.profile);

            if (isWaiting === undefined) {
                isWaiting = true;
            }
            if (target) {
                target = target.toLowerCase();
            }
            if (target && ['all', 'lambda', 'skill', 'model'].indexOf(target) === -1) {
                console.warn('Target not recognized. ' +
                    'Options can only be "all", "lambda", "skill" and "model".');
                return;
            }
            let skillFile = path.join(currentDir, 'skill.json');
            if (!fs.existsSync(skillFile)) {
                console.warn("Can't find skill.json in current working directory.");
                return;
            }
            // TODO config should not be the throttling for deploy. We should think about creating config when config not existed.
            let projectConfigFile = path.join(currentDir, '.ask', 'config');
            if (!fs.existsSync(projectConfigFile)) {
                console.warn('Failed to deploy. ' +
                    'Please ensure current working directory is the root of your skill project.');
                return;
            }
            skillSchemaProcessor.parseSkill(projectConfigFile, skillFile, profile, (preprocessedSkillSchema, skillInfo, skillId) => {
                if (!target || target === 'all') {
                    deploySkill.deploySkill(skillId, preprocessedSkillSchema, skillInfo, profile, options.debug, (skillIdFromDeploySkill) => {
                        deployModel.deployModel(skillIdFromDeploySkill, skillInfo, isWaiting, profile, options.debug, () => {
                            deployLambda.deployLambda(skillIdFromDeploySkill, skillInfo, profile, (generatedLambdaList) => {
                                if (!generatedLambdaList || generatedLambdaList.length === 0) {
                                    return;
                                }
                                deployLocalizing.localizingCreatedLambdaARN(generatedLambdaList, projectConfigFile, profile);
                                let updatedSkillSchema = skillSchemaProcessor.updateSkillSchemaWithLambdaCreation(
                                    generatedLambdaList, preprocessedSkillSchema);
                                deploySkill.updateSkill(skillIdFromDeploySkill, updatedSkillSchema, profile, options.debug, () => {
                                    deploySkill.checkSkillStatus(skillIdFromDeploySkill, profile, options.debug, (status) => {
                                        if(status !== 'SUCCESSFUL') {
                                            console.warn('[WARNING]: skill status ' + status);
                                        }
                                    });
                                });
                            });
                        });
                    });
                } else if (target === 'lambda') {
                    deployLambda.deployLambda(skillId, skillInfo, profile, (generatedLambdaList) => {
                        deployLocalizing.localizingCreatedLambdaARN(generatedLambdaList, projectConfigFile, profile);
                    });
                } else if (target === 'skill') {
                    deploySkill.deploySkill(skillId, preprocessedSkillSchema, skillInfo, profile, options.debug);
                } else if (target === 'model') {
                    if (skillInfo.domainList.indexOf('custom') === -1) {
                        console.error('No model need to be deployed.');
                        return;
                    }
                    deployModel.deployModel(skillId, skillInfo, preprocessedSkillSchema, isWaiting, profile, options.debug);
                }
            });
        }
    }
};
