const { expect } = require('chai');
const sinon = require('sinon');
const inquirer = require('inquirer');
const chalk = require('chalk');

const CONSTANTS = require('@src/utils/constants');
const ui = require('@src/commands/new/ui');

function validateInquirerConfig(stub, expectedConfig) {
    const { message, type, defaultValue, choices } = expectedConfig;
    expect(stub.message).equal(message);
    expect(stub.type).equal(type);
    if (defaultValue) {
        expect(stub.default).equal(defaultValue);
    }
    if (choices) {
        expect(stub.choices).deep.equal(choices);
    }
}

describe('Commands new - UI test', () => {
    const TEST_SKILL_NAME = 'skillName';
    const TEST_LOCALE = 'en-US';
    const TEST_REPO_NAME = 'repo';
    const TEST_FOLDER_NAME = 'folderName';
    const TEST_URL = `https://${TEST_REPO_NAME}.git?data=1`;
    const TEST_ERROR = 'error';
    const TEST_LANGUAGE = 'language';
    const TEST_TEMPLATE_NAME = 'templateName';
    const TEST_CONFIRMATION = 'confirmation';
    const TEST_DEPLOYMENT_OPTION_NAME = 'HOSTED_OPTION_NAME';
    const TEST_DEPLOYMENT_NAME = 'HOSTED_NAME';
    const TEST_TEMPLATES_MAP = {
        template1: {
            url: 'templateUrl1',
            description: 'templateDescription1'
        },
        template2: {
            url: 'templateUrl2'
        }
    };
    const TEST_DEPLOYMENT_MAP = {
        HOSTED: {
            OPTION_NAME: TEST_DEPLOYMENT_OPTION_NAME,
            NAME: TEST_DEPLOYMENT_NAME,
            DESCRIPTION: 'HOSTED_DESCRIPTION'
        },
        CFN: {
            OPTION_NAME: 'CFN_OPTION_NAME',
            NAME: 'CFN_NAME',
            DESCRIPTION: 'CFN_DESCRIPTION'
        }
    };
    const TEST_TEMPLATE_CHOICES = [
        `template1\n  ${chalk.gray('templateDescription1')}`,
        `template2\n  ${chalk.gray('')}`
    ];
    const TEST_DEPLOYMENT_CHOICES_WITH_SEP = [
        `${TEST_DEPLOYMENT_OPTION_NAME}\n  ${chalk.gray('HOSTED_DESCRIPTION')}`,
        `CFN_OPTION_NAME\n  ${chalk.gray('CFN_DESCRIPTION')}`,
        new inquirer.Separator(),
        ui.SKIP_DEPLOY_DELEGATE_SELECTION
    ];

    describe('# validate ui.getSkillName', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSkillName is set by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getSkillName(TEST_URL, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your skill name: ',
                    type: 'input',
                    default: TEST_REPO_NAME,
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| set defaultName as the default hosted skill name and return correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ skillName: CONSTANTS.HOSTED_SKILL.DEFAULT_SKILL_NAME });
            // call
            ui.getSkillName(null, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your skill name: ',
                    type: 'input',
                    default: TEST_REPO_NAME,
                });
                expect(err).equal(null);
                expect(response).equal(CONSTANTS.HOSTED_SKILL.DEFAULT_SKILL_NAME);
                done();
            });
        });

        it('| getSkillName is set by user and return correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ skillName: TEST_SKILL_NAME });
            // call
            ui.getSkillName(TEST_URL, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your skill name: ',
                    type: 'input',
                    default: TEST_REPO_NAME,
                });
                expect(err).equal(null);
                expect(response).equal(TEST_SKILL_NAME);
                done();
            });
        });

        it('| check the validate logic from inquirer and returns true', (done) => {
            // setup
            inquirer.prompt.resolves({ skillName: TEST_SKILL_NAME });
            // call
            ui.getSkillName(TEST_URL, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('    ')).equal('Skill name can\'t be empty.');
                done();
            });
        });

        it('| check the validate logic from inquirer and returns error', (done) => {
            // setup
            inquirer.prompt.resolves({ skillName: TEST_SKILL_NAME });
            // call
            ui.getSkillName(TEST_URL, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('input')).equal(true);
                done();
            });
        });
    });

    describe('# validate ui.getSkillLocale', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSkillLocale is set by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getSkillLocale((err, response) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| getSkillLocale is set by user and return correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ locale: TEST_LOCALE });
            // call
            ui.getSkillLocale((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal(TEST_LOCALE);
                done();
            });
        });
    });

    describe('# validate ui.getSkillDefaultRegion', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| getSkillDefaultRegion is set by user and inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getSkillDefaultRegion((err, response) => {
                // verify
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| getSkillDefaultRegion is set by user and return correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ region: 'us-east-1' });
            // call
            ui.getSkillDefaultRegion((err, response) => {
                // verify
                expect(err).equal(null);
                expect(response).equal('US_EAST_1');
                done();
            });
        });
    });

    describe('# validate ui.getProjectFolderName', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| project folder name is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ projectFolderName: TEST_FOLDER_NAME });
            // call
            ui.getProjectFolderName(TEST_REPO_NAME, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your folder name for the skill project (alphanumeric): ',
                    type: 'input',
                    default: TEST_REPO_NAME,
                });
                expect(err).equal(null);
                expect(response).equal(TEST_FOLDER_NAME);
                done();
            });
        });

        it('| project folder name is filtered correctly', (done) => {
            // setup
            const TEST_FOLDER_NAME_WITH_NON_ALPHANUMERIC = `${TEST_FOLDER_NAME}?/.%^&*`;
            inquirer.prompt.resolves({ projectFolderName: TEST_FOLDER_NAME_WITH_NON_ALPHANUMERIC });
            // call
            ui.getProjectFolderName(TEST_REPO_NAME, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your folder name for the skill project (alphanumeric): ',
                    type: 'input',
                    default: TEST_REPO_NAME,
                });
                expect(err).equal(null);
                expect(response).equal(TEST_FOLDER_NAME);
                done();
            });
        });

        it('| get project folder name throws error from inquirer', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getProjectFolderName(TEST_REPO_NAME, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please type in your folder name for the skill project (alphanumeric): ',
                    type: 'input',
                    default: TEST_REPO_NAME,
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| check the validate logic from inquirer and returns true', (done) => {
            // setup
            inquirer.prompt.resolves({ skillName: TEST_SKILL_NAME });
            // call
            ui.getProjectFolderName(TEST_REPO_NAME, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('  !?!**  '))
                    .equal('Project folder name should be consisted of alphanumeric character(s) plus "-" only.');
                done();
            });
        });

        it('| check the validate logic from inquirer and returns error', (done) => {
            // setup
            inquirer.prompt.resolves({ skillName: TEST_SKILL_NAME });
            // call
            ui.getProjectFolderName(TEST_REPO_NAME, () => {
                // verify
                expect(inquirer.prompt.args[0][0][0].validate('input')).equal(true);
                done();
            });
        });
    });

    describe('# validate ui.selectSkillCodeLanguage', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| language is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ language: TEST_LANGUAGE });
            // call
            ui.selectSkillCodeLanguage((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose the programming language you will use to code your skill: ',
                    type: 'list',
                    choices: Object.keys(CONSTANTS.TEMPLATES.LANGUAGE_MAP)
                });
                expect(err).equal(null);
                expect(response).equal(TEST_LANGUAGE);
                done();
            });
        });

        it('| get language throws error from inquirer', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.selectSkillCodeLanguage((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose the programming language you will use to code your skill: ',
                    type: 'list',
                    choices: Object.keys(CONSTANTS.TEMPLATES.LANGUAGE_MAP)
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });
    });

    describe('# validate ui.getTargetTemplateName', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| template name is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ templateName: TEST_TEMPLATE_NAME });
            // call
            ui.getTargetTemplateName(TEST_TEMPLATES_MAP, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose a template to start with: ',
                    type: 'list',
                    choices: TEST_TEMPLATE_CHOICES,
                    pageSize: 30
                });
                expect(inquirer.prompt.args[0][0][0].filter('a\nb')).equal('a');
                expect(err).equal(null);
                expect(response).equal(TEST_TEMPLATE_NAME);
                done();
            });
        });

        it('| get template name throws error from inquirer', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getTargetTemplateName(TEST_TEMPLATES_MAP, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose a template to start with: ',
                    type: 'list',
                    choices: TEST_TEMPLATE_CHOICES,
                    pageSize: 30
                });
                expect(inquirer.prompt.args[0][0][0].filter('a\nb')).equal('a');
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });
    });

    describe('# validate ui.confirmUsingUnofficialTemplate', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| confirmation entered by user is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ confirmation: TEST_CONFIRMATION });
            // call
            ui.confirmUsingUnofficialTemplate((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Would you like to continue download the skill template? ',
                    type: 'confirm',
                    default: false
                });
                expect(err).equal(null);
                expect(response).equal(TEST_CONFIRMATION);
                done();
            });
        });

        it('| get confirmation meets inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.confirmUsingUnofficialTemplate((err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Would you like to continue download the skill template? ',
                    type: 'confirm',
                    default: false
                });
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });
    });

    describe('# validate ui.getDeploymentType', () => {
        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| confirmation entered by user is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ deployDelegate: TEST_DEPLOYMENT_OPTION_NAME });
            // call
            ui.getDeploymentType(TEST_DEPLOYMENT_MAP, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose a method to host your skill\'s backend resources: ',
                    type: 'list',
                    choices: TEST_DEPLOYMENT_CHOICES_WITH_SEP
                });
                expect(inquirer.prompt.args[0][0][0].filter('a \n \n b')).equal('a ');
                expect(err).equal(null);
                expect(response).equal(TEST_DEPLOYMENT_NAME);
                done();
            });
        });

        it('| self-hosted confirmation entered by user is retrieved correctly', (done) => {
            // setup
            inquirer.prompt.resolves({ deployDelegate: ui.SKIP_DEPLOY_DELEGATE_SELECTION });
            // call
            ui.getDeploymentType(TEST_DEPLOYMENT_MAP, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose a method to host your skill\'s backend resources: ',
                    type: 'list',
                    choices: TEST_DEPLOYMENT_CHOICES_WITH_SEP
                });
                expect(inquirer.prompt.args[0][0][0].filter('a \n \n b')).equal('a ');
                expect(err).equal(undefined);
                expect(response).equal(undefined);
                done();
            });
        });

        it('| get confirmation meets inquirer throws exception', (done) => {
            // setup
            inquirer.prompt.rejects(new Error(TEST_ERROR));
            // call
            ui.getDeploymentType(TEST_DEPLOYMENT_MAP, (err, response) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Choose a method to host your skill\'s backend resources: ',
                    type: 'list',
                    choices: TEST_DEPLOYMENT_CHOICES_WITH_SEP
                });
                expect(inquirer.prompt.args[0][0][0].filter('a \n \n b')).equal('a ');
                expect(err.message).equal(TEST_ERROR);
                expect(response).equal(undefined);
                done();
            });
        });
    });
});
