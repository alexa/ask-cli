import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import * as CONSTANTS from '@src/utils/constants';
import profileHelper from '@src/utils/profile-helper';
import ConfigFile from './abstract-config-file';

const defaultFilePath = path.join(os.homedir(), CONSTANTS.FILE_PATH.ASK.HIDDEN_FOLDER, CONSTANTS.FILE_PATH.ASK.PROFILE_FILE);
// instance which stores the singleton
let instance: AppConfig | null = null;

export default class AppConfig extends ConfigFile {
    private _isEnvProfile?: boolean;

    /**
     * Constructor for GlobalConfig class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath: string = defaultFilePath) {
        if (instance && instance._path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        this._isEnvProfile = false;
        this._isEnvProfile = profileHelper.isEnvProfile();
        if (!this._isEnvProfile) {
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

    getAwsProfile(profile: string) {
        return this.getProperty(['profiles', profile, 'aws_profile']);
    }

    setAwsProfile(profile: string, awsProfile: string) {
        this.setProperty(['profiles', profile, 'aws_profile'], awsProfile);
    }

    getToken(profile: string) {
        if (this._isEnvProfile) {
            return {
                access_token: process.env.ASK_ACCESS_TOKEN,
                refresh_token: process.env.ASK_REFRESH_TOKEN
            };
        }
        return this.getProperty(['profiles', profile, 'token']);
    }

    setToken(profile: string, tokenObject: any) {
        this.setProperty(['profiles', profile, 'token'], tokenObject);
    }

    getVendorId(profile: string) {
        return this._isEnvProfile ? process.env.ASK_VENDOR_ID : this.getProperty(['profiles', profile, 'vendor_id']);
    }

    setVendorId(profile: string, vendorId: any) {
        this.setProperty(['profiles', profile, 'vendor_id'], vendorId);
    }

    setMachineId(machineId: any) {
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
