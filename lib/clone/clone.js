'use strict';

const cloneProject = require('./clone-project');
const cloneSkill = require('./clone-skill');
const cloneLambda = require('./clone-lambda');
const parser = require('../utils/skill-parser');
const path = require('path');

module.exports = {
    createCommand: (commander) => {
        commander
            .command('clone')
            .description('clone Alexa skill project')
            .option('-s|--skill-id <skill-id>', 'pull skill project with skill-id')
            .option('--stage [stage]', 'pull skill with stage (optional)')
            .action(handle);

        function handle(options) {
            if (options.skillId) {
                cloneSkill.getSkill(options.skillId, options.stage, (skillSchema) => {
                    let skillName = parser.parseSkillName(skillSchema);
                    if (!skillName || !skillName.length) {
                        console.error('Get skill name error. Skill name should not be empty.');
                        return;
                    }
                    let skillType = parser.parseSkillType(skillSchema);
                    let lambdaArns = parser.parseLambdaWithSkillType(skillSchema, skillType);
                    let localeList = parser.parseLocaleList(skillSchema);
                    let projectPath = path.join(process.cwd(), skillName);
                    let lambdaPath = path.join(projectPath, 'lambda');

                    console.log('-------------------- Clone Skill Project --------------------');

                    cloneProject.clone(projectPath, options.skillId, skillName, skillType);

                    cloneSkill.clone(projectPath, options.skillId, skillName,
                        skillType, lambdaArns, localeList, skillSchema, () => {
                        cloneLambda.clone(lambdaPath, lambdaArns);
                    });
                });
            } else {
                console.warn('Please input required option: skill-id.');
            }
        }
    }
};
