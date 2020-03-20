const fs = require('fs-extra');
const path = require('path');
const R = require('ramda');

const CliFileNotFoundError = require('@src/exceptions/cli-file-not-found-error');
const yaml = require('@src/model/yaml-parser');
const jsonView = require('@src/view/json-view');

module.exports = class DialogReplayFile {
    /**
     * Constructor for GlobalConfig class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath) {
        this.filePath = filePath;
        this.content = this.readFileContent(this.filePath);
    }

    // Getters and Setters

    getSkillId() {
        return this.getProperty(['skillId']);
    }

    setSkillId(skillId) {
        return this.setProperty(['skillId'], skillId);
    }

    getLocale() {
        return this.getProperty(['locale']);
    }

    setLocale(locale) {
        return this.setProperty(['locale'], locale);
    }

    getType() {
        return this.getProperty(['type']);
    }

    setType(type) {
        return this.setProperty(['type'], type);
    }

    getUserInput() {
        return this.getProperty(['userInput']);
    }

    setUserInput(userInput) {
        return this.setProperty(['userInput'], userInput);
    }

    // TODO: move these operations to a model interface since replay file doesn't support yaml files currently.

    /**
     * Reads contents of a given file. Currently supports files of the following types: .json, .yaml and .yml
     * Throws error if filePath is invalid, file does not have read permissions or is of unsupported file type.
     * @param {String} filePath path to the given file.
     */
    readFileContent(filePath) {
        let fileType;
        try {
            fileType = path.extname(filePath).toLowerCase();
            this.doesFileExist(filePath);
            fs.accessSync(filePath, fs.constants.R_OK);
            if (fileType === '.json') {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
            if (fileType === '.yaml' || fileType === '.yml') {
                return yaml.load(filePath);
            }
            throw new Error('ASK CLI does not support this file type.');
        } catch (error) {
            throw `Failed to parse ${fileType} file ${filePath}.\n${error.message}`;
        }
    }

    /**
     * Writes contents to a given file. Currently supports files of the following types: .json, .yaml and .yml
     * Throws error if filePath is invalid, file does not have write permissions or is of unsupported file type.
     * @param {Object} content data to ve written to the file
     * @param {String} filePath path to the given file.
     */
    writeContentToFile(content, filePath) {
        try {
            this.doesFileExist(filePath);
            fs.accessSync(filePath, fs.constants.W_OK);
            const fileType = path.extname(filePath).toLowerCase();
            if (fileType === '.json') {
                fs.writeFileSync(filePath, jsonView.toString(content), 'utf-8');
            } else if (fileType === '.yaml' || fileType === '.yml') {
                yaml.dump(filePath, content);
            } else {
                throw new Error('ASK CLI does not support this file type.');
            }
        } catch (error) {
            throw `Failed to write to file ${filePath}.\n${error.message}`;
        }
    }

    /**
     * Check if the file exists on the given path. Throws error if it doesn't exist.
     * @param {String} filePath path to the given file.
     */
    doesFileExist(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new CliFileNotFoundError(`File ${filePath} not exists.`);
        }
    }

    // TODO: these two methods can be in jsonView since we are reading/modifying JSON content
    /**
     * Get property based on the property array.
     * Return undefined if not found.
     * @param {string} pathArray e.g. ['path', 'to', 'the', '3rd', 'object', 2, 'done']
     */
    getProperty(pathArray) {
        return R.view(R.lensPath(pathArray), this.content);
    }

    /**
     * Set property to the runtime object based on the property array.
     * Create field if path does not exist.
     * @param {string} pathArray
     * @param {string} newValue
     */
    setProperty(pathArray, newValue) {
        this.content = R.set(R.lensPath(pathArray), newValue, this.content);
    }
};
