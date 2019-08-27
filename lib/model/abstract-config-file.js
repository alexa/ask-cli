const R = require('ramda');
const fs = require('fs');
const path = require('path');

const jsonView = require('@src/view/json-view');
const yaml = require('./yaml-parser');

const FILE_TYPE_JSON = 'JSON';
const FILE_TYPE_YAML = 'YAML';

const READ_METHOD_BY_FILE_TYPE = {
    JSON: (filePath) => {
        try {
            return JSON.parse(fs.readFileSync(filePath));
        } catch (error) {
            throw new Error(`Failed to parse JSON file ${filePath}.\n${error}`);
        }
    },
    YAML: (filePath) => {
        try {
            return yaml.load(filePath);
        } catch (error) {
            throw new Error(`Failed to parse YAML file ${filePath}.\n${error}`);
        }
    }
};

const WRITE_METHOD_BY_FILE_TYPE = {
    JSON: (filePath, content) => {
        try {
            fs.writeFileSync(filePath, jsonView.toString(content), 'utf-8');
        } catch (error) {
            throw error;
        }
    },
    YAML: (filePath, content) => {
        try {
            yaml.dump(filePath, content);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = class ConfigFile {
    /**
     * Constructor function for ConfigFile. Current support JSON and YAML.
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath) {
        try {
            this.path = filePath;
            this.content = null;
            this.fileType = null;

            this._validateFilePath();
            this.read();
        } catch (error) {
            throw error;
        }
    }

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

    /**
     * Write file according to the file path and serialize it based on file extname
     */
    write() {
        WRITE_METHOD_BY_FILE_TYPE[this.fileType](this.path, this.content);
    }

    /**
     * Read from file path and deserialize it based on file extname
     */
    read() {
        this.content = READ_METHOD_BY_FILE_TYPE[this.fileType](this.path);
    }

    _validateFilePath() {
        // check existence
        if (!fs.existsSync(this.path)) {
            throw new Error(`File ${this.path} not exists.`);
        }
        // check access permission
        try {
            fs.accessSync(this.path, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
            throw new Error(`No access to read/write file ${this.path}.`);
        }
        // check file extension
        if (path.extname(this.path).toLowerCase() === '.json') {
            this.fileType = FILE_TYPE_JSON;
        } else if (path.extname(this.path).toLowerCase() === '.yaml' || path.extname(this.path).toLowerCase() === '.yml') {
            this.fileType = FILE_TYPE_YAML;
        } else {
            throw new Error(`File type for ${this.path} is not supported. Only JSON and YAML files are supported.`);
        }
    }
};
