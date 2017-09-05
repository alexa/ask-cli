'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const skillSchema = require('../fixture/skill.json');
const skillParser = require('../../lib/utils/skill-parser');

// TODO provide more skill schema samples

describe('utils skill parse testing', () => {
    describe('# extractSkillInfo', () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();

            sandbox.stub(skillParser, 'parseSkillName');
            sandbox.stub(skillParser, 'parseLambdaInfo', () => {
                return aws;
            });
            sandbox.stub(aws, 'Lambda', () => {
                return lambda;
            });
            sandbox.stub(lambda, 'listFunctions');
            sandbox.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sandbox.restore();
        });

    });


    //
    // describe('# parse skill name', () => {
    //     it('| able to parse out the skill name', () => {
    //         expect(skillParser.parseSkillName(skillSchema)).equal('custom_skill');
    //     });
    // });

    describe('# verify if skill name is valid', () => {
        it('| return true for these valid skill names', () => {
            expect(skillParser.isSkillNameValid('skill')).equal(true);
            expect(skillParser.isSkillNameValid('SkiLL')).equal(true);
            expect(skillParser.isSkillNameValid('SKILL')).equal(true);
            expect(skillParser.isSkillNameValid('Skill12580')).equal(true);
            expect(skillParser.isSkillNameValid('skill_12580')).equal(true);
            expect(skillParser.isSkillNameValid('skill-12580')).equal(true);
            expect(skillParser.isSkillNameValid('--------')).equal(true);
        });

        it('| return false for these invalid skill names', () => {
            expect(skillParser.isSkillNameValid('s k i l l')).equal(false);
            expect(skillParser.isSkillNameValid('skill!@#$%()')).equal(false);
            expect(skillParser.isSkillNameValid('=========')).equal(false);
        });
    });

    // describe('# set Lambda ARNs with Lambda functions', () => {
    //     let customLambda, smarthomeLambda;
    //
    //     before(() => {
    //         customLambda = {
    //             custom: 'custom'
    //         };
    //         smarthomeLambda = {
    //             smarthome: 'smarthome'
    //         };
    //     });
    //
    //     it('| set Lambda ARNs with correct Lambda ARNs', () => {
    //         let result = skillSchema;
    //         result.skillDefinition.customInteractionModelInfo.endpointsByRegion.
    //             NA.url = 'custom';
    //         expect(parser.setLambdaWithArns(skillSchema, customLambda)).deep.equal(result);
    //     });
    // });
});
