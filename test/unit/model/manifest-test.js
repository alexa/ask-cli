const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

const Manifest = require('@src/model/manifest');

describe('Model test - manifest file test', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const MANIFEST_FILE = path.join(FIXTURE_PATH, 'manifest.json');

    describe('# inspect correctness for constructor, getInstance and dispose', () => {
        const NOT_EXISTING_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'out-of-noWhere.json');
        const INVALID_JSON_PROJECT_CONFIG_PATH = path.join(FIXTURE_PATH, 'invalid-json.json');

        it('| initiate as a Manifest class', () => {
            const manifest = new Manifest(MANIFEST_FILE);
            expect(manifest).to.be.instanceof(Manifest);
        });

        it('| make sure Manifest class is singleton', () => {
            const manifest1 = new Manifest(MANIFEST_FILE);
            const manifest2 = new Manifest(MANIFEST_FILE);
            expect(manifest1 === manifest2).equal(true);
        });

        it('| get instance function return the instance constructed before', () => {
            const manifest = new Manifest(MANIFEST_FILE);
            expect(Manifest.getInstance() === manifest).equal(true);
        });

        it('| dispose the instance correctly', () => {
            new Manifest(MANIFEST_FILE);
            Manifest.dispose();
            expect(Manifest.getInstance()).equal(null);
        });

        it('| init with a file path not existing, expect correct error message thrown', () => {
            try {
                new Manifest(NOT_EXISTING_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `File ${NOT_EXISTING_PROJECT_CONFIG_PATH} not exists.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        it('| init with a file path without access permission, expect correct error message thrown', () => {
            // setup
            fs.chmodSync(MANIFEST_FILE, 0o111);
            try {
                // call
                new Manifest(MANIFEST_FILE);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                // verify
                const expectedError = `No access to read/write file ${MANIFEST_FILE}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            } finally {
                // clear
                fs.chmodSync(MANIFEST_FILE, 0o644);
            }
        });

        it('| init with a invalid json file, expect correct error message thrown', () => {
            try {
                new Manifest(INVALID_JSON_PROJECT_CONFIG_PATH);
                throw new Error('No error caught but supposed to throw an error when new.');
            } catch (err) {
                const expectedError = `Failed to parse JSON file ${INVALID_JSON_PROJECT_CONFIG_PATH}.`;
                expect(err.message.indexOf(expectedError) !== -1).equal(true);
            }
        });

        afterEach(() => {
            Manifest.dispose();
        });
    });

    describe('# inspect correctness for getter and setter for different fields', () => {
        beforeEach(() => {
            new Manifest(MANIFEST_FILE);
        });

        [
            {
                field: 'PublishingLocales',
                input: [],
                newValue: 'locales new',
                oldValue: {
                    'de-DE': {
                        summary: 'one sentence description',
                        examplePhrases: [
                            'This is good',
                            'no icon'
                        ],
                        name: 'skillName de',
                        description: 'skill description'
                    },
                    'en-US': {
                        summary: 'Sample Short Description',
                        examplePhrases: [
                            'Alexa open hello world',
                            'Alexa tell hello world hello',
                            'Alexa ask hello world say hello'
                        ],
                        name: 'skillName us',
                        description: 'Sample Full Description'
                    },
                    'ja-JP': {
                        summary: 'coniqiwa',
                        examplePhrases: [
                            'More to come',
                            'coniqiwa'
                        ],
                        name: 'skillName jp',
                        description: 'coniqiwa'
                    }
                }
            },
            {
                field: 'PublishingLocale',
                input: ['de-DE'],
                newValue: 'locale new',
                oldValue: {
                    summary: 'one sentence description',
                    examplePhrases: [
                        'This is good',
                        'no icon'
                    ],
                    name: 'skillName de',
                    description: 'skill description'
                }
            },
            {
                field: 'Apis',
                input: [],
                newValue: 'apis new',
                oldValue: {
                    custom: {
                        endpoint: {
                            url: 'TEST_URL1'
                        },
                        interfaces: [{
                            type: 'VIDEO_APP'
                        }],
                        regions: {
                            EU: {
                                endpoint: {
                                    url: 'TEST_URL2'
                                }
                            }
                        }
                    }
                }
            },
            {
                field: 'ApisDomain',
                input: ['custom'],
                newValue: 'apisDomain new',
                oldValue: {
                    endpoint: {
                        url: 'TEST_URL1'
                    },
                    interfaces: [{
                        type: 'VIDEO_APP'
                    }],
                    regions: {
                        EU: {
                            endpoint: {
                                url: 'TEST_URL2'
                            }
                        }
                    }
                }
            },
            {
                field: 'ApisEndpointByDomainRegion',
                input: ['custom', 'default'],
                newValue: 'endpoint new default',
                oldValue: {
                    url: 'TEST_URL1'
                }
            },
            {
                field: 'ApisEndpointByDomainRegion',
                input: ['custom', 'EU'],
                newValue: 'endpoint new EU',
                oldValue: {
                    url: 'TEST_URL2'
                }
            }
        ].forEach(({
            field,
            input,
            newValue,
            oldValue
        }) => {
            it(`test get${field} function successfully`, () => {
                expect(Manifest.getInstance()[`get${field}`](...input)).deep.equal(oldValue);
            });

            it(`test set${field} function successfully`, () => {
                Manifest.getInstance()[`set${field}`](...input, newValue);
                expect(Manifest.getInstance()[`get${field}`](...input)).equal(newValue);
            });
        });

        afterEach(() => {
            Manifest.dispose();
        });
    });

    describe('# verify generic functionality of manifest file', () => {
        describe('# verify function getSkillName', () => {
            it('| locale en-US exists, expect use skill name by en-US', () => {
                new Manifest(MANIFEST_FILE);
                expect(Manifest.getInstance().getSkillName()).equal('skillName us');
                Manifest.dispose();
            });

            it('| en-US does not exist, expect use the first locale in locale list', () => {
                new Manifest(MANIFEST_FILE);
                Manifest.getInstance().setPublishingLocale('en-US', undefined);
                expect(Manifest.getInstance().getSkillName()).equal('skillName de');
                Manifest.dispose();
            });
        });
    });
});
