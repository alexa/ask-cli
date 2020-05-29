const ConfigFile = require('../abstract-config-file');

// instance which stores the singleton
let instance = null;

const BASE = {
    askcliResourcesVersion: '2020-03-31',
    profiles: {}
};

module.exports = class AskResources extends ConfigFile {
    /**
     * Constructor for AskResources class
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

    static withContent(filePath, content = BASE) {
        super.withContent(filePath, content);
        new AskResources(filePath);
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    // getter and setter

    getProfile(profile) {
        return this.getProperty(['profiles', profile]);
    }

    setProfile(profile, profileObj) {
        this.setProperty(['profiles', profile], profileObj);
    }

    // Group for the "skillMetadata"
    getSkillMetaSrc(profile) {
        return this.getProperty(['profiles', profile, 'skillMetadata', 'src']);
    }

    setSkillMetaSrc(profile, skillMetaSrc) {
        this.setProperty(['profiles', profile, 'skillMetadata', 'src'], skillMetaSrc);
    }

    // Group for the "code"
    getCodeRegions(profile) {
        return Object.keys(this.getProperty(['profiles', profile, 'code']) || []);
    }

    getCodeSrcByRegion(profile, region) {
        return this.getProperty(['profiles', profile, 'code', region, 'src']);
    }

    setCodeSrcByRegion(profile, region, src) {
        this.setProperty(['profiles', profile, 'code', region, 'src'], src);
    }

    // Group for the "skillInfrastructure"
    getSkillInfraType(profile) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'type']);
    }

    setSkillInfraType(profile, type) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'type'], type);
    }

    getSkillInfraUserConfig(profile) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'userConfig']);
    }

    setSkillInfraUserConfig(profile, userConfig) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'userConfig'], userConfig);
    }
};

module.exports.BASE = BASE;
