const ConfigFile = require('./abstract-config-file');

// instance which stores the singleton
let instance = null;

const TYPE_AWS_LAMBDA_FUNCTION = 'AWS::Lambda::Function';
const ERROR_MSG_RESOURCES_FIELD_EMPTY = '[Error]: Resources field must not be empty in regional template file';

module.exports = class RegionalStackFile extends ConfigFile {
    /**
     * Constructor for RegionalStackFile class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath) {
        if (instance && instance.path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        this.read();
        instance = this;
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    getResources() {
        return this.getProperty(['Resources']);
    }

    getLambdaFunction() {
        const resources = this.getResources();
        if (!resources) {
            return null;
        }

        for (const logicalId of Object.keys(resources)) {
            if (resources[logicalId] && resources[logicalId].Type === TYPE_AWS_LAMBDA_FUNCTION) {
                return this.getProperty(['Resources', logicalId]);
            }
        }
        return null;
    }

    setLambdaFunctionCode(bucket, key, version) {
        const resources = this.getResources();
        if (!resources) {
            throw new Error(ERROR_MSG_RESOURCES_FIELD_EMPTY);
        }
        for (const logicalId of Object.keys(resources)) {
            if (resources[logicalId] && resources[logicalId].Type === TYPE_AWS_LAMBDA_FUNCTION) {
                this.setProperty(['Resources', logicalId, 'Properties', 'Code', 'S3Bucket'], bucket);
                this.setProperty(['Resources', logicalId, 'Properties', 'Code', 'S3Key'], key);
                this.setProperty(['Resources', logicalId, 'Properties', 'Code', 'S3ObjectVersion'], version);
                break;
            }
        }
    }
};
