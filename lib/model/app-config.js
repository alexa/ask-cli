const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const CONSTANTS = require('@src/utils/constants');
const profileHelper = require('@src/utils/profile-helper');
const ConfigFile = require('./abstract-config-file');

const defaultFilePath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);
// instance which stores the singleton
let instance = null;

module.exports = class AppConfig extends ConfigFile {
    /**
     * Constructor for GlobalConfig class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath = defaultFilePath) {
        if (instance && instance.path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        this.isEnvProfile = profileHelper.isEnvProfile();
        if (!this.isEnvProfile) {
            this.read();
        }
        instance = this;
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    static configFileExists() {
        return fs.existsSync(defaultFilePath);
    }

    // getter and setter

    getAwsProfile(profile) {
        return this.getProperty(['profiles', profile, 'aws_profile']);
    }

    setAwsProfile(profile, awsProfile) {
        this.setProperty(['profiles', profile, 'aws_profile'], awsProfile);
    }

    getToken(profile) {
        if (this.isEnvProfile) {
            return {
                access_token: process.env.ASK_ACCESS_TOKEN,
                refresh_token: process.env.ASK_REFRESH_TOKEN
            };
        }
        return this.getProperty(['profiles', profile, 'token']);
    }

    setToken(profile, tokenObject) {
        this.setProperty(['profiles', profile, 'token'], tokenObject);
    }

    getVendorId(profile) {
        return this.isEnvProfile ? process.env.ASK_VENDOR_ID : this.getProperty(['profiles', profile, 'vendor_id']);
    }

    setVendorId(profile, vendorId) {
        this.setProperty(['profiles', profile, 'vendor_id'], vendorId);
    }

    setMachineId(machineId) {
        this.setProperty(['machine_id'], machineId);
    }

    getMachineId() {
        return this.getProperty(['machine_id']);
    }

    getShareUsage() {
        const shareUsage = this.getProperty(['share_usage']);
        if (shareUsage !== undefined) return shareUsage;

        return true;
    }

    /**
     * Returns all profile names and their associated aws profile names (if any) as list of objects.
     * return profilesList. Eg: [{ askProfile: 'askProfile1', awsProfile: 'awsProfile1'}, { askProfile: 'askProfile2', awsProfile: 'awsProfile2'}].
     */
    getProfilesList() {
        const profilesList = [];
        const profilesObj = this.getProperty(['profiles']);
        for (const profile of Object.getOwnPropertyNames(profilesObj)) {
            profilesList.push({
                askProfile: profile,
                awsProfile: profilesObj[profile].aws_profile
            });
        }
        return profilesList;
    }
};
