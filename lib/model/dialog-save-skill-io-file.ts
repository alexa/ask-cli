import fs from 'fs-extra';
import jsonView from '@src/view/json-view';
import R from 'ramda';

export default class DialogSaveSkillIoFile {
    private _filePath: string;
    private _content: any;
    private _currentInvocation: any;

    /**
     * Constructor for DialogSaveSkillIoFile class
     * @param {string} filePath
     */
    constructor(filePath: string) {
        this._filePath = filePath;
        this._content = { invocations: [] };
    }

    /**
     * Adds invocation start request to in memory invocation list
     * @param {*} request invocation request
     */
    startInvocation(request: any) {
        this._currentInvocation = { request: {}, response: {} };
        this._currentInvocation.request = request;
    }

    /**
     * Adds invocation end response to in memory invocation list
     * @param {*} response invocation response
     */
    endInvocation(response: any) {
        if (!this._currentInvocation) {
            this._currentInvocation = { response: {} };
        }
        this._currentInvocation.response = response;
        this._content.invocations.push(R.clone(this._currentInvocation));
    }

    /**
     * Saves invocation list to a file
     */
    save() {
        if (this._filePath) {
            fs.writeFileSync(this._filePath, jsonView.toString(this._content), 'utf-8');
        }
    }
}
