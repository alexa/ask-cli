const { expect } = require('chai');
const sinon = require('sinon');
const commander = require('commander');
const path = require('path');

const { AbstractCommand } = require('@src/commands/abstract-command');
const AppConfig = require('@src/model/app-config');
const metricClient = require('@src/utils/metrics');


describe('Command test - AbstractCommand class', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const APP_CONFIG_NO_PROFILES_PATH = path.join(FIXTURE_PATH, 'app-config-no-profiles.json');

    describe('# Command class constructor', () => {
        const mockOptionModel = {
            'foo-option': {
                name: 'foo-option',
                description: 'foo option',
                alias: 'f',
                stringInput: 'REQUIRED'
            },
            'bar-option': {
                name: 'bar-option',
                description: 'bar option',
                alias: 'b',
                stringInput: 'REQUIRED'
            },
            'another-bar-option': {
                name: 'another-bar-option',
                description: 'another bar option',
                alias: 'a',
                stringInput: 'OPTIONAL'
            },
            'baz-option': {
                name: 'baz-option',
                description: 'baz option',
                alias: 'z',
                stringInput: 'NONE'
            }
        };

        let mockProcessExit;
        let mockConsoleError;

        beforeEach(() => {
            sinon.stub(path, 'join').returns(APP_CONFIG_NO_PROFILES_PATH);
            mockProcessExit = sinon.stub(process, 'exit');
            mockConsoleError = sinon.stub(console, 'error');
            sinon.stub(metricClient, 'sendData').resolves();
        });

        it('| should be able to register command', async () => {
            class MockCommand extends AbstractCommand {
                constructor(optionModel, handle) {
                    super(optionModel);
                    this.handle = handle;
                }

                name() {
                    return 'foo';
                }

                description() {
                    return 'foo description';
                }

                requiredOptions() {
                    return ['foo-option'];
                }

                optionalOptions() {
                    return ['bar-option', 'another-bar-option', 'baz-option'];
                }
            }

            const mockCommand = new MockCommand(mockOptionModel, (options, cb) => {
                expect(options._name).eq('foo');
                expect(options._description).eq('foo description');
                expect(options.fooOption).eq('foo');
                expect(options.barOption).eq('bar');
                expect(options.anotherBarOption).eq(true);
                expect(options.bazOption).eq(true);
                cb();
            });

            mockCommand.createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'foo', '-f', 'foo', '-b', 'bar', '-a', '-z']);
        });

        it('| should be able to register command without any option', async () => {
            class NoOptionCommand extends AbstractCommand {
                constructor(optionModel, handle) {
                    super(optionModel);
                    this.handle = handle;
                }

                name() {
                    return 'empty-option';
                }

                description() {
                    return 'empty-option description';
                }
            }

            const mockCommand = new NoOptionCommand(mockOptionModel, (options, cb) => {
                expect(options._name).eq('empty-option');
                expect(options._description).eq('empty-option description');
                expect(options.options).deep.eq([]);
                cb();
            });

            mockCommand.createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'empty-option']);
        });

        it('| should throw an error if the command did not override any abstract function', async () => {
            class CommandWithoutName extends AbstractCommand {
                description() {
                    return 'foo description';
                }

                handle() {}
            }

            class CommandWithoutDescription extends AbstractCommand {
                name() {
                    return 'badCommand';
                }

                handle() {}
            }

            let counter = 0;
            mockProcessExit.callsFake(() => {
                counter++;
                if (counter < 2) {
                    return;
                }

                expect(mockConsoleError.args[0][0]).include('[Fatal]: Unimplemented abstract function: name()!');
                expect(mockConsoleError.args[1][0]).include('[Fatal]: Unimplemented abstract function: description()!');
            });

            new CommandWithoutName({}).createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'badCommand']);
            new CommandWithoutDescription({}).createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'badCommand']);
        });

        it('| should throw an error when no option model is found given option name', async (done) => {
            class MockCommand extends AbstractCommand {
                constructor(handle) {
                    super(null);
                    this.handle = handle;
                }

                name() {
                    return 'mockCommandWithNoOptionModel';
                }

                description() {
                    return 'foo description';
                }

                requiredOptions() {
                    return ['foo-option'];
                }

                optionalOptions() {
                    return ['bar-option', 'another-bar-option', 'baz-option'];
                }
            }

            mockProcessExit.callsFake(() => {
                expect(mockConsoleError.args[0][0]).include('[Fatal]: Unrecognized option ID: foo-option');
                done();
            });

            new MockCommand(() => {}).createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'mockCommandWithNoOptionModel']);
        });

        it('| should throw an error when option validation fails', async (done) => {
            class MockCommand extends AbstractCommand {
                constructor(optionModel, handle) {
                    super(optionModel);
                    this.handle = handle;
                }

                name() {
                    return 'mockCommand';
                }

                description() {
                    return 'foo description';
                }

                requiredOptions() {
                    return ['foo-option'];
                }

                optionalOptions() {
                    return ['bar-option', 'another-bar-option', 'baz-option'];
                }
            }

            mockProcessExit.callsFake(() => {
                expect(mockConsoleError.args[0][0])
                    .include('[Error]: Please provide valid input for option: foo-option. Field is required and must be set.');
                done();
            });

            new MockCommand(mockOptionModel, () => {}).createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'mockCommand']);
        });

        afterEach(() => {
            sinon.restore();
            AppConfig.dispose();
        });
    });

    describe('# Static method - buildOptionString', () => {
        it('| should be able to build option string from option model', () => {
            const mockModel = {
                name: 'mock-option',
                alias: 'm',
                description: 'mock option',
                stringInput: 'REQUIRED',
            };

            const optionString = AbstractCommand.buildOptionString(mockModel);

            expect(optionString).eq('-m, --mock-option <mock-option>');

            const mockModelWithOptionalStringInput = {
                name: 'mock-option',
                alias: 'm',
                description: 'mock option',
                stringInput: 'OPTIONAL',
            };

            const optionStringWithOptionalStringInput = AbstractCommand.buildOptionString(mockModelWithOptionalStringInput);
            expect(optionStringWithOptionalStringInput).eq('-m, --mock-option [mock-option]');
        });

        it('| should omit the option value when it does not required string input', () => {
            const mockModel = {
                name: 'mock-option',
                alias: 'm',
                description: 'mock option',
            };

            const optionString = AbstractCommand.buildOptionString(mockModel);

            expect(optionString).eq('-m, --mock-option');
        });

        it('| should omit the alias when there is not one', () => {
            const mockModel = {
                name: 'mock-option',
                description: 'mock option',
            };

            const optionString = AbstractCommand.buildOptionString(mockModel);

            expect(optionString).eq('--mock-option');
        });
    });

    describe('# Static method - parseOptionKey', () => {
        it('| should be able to parse option name', () => {
            expect(AbstractCommand.parseOptionKey('skill-id')).eq('skillId');
            expect(AbstractCommand.parseOptionKey('skill')).eq('skill');
        });
    });

    describe('# check AppConfig object ', () => {
        const mockOptionModel = {
            'foo-option': {
                name: 'foo-option',
                description: 'foo option',
                alias: 'f',
                stringInput: 'REQUIRED'
            },
            'bar-option': {
                name: 'bar-option',
                description: 'bar option',
                alias: 'b',
                stringInput: 'REQUIRED'
            },
            'another-bar-option': {
                name: 'another-bar-option',
                description: 'another bar option',
                alias: 'a',
                stringInput: 'OPTIONAL'
            },
            'baz-option': {
                name: 'baz-option',
                description: 'baz option',
                alias: 'z',
                stringInput: 'NONE'
            }
        };

        beforeEach(() => {
            sinon.stub(path, 'join').returns(APP_CONFIG_NO_PROFILES_PATH);
            sinon.stub(process, 'exit');
            sinon.stub(metricClient, 'sendData').resolves();
        });

        it('| should not be null for other commands', async () => {
            class NonConfigureCommand extends AbstractCommand {
                constructor(optionModel, handle) {
                    super(optionModel);
                    this.handle = handle;
                }

                name() {
                    return 'random';
                }

                description() {
                    return 'random description';
                }
            }

            const mockCommand = new NonConfigureCommand(mockOptionModel, (options, cb) => {
                expect(options._name).eq('random');
                expect(options._description).eq('random description');
                expect(options.options).deep.eq([]);
                expect(AppConfig.getInstance().getProfilesList().length).eq(0);
                cb();
            });

            mockCommand.createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'random']);
        });

        it('| should be null for configure command', async () => {
            class ConfigureCommand extends AbstractCommand {
                constructor(optionModel, handle) {
                    super(optionModel);
                    this.handle = handle;
                }

                name() {
                    return 'configure';
                }

                description() {
                    return 'configure description';
                }
            }

            const mockCommand = new ConfigureCommand(mockOptionModel, (options, cb) => {
                expect(options._name).eq('configure');
                expect(options._description).eq('configure description');
                expect(options.options).deep.eq([]);
                expect(AppConfig.getInstance()).eq(null);
                cb();
            });

            mockCommand.createCommand()(commander);
            await commander.parseAsync(['node', 'mock', 'configure']);
        });

        afterEach(() => {
            sinon.restore();
            AppConfig.dispose();
        });
    });
});
