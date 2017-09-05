'use strict';

const jsonfile = require('jsonfile');
const fs = require('fs');
const path = require('path');
const jsonUtility = require('./json-utility');

module.exports = {
    copyConfig: (configPath, skillId, isCloned, profile) => {
        let config = {
            deploy_settings: {
                [profile] : {
                    skill_id: skillId || '',
                    was_cloned: isCloned ? true : false
                }
            }
        };
        jsonfile.writeFileSync(configPath, config, {spaces: 2});
    },
    copyModel: (modelPath) => {
        let file = fs.readFileSync(path.join(__dirname, '..', 'template', 'models', 'en-US.json'));
        fs.writeFileSync(modelPath, file);
    },
    copyLambda: (lambdaPath) => {
        let indexPath = path.join(lambdaPath, 'index.js');
        let packagePath = path.join(lambdaPath, 'package.json');
        let index = fs.readFileSync(path.join(__dirname, '..', 'template', 'lambda', 'custom', 'index.js'));
        fs.writeFileSync(indexPath, index);
        let packageJson = fs.readFileSync(path.join(__dirname, '..', 'template', 'lambda', 'custom', 'package.json'));
        fs.writeFileSync(packagePath, packageJson);
    },
    copySkill: (skillPath, skillName) => {
        let skillManifest = jsonfile.readFileSync(path.join(__dirname, '..', 'template', 'skill.json'));
        skillManifest.skillManifest.publishingInformation.locales['en-US'].name = skillName;
        jsonfile.writeFileSync(skillPath, skillManifest, {spaces: 2});
    },
    insertLambda: (lambdaName, configFilePath, profile) => {
        let submitReadyLambdaName = 'ask-custom-' + lambdaName + '-' + profile;
        let mergeObject =
            {
                skillManifest: {
                    apis: {
                        custom: {
                            endpoint: {
                                uri: submitReadyLambdaName
                            }
                        }
                    }
                }
            };
        let insertPath = ['deploy_settings', profile, 'merge'];
        jsonUtility.writeToProperty(configFilePath, insertPath, mergeObject);
    }
};
