const fs = require('fs-extra');
const jsonView = require('@src/view/json-view');
const R = require('ramda');

class DialogSaveSkillIoFile {
    /**
     * Constructor for DialogSaveSkillIoFile class
     * @param {string} filePath
     */
    constructor(filePath) {
        this.filePath = filePath;
        this.content = { invocations: [] };
    }

    /**
     * Adds invocation start request to in memory invocation list
     * @param {*} request invocation request
     */
    startInvocation(request) {
        this.currentInvocation = { request: {}, response: {} };
        this.currentInvocation.request = request;
    }

    /**
     * Adds invocation end response to in memory invocation list
     * @param {*} response invocation response
     */
    endInvocation(response) {
        if (!this.currentInvocation) {
            this.currentInvocation = { response: {} };
        }
        this.currentInvocation.response = response;
        this.content.invocations.push(R.clone(this.currentInvocation));
    }

    /**
     * Saves invocation list to a file
     */
    save() {
        if (this.filePath) {
            fs.writeFileSync(this.filePath, jsonView.toString(this.content), 'utf-8');
        }
    }
}

module.exports = DialogSaveSkillIoFile;
