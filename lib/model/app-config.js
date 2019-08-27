const ConfigFile = require('./abstract-config-file');

// instance which stores the singleton
let instance = null;

module.exports = class AppConfig extends ConfigFile {
    /**
     * Constructor for GlobalConfig class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath) {
        if (instance && instance.path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        instance = this;
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    // getter and setter

    getAwsProfile(profile) {
        return this.getProperty(['profiles', profile, 'aws_profile']);
    }

    setAwsProfile(profile, awsProfile) {
        this.setProperty(['profiles', profile, 'aws_profile'], awsProfile);
    }

    getToken(profile) {
        return this.getProperty(['profiles', profile, 'token']);
    }

    setToken(profile, tokenObject) {
        this.setProperty(['profiles', profile, 'token'], tokenObject);
    }

    getVendorId(profile) {
        return this.getProperty(['profiles', profile, 'vendor_id']);
    }

    setVendorId(profile, vendorId) {
        this.setProperty(['profiles', profile, 'vendor_id'], vendorId);
    }
};
