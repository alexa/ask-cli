const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const os = require('os');
const path = require('path');
const uuid = require('uuid/v4');
const { FILE_PATH, CONFIGURATION, METRICS } = require('@src/utils/constants');

const askFolderPath = path.join(os.homedir(), FILE_PATH.ASK.HIDDEN_FOLDER);
const defaultMetricFilePath = path.join(askFolderPath, FILE_PATH.ASK.METRIC_FILE);

class MetricConfig {
    /**
     * Constructor for MetricConfig class
     * @param {string} filePath
     */
    constructor(filePath = defaultMetricFilePath) {
        // making file path if not exists
        if (!fs.existsSync(filePath)) {
            fs.ensureDirSync(askFolderPath);
            jsonfile.writeFileSync(filePath, { machineId: uuid(), createdAt: new Date() }, { spaces: CONFIGURATION.JSON_DISPLAY_INDENT });
        }
        this.data = JSON.parse(fs.readFileSync(filePath));
    }

    /**
     * Gets machineId property
     * @returns {string}
     */
    get machineId() {
        return this.data.machineId;
    }

    /**
     * Returns boolean indicating if user is new
     * @returns {boolean}
     */
    isNewUser() {
        const { createdAt } = this.data;
        const daysDiff = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
        return daysDiff <= METRICS.NEW_USER_LENGTH_DAYS;
    }
}

module.exports = MetricConfig;
