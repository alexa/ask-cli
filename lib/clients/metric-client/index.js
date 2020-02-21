const uuid = require('uuid/v4');
const axios = require('axios');

const MetricActionResult = {
    SUCCESS: 'Success',
    FAILURE: 'Failure'
};

class MetricAction {
    /**
     * @constructor
     * @param {string} name - The action name.
     * @param {string} type - The action type.
     */
    constructor(name, type) {
        this.endTime = null;
        this.failureMessage = '';
        this.name = name;
        this.result = null;
        this.startTime = new Date();
        this.type = type;
        this.id = uuid();
        this._ended = false;
    }

    /**
     * Closes action
     * @param {Error|string} [error=null] error - Error object or string indicating error.
     */
    end(error = null) {
        if (this._ended) return;

        // if Error object extract error message,
        // otherwise error message string or null was passed as a parameter
        const errorMessage = error && error instanceof Error ? error.message : error;

        this.result = errorMessage ? MetricActionResult.FAILURE : MetricActionResult.SUCCESS;
        this.failureMessage = errorMessage || '';
        this.endTime = new Date();
        this._ended = true;
    }

    /**
     * Implementation of custom toJSON method to modify serialization with JSON.stringify
     */
    toJSON() {
        return {
            end_time: this.endTime,
            failure_message: this.failureMessage,
            name: this.name,
            result: this.result,
            start_time: this.startTime,
            type: this.type,
            id: this.id
        };
    }
}

class MetricClient {
    /**
     * A metric client options
     * @typedef {Object} MetricClientOptions
     * @property {string} version - The application version. Typically, version form package.json
     * @property {string} machineId - The machine id
     * @property {boolean} newUser - is new user
     * @property {string} clientId - The client id. Typically, application name. For example, ask cli.
     * @property {string} serverUrl - The server url where to send metrics data.
     * @property {number} sendTimeout - The send timeout to send data to the metrics server.
     */

    /**
     * @constructor
     * @param {MetricClientOptions} options - The options for constructor
     */
    constructor(options) {
        const { version, machineId, newUser, clientId, serverUrl, sendTimeout, enabled } = options;
        this.httpClient = axios.create({
            timeout: sendTimeout || 3000,
            headers: { 'Content-Type': 'text/plain' }
        });
        this.serverUrl = serverUrl;
        this.postRetries = 3;
        this.enabled = enabled !== false;
        this.data = {
            version,
            machineId,
            timeStarted: new Date(),
            newUser,
            timeUploaded: null,
            clientId,
            actions: []
        };
    }

    /**
     * Starts action
     * @param {string} name - The action name
     * @param {string} type - The action type
     * @return {MetricAction}
     */
    startAction(name, type) {
        const action = new MetricAction(name, type);
        this.data.actions.push(action);
        return action;
    }

    /**
     * Returns current data store in the metric client
     * @return {{version: string, machineId: string, timeStarted: Date,
     * newUser: boolean, timeUploaded: Date|null, clientId: string, actions: MetricAction[]}}
     */
    getData() {
        return this.data;
    }

    /**
     * Sends data to the metric server
     * @param {Error|string} [error=null] error - Error object or string indicating error.
     * @returns {Promise<{success: boolean}>}
     */
    sendData(error = null) {
        if (!this.enabled) {
            this.data.actions = [];
            return new Promise(resolve => resolve({ success: true }));
        }
        this.data.actions.forEach(action => action.end(error));
        return this._upload()
            .then(() => {
                this.data.actions = [];
                return { success: true };
            })
            .catch(() => ({ success: false }));
    }

    /**
     * Implementation of custom toJSON method to modify serialization with JSON.stringify
     */
    toJSON() {
        return {
            version: this.data.version,
            machine_id: this.data.machineId,
            time_started: this.data.timeStarted,
            new_user: this.data.newUser,
            time_uploaded: this.data.timeUploaded,
            client_id: this.data.clientId,
            actions: this.data.actions
        };
    }

    _upload() {
        this.data.timeUploaded = new Date();
        const payload = JSON.stringify({ payload: this });
        const postPromise = () => this.httpClient.post(this.serverUrl, payload);
        return this._retry(this.postRetries, postPromise);
    }

    _retry(retries, fn) {
        return fn().catch(err => (retries > 1 ? this._retry(retries - 1, fn) : Promise.reject(err)));
    }
}

module.exports = { MetricClient, MetricActionResult };
