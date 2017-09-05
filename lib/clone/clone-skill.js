'use strict';

const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const jsonfile = require('jsonfile');

// Public
module.exports = {
    getSkill: (skillId, profile, doDebug, callback) => {
        apiWrapper.callGetSkill(skillId, profile, doDebug, (data) => {
            let skillSchema = tools.convertDataToJsonObject(data);
            if (skillSchema) {
                callback(skillSchema);
            }
        });
    },
    clone: (skillPath, skillSchema, skillId, skillInfo) => {
        jsonfile.writeFileSync(skillPath, skillSchema, {spaces: 2});
        console.log('Skill schema for ' + skillInfo.skillName + ' created at\n' +
            '    ./' + skillInfo.skillName + '/skill.json\n');
    }
};
