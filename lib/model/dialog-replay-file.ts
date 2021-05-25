import fs from 'fs-extra';
import R from 'ramda';

import CliFileNotFoundError from '@src/exceptions/cli-file-not-found-error';
import jsonView from '@src/view/json-view';

export default class DialogReplayFile {
    private _filePath: string;
    private _content: any;

    /**
     * Constructor for GlobalConfig class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath: string) {
        this._filePath = filePath;
        this._content = this.readFileContent(this._filePath);
    }

    // Getters and Setters

    getSkillId(): string {
        return this.getProperty(['skillId']);
    }

    setSkillId(skillId: string) {
        return this.setProperty(['skillId'], skillId);
    }

    getLocale(): string {
        return this.getProperty(['locale']);
    }

    setLocale(locale: string) {
        return this.setProperty(['locale'], locale);
    }

    getType() {
        return this.getProperty(['type']);
    }

    setType(type: any) {
        return this.setProperty(['type'], type);
    }

    getUserInput() {
        return this.getProperty(['userInput']);
    }

    setUserInput(userInput: any) {
        return this.setProperty(['userInput'], userInput);
    }

    // TODO: move these operations to a model interface since replay file doesn't support yaml files currently.

    /**
     * Reads contents of a given file. Currently supports files of the following types: .json, .yaml and .yml
     * Throws error if filePath is invalid, file does not have read permissions or is of unsupported file type.
     * @param {String} filePath path to the given file.
     */
    readFileContent(filePath: string) {
        try {
            this.doesFileExist(filePath);
            fs.accessSync(filePath, fs.constants.R_OK);
            return fs.readJsonSync(filePath);
        } catch (error) {
            throw `Failed to parse file: ${filePath}.\n${error.message}`;
        }
    }

    /**
     * Writes contents to a given file. Currently supports files of the following types: .json, .yaml and .yml
     * Throws error if filePath is invalid, file does not have write permissions or is of unsupported file type.
     * @param {Object} content data to ve written to the file
     * @param {String} filePath path to the given file.
     */
    writeContentToFile(content: any, filePath: string) {
        try {
            this.doesFileExist(filePath);
            fs.accessSync(filePath, fs.constants.W_OK);
            fs.writeFileSync(filePath, jsonView.toString(content), 'utf-8');
        } catch (error) {
            throw `Failed to write to file ${filePath}.\n${error.message}`;
        }
    }

    /**
     * Check if the file exists on the given path. Throws error if it doesn't exist.
     * @param {String} filePath path to the given file.
     */
    doesFileExist(filePath: string) {
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
    getProperty(pathArray: string[]) {
        return R.view(R.lensPath(pathArray), this._content);
    }

    /**
     * Set property to the runtime object based on the property array.
     * Create field if path does not exist.
     * @param {string} pathArray
     * @param {string} newValue
     */
    setProperty(pathArray: string[], newValue: string) {
        this._content = R.set(R.lensPath(pathArray), newValue, this._content);
    }
};
