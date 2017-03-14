'use strict';

const jsonfile = require('jsonfile');
const fs = require('fs');
const path = require('path');

module.exports = {
    copyConfig: (configPath, skillId, isCloned) => {
        let config = {
            deploy_settings: {
                default: {
                    ask_profile: 'default',
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
        let skillSchema = jsonfile.readFileSync(path.join(__dirname, '..', 'template', 'skill.json'));
        skillSchema.skillDefinition.multinationalPublishingInfo
            .publishingInfoByLocale['en-US'].name = skillName;
        jsonfile.writeFileSync(skillPath, skillSchema, {spaces: 2});
    }
};
