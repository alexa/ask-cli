'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const profileHelper = require('../../../lib/utils/profile-helper');
const jsonUtility = require('../../../lib/utils/json-utility');
const fs = require('fs');

// TODO provide more skill schema samples

describe('utils profile helper testing', () => {
    describe('# get aws profile', () => {
        it('| return the aws profile name', () => {
            let askProfile = 'test';
            sinon.stub(jsonUtility, 'getProperty');
            jsonUtility.getProperty.withArgs(sinon.match.any, ['profiles', askProfile, 'aws_profile']).returns('success');
            expect(profileHelper.getAWSProfile(askProfile)).equal('success');
        });
    });

    describe('# check aws profile exists', () => {
        const ini =
            '[test_success]\naws_access_key_id = ABC\naws_secret_access_key = ABC';
        beforeEach(() => {
            sinon.stub(fs, 'readFileSync');

        });
        afterEach(() => {
            fs.readFileSync.restore();
        });

        it('| have aws credential file and profile exists', () => {
            fs.readFileSync.withArgs(sinon.match.any, sinon.match.any).returns(ini);
            let input = 'test_success';
            expect(profileHelper.checkAWSProfileExist(input)).equal(true);
        });
        
        it('| have aws credential file and profile does not exist', () => {
            fs.readFileSync.withArgs(sinon.match.any, sinon.match.any).returns(ini);
            let input = 'test_fail';
            expect(profileHelper.checkAWSProfileExist(input)).equal(false);
        });

        it('| no aws credential file, error generated', () => {
            fs.readFileSync.withArgs(sinon.match.any, sinon.match.any).throws();
            sinon.stub(process, 'exit');
            sinon.stub(console, 'error');
            profileHelper.checkAWSProfileExist('any');
            expect(process.exit.calledOnce).to.be.true;
            expect(console.error.calledOnce).to.be.true;
            process.exit.restore();
            console.error.restore();
        });
    });

    describe('# check ask profile exists', () => {
        const askProfileObject = {
            profiles: {
                test_success: {}
            }
        };
        beforeEach(() => {
            sinon.stub(jsonUtility, 'read');
            jsonUtility.read.withArgs(sinon.match.any).returns(askProfileObject);

        });
        afterEach(() => {
            jsonUtility.read.restore();
        });
        it('| has profile', () => {
            let input = 'test_success';
            expect(profileHelper.checkASKProfileExist(input)).to.be.true;
        });

        it('| invalid profile', () => {
            let input = 'test_fail';
            expect(profileHelper.checkASKProfileExist(input)).to.be.false;
        });
    });

    describe('# setupProfile', () => {
        it('| write to profile', () => {
            let emptyCallback = () => {};
            sinon.stub(jsonUtility, 'writeToProperty');
            profileHelper.setupProfile('aws', 'ask', emptyCallback);
            expect(jsonUtility.writeToProperty.calledOnce).to.be.true;
            jsonUtility.writeToProperty.restore();
        });
    });

    describe('# deleteProfile', () => {
        it('| delete the profile from config', () => {
            sinon.stub(jsonUtility, 'deleteProperty');
            profileHelper.deleteProfile('test');
            expect(jsonUtility.deleteProperty.calledOnce).to.be.true;
            jsonUtility.deleteProperty.restore();
        });
    });

    describe('# getListProfile', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync');
            sinon.stub(jsonUtility, 'read');
            fs.existsSync.withArgs(sinon.match.any).returns(true);
        });
        afterEach(() => {
            fs.existsSync.restore();
            jsonUtility.read.restore();
        });
        it('| no askConfig file, return nothing', () => {
            fs.existsSync.withArgs(sinon.match.any).returns(false);
            expect(profileHelper.getListProfile()).to.be.a('null');
        });

        it('| return null if no profile inside the config file', () => {
            jsonUtility.read.withArgs(sinon.match.any).returns({});
            expect(profileHelper.getListProfile()).to.be.a('null');
        });

        it('| return null if profile object is empty inside the config file', () => {
            jsonUtility.read.withArgs(sinon.match.any).returns({profiles: {}});
            expect(profileHelper.getListProfile()).to.be.a('null');
        });

        it('| get the list of profile', () => {
            let input = {
                profiles: {
                    ask_test: {
                        aws_profile: 'aws_test'
                    }
                }
            };
            let expected_result = [{
                'askProfile': 'ask_test',
                'awsProfile': 'aws_test'
            }];
            jsonUtility.read.withArgs(sinon.match.any).returns(input);
            expect(profileHelper.getListProfile()).to.eql(expected_result);
        });
    });

    describe('# displayProfile', () => {
        beforeEach(() => {
            sinon.stub(fs, 'existsSync');
            sinon.stub(jsonUtility, 'read');
            fs.existsSync.withArgs(sinon.match.any).returns(true);
            sinon.stub(console, 'warn');
            sinon.stub(console, 'log');
        });
        afterEach(() => {
            fs.existsSync.restore();
            jsonUtility.read.restore();
            console.warn.restore();
            console.log.restore();
        });

        it('| return warning if no profile list', () => {
            let input = {};
            jsonUtility.read.withArgs(sinon.match.any).returns(input);
            profileHelper.displayProfile();
            expect(console.warn.calledOnce).to.be.true;
            expect(console.log.called).to.be.false;
        });

        it('| print out the list', () => {
            let input = {
                profiles: {
                    ask_test: {
                        aws_profile: 'aws_test'
                    }
                }
            };
            jsonUtility.read.withArgs(sinon.match.any).returns(input);
            profileHelper.displayProfile();
            expect(console.log.calledTwice).to.be.true;
            expect(console.warn.called).to.be.false;
        });
    });

    describe('# stringFormatter', () => {
        it('| return null if not profile list', () => {
            expect(profileHelper.stringFormatter()).to.be.a('null');
        });

        it('| return null if profile list is empty', () => {
            expect(profileHelper.stringFormatter([])).to.be.a('null');
        });

        it('| return formatted profile list with no aws profile', () => {
            let input = [{
                'askProfile': 'ask_test',
                'awsProfile': null
            }];
            let expect_result = ['[ask_test]                ** NULL **'];
            expect(profileHelper.stringFormatter(input)).to.eql(expect_result);
        });

        it('| return formatted profile list with aws profile', () => {
            let input = [{
                'askProfile': 'ask_test',
                'awsProfile': 'aws_test'
            }];
            let expect_result = ['[ask_test]                "aws_test"'];
            expect(profileHelper.stringFormatter(input)).to.eql(expect_result);

        });
    });

    describe('# askProfileSyntaxValidation', () => {
        it('| return true if the input string only contains [0-9a-zA-Z-_]', () => {
            let input = '0-9a-zA-Z-_';
            expect(profileHelper.askProfileSyntaxValidation(input)).to.be.true;
        });

        it('| return false if the input is empty', () => {
            let input = '';
            expect(profileHelper.askProfileSyntaxValidation(input)).to.be.false;
        });

        it('| return false if the input is invalid', () => {
            let input = 'kong ge';
            expect(profileHelper.askProfileSyntaxValidation(input)).to.be.false;
        })
    });
});
