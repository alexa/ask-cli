'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const jsonfile = require('jsonfile');
const fs = require('fs');

const template = require('../../lib/utils/template');

describe('utils skill template testing', () => {
    describe('# copy config', () => {
        beforeEach(() => {
            sinon.stub(jsonfile, 'writeFileSync');
        });

        afterEach(() => {
            jsonfile.writeFileSync.restore();
        });

        it('| use jsonfile to write config file', () => {
            template.copyConfig('path', '123', true);
            expect(jsonfile.writeFileSync.getCall(0).args[0]).equal('path');
            let testConfig = {
                deploy_settings: {
                    default: {
                        ask_profile: 'default',
                        skill_id: '123',
                        was_cloned: true
                    }
                }
            };
            expect(jsonfile.writeFileSync.getCall(0).args[1]).deep.equal(testConfig);
        });
    });

    describe('# copy model', () => {
        beforeEach(() => {
            sinon.stub(fs, 'readFileSync');
            sinon.stub(fs, 'writeFileSync');
        });

        afterEach(() => {
            fs.readFileSync.restore();
            fs.writeFileSync.restore();
        });
        it('| use fs to read and write model file', () => {
            let file = {};
            fs.readFileSync.returns(file);
            template.copyModel('path');
            expect(fs.writeFileSync.getCall(0).args[0]).equal('path');
            expect(fs.writeFileSync.getCall(0).args[1]).deep.equal(file);
        });
    });

    describe('# copy Lambda', () => {
        beforeEach(() => {
            sinon.stub(fs, 'readFileSync');
            sinon.stub(fs, 'writeFileSync');
        });

        afterEach(() => {
            fs.readFileSync.restore();
            fs.writeFileSync.restore();
        });

        it('| use fs to read and write Lambda folder', () => {
            template.copyLambda('path');
            expect(fs.readFileSync.callCount).equal(2);
            expect(fs.writeFileSync.callCount).equal(2);
        });
    });

    describe('# copy skill', () => {
        beforeEach(() => {
            sinon.stub(jsonfile, 'writeFileSync');
            sinon.stub(jsonfile, 'readFileSync');
        });

        afterEach(() => {
            jsonfile.writeFileSync.restore();
            jsonfile.readFileSync.restore();
        });

        it('| use jsonfile to read write skill file', () => {
            let skillSchema = {
                skillDefinition: {
                    multinationalPublishingInfo: {
                        publishingInfoByLocale: {
                            'en-US': {
                                name: ''
                            }
                        }
                    }
                }
            };
            jsonfile.readFileSync.returns(skillSchema);
            skillSchema.skillDefinition.multinationalPublishingInfo
                .publishingInfoByLocale['en-US'].name = 'name';
            template.copySkill('path', 'name');
            expect(jsonfile.writeFileSync.getCall(0).args[0]).equal('path');
            expect(jsonfile.writeFileSync.getCall(0).args[1]).deep.equal(skillSchema);
        });
    });
});
