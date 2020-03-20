const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');
const yaml = require('@src/model/yaml-parser');

const DialogReplayFile = require('@src/model/dialog-replay-file');

describe('Model test - dialog replay file test', () => {
    let dialogReplayFile;
    const TEST_ERROR = 'error';
    const DIALOG_FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'dialog');
    const DIALOG_REPLAY_FILE_JSON_PATH = path.join(DIALOG_FIXTURE_PATH, 'dialog-replay-file.json');
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const NOT_EXISTING_DIALOG_REPLAY_FILE_PATH = path.join(FIXTURE_PATH, 'out-of-noWhere.json');
    const INVALID_JSON_DIALOG_REPLAY_FILE_PATH = path.join(FIXTURE_PATH, 'invalid-json.json');

    describe('# test constructor', () => {
        it('| constructor with non-existing file expect to catch error', () => {
            try {
                // setup & call
                dialogReplayFile = new DialogReplayFile(NOT_EXISTING_DIALOG_REPLAY_FILE_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                // verify
                const expectedError = `File ${NOT_EXISTING_DIALOG_REPLAY_FILE_PATH} not exists.`;
                expect(err.endsWith(expectedError)).equal(true);
            }
        });

        it('| constructor with existing JSON file reads successfully', () => {
            // setup
            const TEST_CONTENT = JSON.parse(fs.readFileSync(DIALOG_REPLAY_FILE_JSON_PATH));

            // call
            dialogReplayFile = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);

            // verify
            expect(dialogReplayFile.content).deep.equal(TEST_CONTENT);
        });

        it('| make sure DialogReplayFile class is singleton', () => {
            // setup & call
            const dialogConfig1 = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);
            const dialogConfig2 = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);

            // verify
            expect(dialogConfig1 === dialogConfig2);
        });

        afterEach(() => {
            dialogReplayFile = null;
        });
    });

    describe('# test getter methods', () => {
        const TEST_CONTENT = JSON.parse(fs.readFileSync(DIALOG_REPLAY_FILE_JSON_PATH));

        before(() => {
            dialogReplayFile = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);
        });

        it('| test getSkillId', () => {
            // setup & call
            const res = dialogReplayFile.getSkillId();

            // verify
            expect(res).equal(TEST_CONTENT.skillId);
        });

        it('| test getLocale', () => {
            // setup & call
            const res = dialogReplayFile.getLocale();

            // verify
            expect(res).equal(TEST_CONTENT.locale);
        });

        it('| test getType', () => {
            // setup & call
            const res = dialogReplayFile.getType();

            // verify
            expect(res).equal(TEST_CONTENT.type);
        });

        it('| test getUserInput', () => {
            // setup & call
            const res = dialogReplayFile.getUserInput();

            // verify
            expect(res).deep.equal(TEST_CONTENT.userInput);
        });

        after(() => {
            dialogReplayFile = null;
        });
    });

    describe('# test setter methods', () => {
        before(() => {
            dialogReplayFile = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);
        });

        after(() => {
            dialogReplayFile = null;
        });

        it('| test setSkillId', () => {
            // setup
            const TEST_SKILLID = 'TEST_SKILLID';
            dialogReplayFile.setSkillId(TEST_SKILLID);

            // call
            const res = dialogReplayFile.getSkillId();

            // verify
            expect(res).equal(TEST_SKILLID);
        });

        it('| test setLocale', () => {
            // setup
            const TEST_LOCALE = 'TEST_LOCALE';
            dialogReplayFile.setLocale(TEST_LOCALE);

            // call
            const res = dialogReplayFile.getLocale();

            // verify
            expect(res).equal(TEST_LOCALE);
        });

        it('| test setType', () => {
            // setup
            const TEST_TYPE = 'TEST_TYPE';
            dialogReplayFile.setType(TEST_TYPE);

            // call
            const res = dialogReplayFile.getType();

            // verify
            expect(res).equal(TEST_TYPE);
        });

        it('| test setUserInput', () => {
            // setup
            const TEST_USER_INPUT = ['TEST', 'USER', 'INPUT'];
            dialogReplayFile.setUserInput(TEST_USER_INPUT);

            // call
            const res = dialogReplayFile.getUserInput();

            // verify
            expect(res).deep.equal(TEST_USER_INPUT);
        });

        describe('# test read file content', () => {
            afterEach(() => {
                dialogReplayFile = null;
                sinon.restore();
            });

            it('| throws error if input file path does not exist', () => {
                try {
                    // setup and call
                    dialogReplayFile = new DialogReplayFile(NOT_EXISTING_DIALOG_REPLAY_FILE_PATH);
                } catch (error) {
                    // verify
                    expect(error).equal(`Failed to parse .json file ${NOT_EXISTING_DIALOG_REPLAY_FILE_PATH}.`
                    + `\nFile ${NOT_EXISTING_DIALOG_REPLAY_FILE_PATH} not exists.`);
                }
            });

            it('| throws error if READ permission is not granted', () => {
                // setup
                sinon.stub(fs, 'accessSync').throws(new Error(TEST_ERROR));
                try {
                    // call
                    dialogReplayFile = new DialogReplayFile(INVALID_JSON_DIALOG_REPLAY_FILE_PATH);
                } catch (error) {
                    // verify
                    expect(error).equal(`Failed to parse .json file ${INVALID_JSON_DIALOG_REPLAY_FILE_PATH}.`
                    + `\n${TEST_ERROR}`);
                }
            });

            it('| test JSON file path extension', () => {
                // setup
                sinon.stub(fs, 'readFileSync').returns('{"skillId":"amzn1.ask.skill.1234567890"}');

                // call
                dialogReplayFile = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);

                // verify
                expect(dialogReplayFile.content).deep.equal({
                    skillId: 'amzn1.ask.skill.1234567890'
                });
            });

            it('| test YAML file path extension', () => {
                // setup
                const YAML_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.yaml');
                const yamlStub = sinon.stub(yaml, 'load');

                // call
                dialogReplayFile = new DialogReplayFile(YAML_FILE_PATH);

                // verify
                expect(yamlStub.calledOnce).equal(true);
            });

            it('| test YML file path extension', () => {
                // setup
                const YML_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.yml');
                const ymlStub = sinon.stub(yaml, 'load');

                // call
                dialogReplayFile = new DialogReplayFile(YML_FILE_PATH);

                // verify
                expect(ymlStub.calledOnce).equal(true);
            });

            it(' throws error if neither JSON nor YAML/YML file path extension', () => {
                // setup
                sinon.stub(DialogReplayFile.prototype, 'doesFileExist');
                sinon.stub(fs, 'accessSync');
                const UNSUPPORTED_EXTENSION_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.random');

                try {
                    // call
                    dialogReplayFile = new DialogReplayFile(UNSUPPORTED_EXTENSION_FILE_PATH);
                } catch (error) {
                    // verify
                    expect(error).equal(`Failed to parse .random file ${UNSUPPORTED_EXTENSION_FILE_PATH}.`
                    + '\nASK CLI does not support this file type.');
                }
            });
        });

        describe('# test write file content', () => {
            beforeEach(() => {
                sinon.stub(DialogReplayFile.prototype, 'readFileContent').returns({});
            });

            afterEach(() => {
                dialogReplayFile = null;
                sinon.restore();
            });

            it('| throws error if input file path does not exist', () => {
                // setup
                dialogReplayFile = new DialogReplayFile(NOT_EXISTING_DIALOG_REPLAY_FILE_PATH);

                try {
                    // call
                    dialogReplayFile.writeContentToFile('', NOT_EXISTING_DIALOG_REPLAY_FILE_PATH);
                } catch (error) {
                    // verify
                    expect(error).equal(`Failed to write to file ${NOT_EXISTING_DIALOG_REPLAY_FILE_PATH}.`
                    + `\nFile ${NOT_EXISTING_DIALOG_REPLAY_FILE_PATH} not exists.`);
                }
            });

            it('| throws error if WRITE permission is not granted', () => {
                // setup
                sinon.stub(fs, 'accessSync').throws(new Error(TEST_ERROR));
                dialogReplayFile = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);

                try {
                    // call
                    dialogReplayFile.writeContentToFile('', DIALOG_REPLAY_FILE_JSON_PATH);
                } catch (error) {
                    // verify
                    expect(error).equal(`Failed to write to file ${DIALOG_REPLAY_FILE_JSON_PATH}.`
                    + `\n${TEST_ERROR}`);
                }
            });

            it('| test JSON file path extension', () => {
                // setup
                const writeFileStub = sinon.stub(fs, 'writeFileSync');
                dialogReplayFile = new DialogReplayFile(DIALOG_REPLAY_FILE_JSON_PATH);

                // call
                dialogReplayFile.writeContentToFile('', DIALOG_REPLAY_FILE_JSON_PATH);

                // verify
                expect(writeFileStub.calledOnce).equal(true);
            });

            it('| test YAML file path extension', () => {
                // setup
                const YAML_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.yaml');
                const yamlStub = sinon.stub(yaml, 'dump');

                // call
                dialogReplayFile = new DialogReplayFile(YAML_FILE_PATH);
                dialogReplayFile.writeContentToFile('', YAML_FILE_PATH);

                // verify
                expect(yamlStub.calledOnce).equal(true);
            });

            it('| test YML file path extension', () => {
                // setup
                const YML_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.yml');
                const ymlStub = sinon.stub(yaml, 'dump');

                // call
                dialogReplayFile = new DialogReplayFile(YML_FILE_PATH);
                dialogReplayFile.writeContentToFile('', YML_FILE_PATH);

                // verify
                expect(ymlStub.calledOnce).equal(true);
            });

            it(' throws error if neither JSON nor YAML/YML file path extension', () => {
                // setup
                sinon.stub(DialogReplayFile.prototype, 'doesFileExist');
                sinon.stub(fs, 'accessSync');
                const UNSUPPORTED_EXTENSION_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.random');

                try {
                    // call
                    dialogReplayFile = new DialogReplayFile(UNSUPPORTED_EXTENSION_FILE_PATH);
                    dialogReplayFile.writeContentToFile('', UNSUPPORTED_EXTENSION_FILE_PATH);
                } catch (error) {
                    // verify
                    expect(error).equal(`Failed to write to file ${UNSUPPORTED_EXTENSION_FILE_PATH}.`
                    + '\nASK CLI does not support this file type.');
                }
            });
        });
    });
});
