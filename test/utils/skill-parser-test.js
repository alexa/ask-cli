'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const jsonfile = require('jsonfile');
const fs = require('fs');

const skillSchema = require('../fixture/skill.json');
const parser = require('../../lib/utils/skill-parser');

// TODO provide more skill schema samples

describe('utils skill parser testing', () => {
    describe('# parse skill name', () => {
        it('| able to parse out the skill name', () => {
            expect(parser.parseSkillName(skillSchema)).equal('custom_skill');
        });
    });

    describe('# parse skill type', () => {
        it('| able to parse out the skill type', () => {
            expect(parser.parseSkillType(skillSchema)).equal('custom');
        });
    });

    describe('# parse Lambda with diffrent types of skill', () => {
        it('| parse Lambda with Flash Briefing skill', () => {
            expect(parser.parseLambdaWithSkillType(skillSchema, 'flashbriefing')).equal(null);
        });

        it('| parse Lambda with Custom skill', () => {
            let lambdaArn = {
                custom: 'lambda ARN'
            };
            let result = parser.parseLambdaWithSkillType(skillSchema, 'custom');
            expect(result).deep.equal(lambdaArn);
        });

        it('| parse Lambda with SmartHome skill', () => {
            sinon.stub(console, 'log');
            parser.parseLambdaWithSkillType(skillSchema, 'smarthome');
            expect(console.log.getCall(0).args[0]).equal(
                'The property "smartHomeInfo" does not exist.'
            );
            console.log.restore();
        });
    });

    describe('# parse locale list', () => {
        it('| get correct array of locale', () => {
            expect(parser.parseLocaleList(skillSchema)).deep.equal(['en-US']);
        });
    });

    describe('# verify if skill name is valid', () => {
        it('| valid skill name', () => {
            expect(parser.isSkillNameValid('skill')).equal(true);
            expect(parser.isSkillNameValid('SkiLL')).equal(true);
            expect(parser.isSkillNameValid('SKILL')).equal(true);
            expect(parser.isSkillNameValid('Skill12580')).equal(true);
            expect(parser.isSkillNameValid('skill_12580')).equal(true);
            expect(parser.isSkillNameValid('skill-12580')).equal(true);
            expect(parser.isSkillNameValid('--------')).equal(true);
        });

        it('| invalid skill name', () => {
            expect(parser.isSkillNameValid('s k i l l')).equal(false);
            expect(parser.isSkillNameValid('skill!@#$%^&*()')).equal(false);
            expect(parser.isSkillNameValid('=========')).equal(false);
        });
    });

    describe('# set Lambda ARNs with Lambda functions', () => {
        let customLambda, smarthomeLambda;

        before(() => {
            customLambda = {
                custom: 'custom'
            };
            smarthomeLambda = {
                smarthome: 'smarthome'
            };
        });

        it('| set Lambda ARNs with correct Lambda ARNs', () => {
            let result = skillSchema;
            result.skillDefinition.customInteractionModelInfo.endpointsByRegion.
                NA.url = 'custom';
            expect(parser.setLambdaWithArns(skillSchema, customLambda)).deep.equal(result);
        });
    });
});
