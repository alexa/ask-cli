import R from 'ramda';
import fs from 'fs-extra';
import path from 'path';

import CliFileNotFoundError from '@src/exceptions/cli-file-not-found-error';
import jsonView from '@src/view/json-view';

import yaml from './yaml-parser';

const FILE_EXTNAME_JSON = '.json';
const FILE_EXTNAME_YAML = '.yaml';
const FILE_EXTNAME_YML = '.yml';
const FILE_TYPE_JSON = 'JSON';
const FILE_TYPE_YAML = 'YAML';

const READ_METHOD_BY_FILE_TYPE: any = {
    JSON: (filePath: string) => {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
            throw new Error(`Failed to parse JSON file ${filePath}.\n${error}`);
        }
    },
    YAML: (filePath: string) => {
        try {
            return yaml.load(filePath);
        } catch (error) {
            throw new Error(`Failed to parse YAML file ${filePath}.\n${error}`);
        }
    }
};

const WRITE_METHOD_BY_FILE_TYPE = {
    JSON: (filePath: string, content: any) => {
        fs.writeFileSync(filePath, jsonView.toString(content), 'utf-8');
    },
    YAML: (filePath: string, content: any) => {
        yaml.dump(filePath, content);
    }
};

export default class ConfigFile {
    protected _path: string;
    protected _fileNotFoundHintMessage: string;
    private _content: any;
    private _fileType: 'JSON' | 'YAML';

    /**
     * Constructor function for ConfigFile. Current support JSON and YAML.
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath: string) {
        this._path = filePath;
        this._content = null;
        this._fileType = 'JSON';
        this._fileNotFoundHintMessage = '';
    }

    /**
     * Write content to file path using ConfigFile's WRITE_METHODs
     * @param {String} filePath
     * @param {Object} content
     */
    static withContent(filePath: string, content: any) {
        // ensure file exits with content
        if (fs.existsSync(filePath)) {
            throw new Error(`Failed to create file ${filePath} as it already exists.`);
        }
        fs.ensureDirSync(path.dirname(filePath));
        const fileType = _resolveFileType(filePath);
        WRITE_METHOD_BY_FILE_TYPE[fileType](filePath, content);
    }

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
    setProperty(pathArray: string[], newValue: any) {
        this._content = R.set(R.lensPath(pathArray), newValue, this._content);
    }

    /**
     * Write file according to the file path and serialize it based on file extname
     */
    write() {
        WRITE_METHOD_BY_FILE_TYPE[this._fileType](this._path, this._content);
    }

    /**
     * Read from file path and deserialize it based on file extname
     */
    read() {
        this._validateFilePath();
        this._fileType = _resolveFileType(this._path);
        this._content = READ_METHOD_BY_FILE_TYPE[this._fileType](this._path);
    }

    _validateFilePath() {
        // check existence
        if (!fs.existsSync(this._path)) {
            throw new CliFileNotFoundError(`File ${this._path} not exists.${this._fileNotFoundHintMessage}`);
        }
        // check access permission
        try {
            fs.accessSync(this._path, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
            throw new Error(`No access to read/write file ${this._path}.`);
        }
    }
};

function _resolveFileType(filePath: string) {
    if (path.basename(filePath) === 'cli_config') {
        return FILE_TYPE_JSON;
    }
    // check file extension
    const fileExtension = path.extname(filePath).toLowerCase();
    if (fileExtension === FILE_EXTNAME_JSON) {
        return FILE_TYPE_JSON;
    }
    if (fileExtension === FILE_EXTNAME_YAML || fileExtension === FILE_EXTNAME_YML) {
        return FILE_TYPE_YAML;
    }

    throw new Error(`File type for ${filePath} is not supported. Only JSON and YAML files are supported.`);
}
