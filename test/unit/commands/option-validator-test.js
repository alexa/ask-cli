const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');

const optionValidator = require('@src/commands/option-validator');
const Messenger = require('@src/view/messenger');

describe('Command test - Option validator test', () => {
    it('| should validate required option value', () => {
        expect(() => { optionValidator.validateRequiredOption({ foo: 'value' }, 'foo'); }).not.throw();
        expect(() => { optionValidator.validateRequiredOption({ foo: 'value' }, 'bar'); }).throw('Field is required and must be set.');
    });

    it('| should validate string option value', () => {
        expect(() => { optionValidator.validateOptionString({ foo: 'value' }, 'foo'); }).not.throw();
        expect(() => { optionValidator.validateOptionString({ foo: 123 }, 'foo'); }).throw('Must be a string.');
        expect(() => { optionValidator.validateOptionString({ foo: ' ' }, 'foo'); }).throw('Value must not be empty.');
    });

    describe('# validate option rules', () => {
        it('| should fallback to no-op if no rules are provided', () => {
            expect(() => { optionValidator.validateOptionRules({ foo: 'value' }, 'foo', []); }).not.throw();
        });

        it('| should fallback to no-op if no rule validator is found for given rule type', () => {
            expect(() => { optionValidator.validateOptionRules({ foo: 'value' }, 'foo', [{ type: 'nonExistentRule' }]); }).not.throw();
        });

        it('| should validate option rule model to have necessary metadata', (done) => {
            const mockConsoleError = sinon.stub(console, 'error');
            const mockProcessExit = sinon.stub(process, 'exit');
            new Messenger({});

            mockProcessExit.callsFake((code) => {
                expect(code).eq(1);
                expect(mockConsoleError.args[0][0]).include('[Fatal]: Option rule model of type "ENUM" requires field "values" to be set!');
                sinon.restore();
                done();
            });

            optionValidator.validateOptionRules(
                {
                    foo: 'value',
                },
                'foo',
                [
                    {
                        type: 'ENUM',
                    }
                ]
            );
        });

        it('| should validate enum value if rule ENUM is given', () => {
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: 'value-a'
                    },
                    'foo',
                    [
                        {
                            type: 'ENUM',
                            values: ['value-a', 'value-b']
                        }
                    ]
                );
            }).not.throw();
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: 'value'
                    },
                    'foo',
                    [
                        {
                            type: 'ENUM',
                            values: ['value-a', 'value-b']
                        }
                    ]
                );
            }).throw('Value must be in (value-a, value-b).');
        });

        it('| should validate regexp value if rule REGEX is given', () => {
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: 'en-US'
                    },
                    'foo',
                    [
                        {
                            type: 'REGEX',
                            regex: '^[a-z]{2}-[A-Z]{2}$'
                        }
                    ]
                );
            }).not.throw();
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: 'value'
                    },
                    'foo',
                    [
                        {
                            type: 'REGEX',
                            regex: '^[a-z]{2}-[A-Z]{2}$'
                        }
                    ]
                );
            }).throw('Input value (value) doesn\'t match REGEX rule ^[a-z]{2}-[A-Z]{2}$.');
        });

        it('| should validate number value if rule NUMBER is given', () => {
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: '123'
                    },
                    'foo',
                    [
                        {
                            type: 'NUMBER'
                        }
                    ]
                );
            }).not.throw();
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: 'abc'
                    },
                    'foo',
                    [
                        {
                            type: 'NUMBER'
                        }
                    ]
                );
            }).throw('Input should be a number.');
        });

        it('| should validate integer value if rule INTEGER is given', () => {
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: '123'
                    },
                    'foo',
                    [
                        {
                            type: 'INTEGER'
                        }
                    ]
                );
            }).not.throw();
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        foo: '123.1'
                    },
                    'foo',
                    [
                        {
                            type: 'INTEGER'
                        }
                    ]
                );
            }).throw('Input number should be an integer.');
        });

        it('| should validate csv file extension if rule FILE_PATH is given', () => {
            sinon.stub(fs, 'accessSync');

            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        file: 'beta-testers.csv'
                    },
                    'file',
                    [
                        {
                            type: 'FILE_PATH',
                            extension: ['.csv']
                        }
                    ]
                );
            }).not.throw();
            expect(() => {
                optionValidator.validateOptionRules(
                    {
                        file: 'beta-testers.txt'
                    },
                    'file',
                    [
                        {
                            type: 'FILE_PATH',
                            extension: ['.csv']
                        }
                    ]
                );
            }).throw('File extension is not of type .csv.');
        });
    });
});
