const { expect } = require('chai');
const sinon = require('sinon');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const yamlLibrary = require('js-yaml');

const yaml = require('@src/model/yaml-parser');

describe('Model test - yaml parser', () => {
    const FIXTURE_PATH = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model');
    const YAML_FILE_PATH = path.join(FIXTURE_PATH, 'yaml-config.yaml');
    const YAML_JSON_RESULT_PATH = path.join(FIXTURE_PATH, 'yaml-json-result.json');
    const YAML_JSON_RESULT = jsonfile.readFileSync(YAML_JSON_RESULT_PATH);

    describe('# test yaml load function', () => {
        it('| load yaml file correctly', () => {
            const content = yaml.load(YAML_FILE_PATH);
            expect(content).deep.equal(YAML_JSON_RESULT);
        });

        it('| load yaml file throws error', () => {
            // setup
            sinon.stub(yamlLibrary, 'load').throws(new Error('load error'));
            try {
                // call
                yaml.load(YAML_FILE_PATH);
            } catch (e) {
                // verify
                expect(e.message).to.equal('load error');
            }
            // clear
            sinon.restore();
        });
    });

    describe('# test yaml dump function', () => {
        if (process.platform !== 'win32') {
            it('| dump yaml file correctly', () => {
                const FROM_JSON_PATH = path.join(FIXTURE_PATH, 'yaml-from-json-result.yaml');
                yaml.dump(FROM_JSON_PATH, YAML_JSON_RESULT);
                expect(fs.readFileSync(FROM_JSON_PATH, 'utf8')).equal(fs.readFileSync(YAML_FILE_PATH, 'utf8'));
            });
        }

        it('| dump yaml file throws error', () => {
            // setup
            sinon.stub(yamlLibrary, 'dump').throws(new Error('dump error'));
            const FROM_JSON_PATH = path.join(FIXTURE_PATH, 'yaml-from-json-result.yaml');
            try {
                // call
                yaml.dump(FROM_JSON_PATH, YAML_JSON_RESULT);
            } catch (e) {
                // verify
                expect(e.message).to.equal('dump error');
            }
            // clear
            sinon.restore();
        });
    });
});
